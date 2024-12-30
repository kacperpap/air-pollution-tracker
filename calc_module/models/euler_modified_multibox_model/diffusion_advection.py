import numpy as np

from utils import log_with_time

def extend_grid_with_buffer(C, S_c, K_x, K_y, u, v, nx, ny):
    C_extended = np.pad(C, pad_width=1, mode='constant', constant_values=0)
    S_c_extended = np.pad(S_c, pad_width=1, mode='constant', constant_values=0)
    K_x_extended = np.pad(K_x, pad_width=1, mode='edge')
    K_y_extended = np.pad(K_y, pad_width=1, mode='edge')
    u_extended = np.pad(u, pad_width=1, mode='edge')
    v_extended = np.pad(v, pad_width=1, mode='edge')
    return C_extended, S_c_extended, K_x_extended, K_y_extended, u_extended, v_extended, nx + 2, ny + 2

def trim_grid_to_original(C_extended, nx, ny):
    return C_extended[1:nx-1, 1:ny-1]


def update_concentration_crank_nicolson(C, u, v, K_x, K_y, dx, dy, dt, S_c, nx, ny, max_iter=20, tol=1e-4, decay_rate=0.01):

    C, S_c, K_x, K_y, u, v, nx, ny = extend_grid_with_buffer(C, S_c, K_x, K_y, u, v, nx, ny)

    C_new = C.copy()
    decay_factor = np.exp(-decay_rate * dt / 3600)
        
    for it in range(max_iter):
        
        C_prev = C_new.copy()  
        
        for i in range(1, nx - 1):
            for j in range(1, ny - 1):
                # Konwekcja (transport przez wiatr) dla Cranka-Nicolsona (średnie wartości między krokami n a n+1)
                # --- Advection: Upwind Differencing ---
                if u[i, j] > 0:
                    conv_x_n = -u[i, j] * (C[i, j] - C[i-1, j]) / dx
                else:
                    conv_x_n = -u[i, j] * (C[i+1, j] - C[i, j]) / dx

                if v[i, j] > 0:
                    conv_y_n = -v[i, j] * (C[i, j] - C[i, j-1]) / dy
                else:
                    conv_y_n = -v[i, j] * (C[i, j+1] - C[i, j]) / dy

                if u[i, j] > 0:
                    conv_x_np1 = -u[i, j] * (C_prev[i, j] - C_prev[i-1, j]) / dx
                else:
                    conv_x_np1 = -u[i, j] * (C_prev[i+1, j] - C_prev[i, j]) / dx

                if v[i, j] > 0:
                    conv_y_np1 = -v[i, j] * (C_prev[i, j] - C_prev[i, j-1]) / dy
                else:
                    conv_y_np1 = -v[i, j] * (C_prev[i, j+1] - C_prev[i, j]) / dy


                # Dyfuzja dla Cranka-Nicolsona
                diff_x_n = K_x[i, j] * ((C[i+1, j] - C[i, j]) - (C[i, j] - C[i-1, j])) / (dx**2)
                diff_y_n = K_y[i, j] * ((C[i, j+1] - C[i, j]) - (C[i, j] - C[i, j-1])) / (dy**2)

                diff_x_np1 = K_x[i, j] * ((C_prev[i+1, j] - C_prev[i, j]) - (C_prev[i, j] - C_prev[i-1, j])) / (dx**2)
                diff_y_np1 = K_y[i, j] * ((C_prev[i, j+1] - C_prev[i, j]) - (C_prev[i, j] - C_prev[i, j-1])) / (dy**2)

                # Uśrednienie między krokami n i n+1
                conv_x = 0.5 * (conv_x_n + conv_x_np1)
                conv_y = 0.5 * (conv_y_n + conv_y_np1)

                diff_x = 0.5 * (diff_x_n + diff_x_np1)
                diff_y = 0.5 * (diff_y_n + diff_y_np1)

                # Źródło emisji pozostaje bez zmian
                source = S_c[i, j]

                # Aktualizacja wszystkich stężeń
                C_new[i, j] = C[i, j] + dt * (conv_x + conv_y + diff_x + diff_y)
                
                # Uwzględnienie mechanizmu rozpadu i emisji
                C_new[i, j] = C_new[i, j] * decay_factor + source * dt

        
        # Sprawdzenie konwergencji
        max_diff = np.max(np.abs(C_new - C_prev))
        if max_diff < tol:
            break
            
    C_trimmed = trim_grid_to_original(C_new, nx, ny)

    return C_trimmed


def calculate_stable_dt(u, v, K_x, K_y, dx, dy):

    u_max = np.max(np.abs(u))
    v_max = np.max(np.abs(v))
    K_max = max(np.max(K_x), np.max(K_y))

    dt_advection_x = dx / (u_max + 1e-10) 
    dt_advection_y = dy / (v_max + 1e-10)
    dt_diffusion_x = (dx ** 2) / (2 * K_max + 1e-10)
    dt_diffusion_y = (dy ** 2) / (2 * K_max + 1e-10)

    dt_stable = min(dt_advection_x, dt_advection_y, dt_diffusion_x, dt_diffusion_y)

    return dt_stable


def calculate_diffusion_coefficients(pollutant, temperatures, pressures, u_wind, v_wind, z_levels=None, 
                                     box_size=1.0, surface_roughness=0.1, method="turbulent"):
    
    if method == "molecular":
        K = molecular_diffusion_coefficients_grid(pollutant, temperatures, pressures)
    elif method == "turbulent":
        if z_levels is None:
            raise ValueError("z_levels must be provided for turbulent diffusion.")
        K = turbulent_diffusion_coefficients_grid(u_wind, v_wind, z_levels, surface_roughness=surface_roughness)
    else:
        raise ValueError(f"Unsupported diffusion method: {method}")

    K_scaled = K * box_size
    
    return K_scaled


def molecular_diffusion_coefficients_grid(pollutant, temperatures, pressures):
    coefficients = {
        "CO": {"D_0": 0.16, "exponent": 1.75},
        "NO2": {"D_0": 0.14, "exponent": 1.76},
        "SO2": {"D_0": 0.15, "exponent": 1.78},
        "O3": {"D_0": 0.11, "exponent": 1.82},
    }

    if pollutant not in coefficients:
        raise ValueError(f"Unknown pollutant: {pollutant}")

    coeffs = coefficients[pollutant]
    D_0 = coeffs['D_0'] / 10000  # Convert from cm^2/s to m^2/s
    exponent = coeffs['exponent']

    T_kelvin = temperatures + 273.15
    K_grid = D_0 * (T_kelvin / 293.15) ** exponent

    return K_grid


def turbulent_diffusion_coefficients_grid(u_wind, v_wind, z_levels=10, alpha=0.4, surface_roughness=0.1):
    """
    Calculate turbulent diffusion coefficients using Monin-Obukhov similarity theory.
    
    Parameters:
        u_wind (2D array): Horizontal wind component (u)
        v_wind (2D array): Horizontal wind component (v)
        z_levels (float): Reference height in meters (typically measurement height)
        alpha (float): von Kármán constant (default 0.4)
        surface_roughness (float): Surface roughness length in meters (z0)
                                 Typical values:
                                 - 0.0002 (sea)
                                 - 0.03 (grass)
                                 - 0.1 (low crops)
                                 - 0.25 (high crops)
                                 - 1-2 (urban)
    
    Returns:
        2D array: Turbulent diffusion coefficients grid (m²/s)
    """
    
    u_wind = np.array(u_wind, dtype=np.float64)
    v_wind = np.array(v_wind, dtype=np.float64)

    wind_speed = np.sqrt(u_wind**2 + v_wind**2)
    
    # Calculate friction velocity (u*)
    # Using log law relationship
    u_star = (alpha * wind_speed) / (np.log(z_levels / surface_roughness) + 1e-10)
    
    # Calculate eddy diffusivity
    # K = k * u* * z * phi(z/L)
    # For neutral conditions, phi(z/L) = 1
    K_grid = alpha * u_star * z_levels

    return K_grid





