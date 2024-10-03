import os
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime

from models.euler_modified_multiboxes_model.Procedural.grid_and_interpolation import create_multibox_grid_with_interpolated_measurements


def update_concentration_crank_nicolson(C, u, v, K_x, K_y, dx, dy, dt, S_c, nx, ny, max_iter=20, tol=1e-4, verbose=False):
    """
    Aktualizuje stężenie zanieczyszczeń w każdym pudełku na podstawie metody Cranka-Nicolsona,
    z dodatkowym wypisywaniem wyników obliczeń dla celów debugowania.

    Parametry:
    - C: 2D macierz (nx, ny) stężenia zanieczyszczeń.
    - u: 2D macierz (nx, ny) prędkości wiatru w kierunku x.
    - v: 2D macierz (nx, ny) prędkości wiatru w kierunku y.
    - K_x: 2D macierz współczynnika dyfuzji w kierunku x.
    - K_y: 2D macierz współczynnika dyfuzji w kierunku y.
    - dx, dy: wymiary pudełka.
    - dt: krok czasowy.
    - S_c: źródła emisji zanieczyszczeń.
    - nx, ny: liczba pudełek w kierunku x i y.
    - max_iter: maksymalna liczba iteracji Picarda.
    - tol: tolerancja konwergencji.
    - verbose: czy wyświetlać szczegółowe wyniki obliczeń.

    Zwraca:
    - Zaktualizowana macierz stężenia C.
    """
    C_new = C.copy()
    
    for it in range(max_iter):
        C_prev = C_new.copy()  
        
        if verbose:
            print(f"--- Iteracja {it+1} ---")

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

                # Zaktualizowane stężenie (iteracyjne rozwiązanie)
                C_new[i, j] = C[i, j] + dt * (conv_x + conv_y + diff_x + diff_y + source)

                # Jeśli verbose=True, wypisz szczegółowe informacje dla każdego kroku
                if verbose:
                    print(f"Pudełko [{i},{j}]:")
                    print(f"  C[{i},{j}] = {C[i, j]}")
                    print(f"  conv_x_n = {conv_x_n}, conv_x_np1 = {conv_x_np1}, conv_x = {conv_x}")
                    print(f"  conv_y_n = {conv_y_n}, conv_y_np1 = {conv_y_np1}, conv_y = {conv_y}")
                    print(f"  diff_x_n = {diff_x_n}, diff_x_np1 = {diff_x_np1}, diff_x = {diff_x}")
                    print(f"  diff_y_n = {diff_y_n}, diff_y_np1 = {diff_y_np1}, diff_y = {diff_y}")
                    print(f"  source = {source}")
                    print(f"  C_new[{i},{j}] = {C_new[i, j]}")
                    print()

        # Sprawdzenie konwergencji
        max_diff = np.max(np.abs(C_new - C_prev))
        if verbose:
            print(f"Max różnica między krokami iteracyjnymi: {max_diff}")

        if max_diff < tol:
            if verbose:
                print(f"Konwergencja osiągnięta po {it+1} iteracjach.")
            break

    return C_new

def calculate_stable_dt(u, v, K_x, K_y, dx, dy):
    """
    Oblicza stabilny krok czasowy dt na podstawie kryterium CFL.
    
    Parametry:
    - u: 2D macierz prędkości wiatru w kierunku x.
    - v: 2D macierz prędkości w kierunku y.
    - K_x: 2D macierz współczynnika dyfuzji w kierunku x.
    - K_y: 2D macierz współczynnika dyfuzji w kierunku y.
    - dx: rozmiar pudełka w kierunku x.
    - dy: rozmiar pudełka w kierunku y.
    
    Zwraca:
    - Stabilny krok czasowy dt na podstawie kryterium CFL.
    """
    # Maksymalne prędkości wiatru
    u_max = np.max(np.abs(u))
    v_max = np.max(np.abs(v))

    # Maksymalny współczynnik dyfuzji
    K_max = max(np.max(K_x), np.max(K_y))

    # Kryterium CFL dla adwekcji i dyfuzji
    dt_advection_x = dx / (u_max + 1e-10)  # dodajemy małą wartość, aby uniknąć dzielenia przez 0
    dt_advection_y = dy / (v_max + 1e-10)
    
    dt_diffusion_x = (dx ** 2) / (2 * K_max + 1e-10)
    dt_diffusion_y = (dy ** 2) / (2 * K_max + 1e-10)

    # Ostateczny stabilny krok czasowy
    dt_stable = min(dt_advection_x, dt_advection_y, dt_diffusion_x, dt_diffusion_y)

    return dt_stable


def calculate_diffusion_coefficient(pollutant, temperature, pressure=101325):
    """
    Oblicza współczynnik dyfuzji w powietrzu dla zanieczyszczenia w zależności od temperatury, ciśnienia i innych parametrów.
    
    Parametry:
    - pollutant: str, nazwa zanieczyszczenia (np. 'CO')
    - temperature: temperatura w stopniach Celsjusza
    - pressure: ciśnienie w Pa (domyślnie 101325 Pa)
    
    Zwraca:
    - Współczynnik dyfuzji (K) w [m^2/s]
    """

    coefficients = {
      "CO": {
        "D_0": 0.16,
        "exponent": 1.75
      },
      "NO2": {
          "D_0": 0.14,
          "exponent": 1.76
      },
      "SO2": {
          "D_0": 0.15,
          "exponent": 1.78
      },
      "O3": {
          "D_0": 0.11,
          "exponent": 1.82
      },
      "CH4": {
          "D_0": 0.22,
          "exponent": 1.70
      },
      "NH3": {
          "D_0": 0.19,
          "exponent": 1.74
      },
      "C2H6": {
          "D_0": 0.19,
          "exponent": 1.73
      },
      "H2S": {
          "D_0": 0.13,
          "exponent": 1.80
      }
    }

    if pollutant not in coefficients:
        raise ValueError(f"Nieznane zanieczyszczenie: {pollutant}")

    coeffs = coefficients[pollutant]
    D_0 = coeffs['D_0'] / 10000  # Zamiana z cm^2/s na m^2/s
    exponent = coeffs['exponent']

    T_kelvin = temperature + 273.15  

    # Empiryczna zależność od temperatury, na podstawie prawa Arrheniusa
    K = D_0 * (T_kelvin / 293.15) ** exponent

    return K



def plot_concentration_grid(boxes, concentration_values, measurements, pollutant=None, save_image=False, image_path=None):
    """
    Rysuje siatkę pudełek z interpolowanymi/obliczonymi w kolejnych krokach symulacji wartościami stężeń oraz opcjonalnie zapisuje obraz.
    
    Parametry:
    - boxes: lista granic geograficznych pudełek [(lat_min, lat_max, lon_min, lon_max), ...]
    - concentration_values: wartości stężeń przypisane do pudełek (None dla pustych pudełek)
    - measurements: lista punktów pomiarowych
    - save_image: boolean, jeśli True, zapisuje obraz do pliku
    - image_path: ścieżka do pliku, w którym zapisany zostanie obraz (jeśli save_image=True)
    """
    pollutants_ranges = {
        "SO2": [0, 350],
        "NO2": [0, 200],
        "PM10": [0, 200],
        "PM2.5": [0, 75],
        "O3": [0, 180],
        "CO": [0, 15400]
    }
    
    range_min, range_max = pollutants_ranges.get(pollutant, [0, 1])
        
    color_map = plt.cm.plasma(np.linspace(0, 1, 256))
    
    fig, ax = plt.subplots(figsize=(10, 8))

    for i, (lat_min, lat_max, lon_min, lon_max) in enumerate(boxes):
        color_value = concentration_values[i]
        if color_value is not None:
          if color_value > range_max:
              color_value = range_max  
          color_idx = int(np.clip((color_value / range_max) * 255, 0, 255))
          color = color_map[color_idx]
        else:
          color = 'lightgrey'
        
        rect = plt.Rectangle((lon_min, lat_min), lon_max - lon_min, lat_max - lat_min, 
                             linewidth=0.5, edgecolor='black', facecolor=color)
        ax.add_patch(rect)

    latitudes = np.array([point["latitude"] for point in measurements])
    longitudes = np.array([point["longitude"] for point in measurements])
    concentration_values_measurements = np.array([point[f'{pollutant}'] for point in measurements])

    scatter = plt.scatter(longitudes, latitudes, c=concentration_values_measurements, cmap='plasma', edgecolor='k', s=100, zorder=5)

    ax.set_xlabel('Longitude')
    ax.set_ylabel('Latitude')
    plt.colorbar(scatter, label=f'{pollutant} Concentration')
    plt.grid(True)

    if save_image and image_path:
        plt.savefig(image_path)


def simulate_pollution_spread(data, num_steps, dt, pollutants, box_size=None, grid_density="medium", urbanized=False, margin_boxes=1, initial_distance=1, max_increment=1, debug=False):
    """
    Symuluje rozprzestrzenianie się zanieczyszczeń w powietrzu w modelu eulerowskim.

    Parametry:
    - data: dane o punktach pomiarowych
    - num_steps: liczba kroków czasowych do symulacji
    - dt: krok czasowy
    - pollutants: lista zanieczyszczeń (np. ["CO", "O3", "NO2"])
    - min_box_size, max_box_size: minimalny i maksymalny rozmiar pudełek
    - margin: margines w obszarze siatki
    - debug: jeśli True, zapisuje obrazy debugowania

    Zwraca:
    - Ostateczne stężenie zanieczyszczeń po symulacji
    """

    if debug is False:
      boxes, temp_values, press_values, u_values, v_values, pollutant_values  = create_multibox_grid_with_interpolated_measurements(
        data, pollutants, box_size=box_size, grid_density=grid_density, urbanized=urbanized, margin_boxes=margin_boxes, initial_distance=initial_distance, max_increment=max_increment)
    else:
      timestamp = datetime.now().strftime("%Y_%m_%d_%H%M%S")
      directory = f'models/euler_modified_multiboxes_model/Procedural/debug/{timestamp}/plots/'

      if not os.path.exists(directory):
        os.makedirs(directory)

      boxes, temp_values, press_values, u_values, v_values, pollutant_values  = create_multibox_grid_with_interpolated_measurements(
        data, pollutants, box_size=box_size, grid_density=grid_density, urbanized=urbanized, margin_boxes=margin_boxes, initial_distance=initial_distance, max_increment=max_increment, save_grid_images=True, save_path=directory) 
      
    # stałe dla wszystkich siatek
    x_coords = sorted(set([box[0] for box in boxes]))
    y_coords = sorted(set([box[2] for box in boxes]))

    nx = len(x_coords)
    ny = len(y_coords)
    
    final_concentrations = {}
    
    for pollutant in pollutants:
      C = np.array(pollutant_values[pollutant]).reshape((nx, ny))

      K_x = np.zeros_like(C)
      K_y = np.zeros_like(C)

      for i in range(nx):
          for j in range(ny):
              K = calculate_diffusion_coefficient(pollutant, temp_values[i * ny + j], press_values[i * ny + j])  
              K_x[i, j] = K
              K_y[i, j] = K

      u = np.array(u_values).reshape((nx, ny))  
      v = np.array(v_values).reshape((nx, ny)) 
 
      dx = (x_coords[1] - x_coords[0])  
      dy = (y_coords[1] - y_coords[0]) 
      
      dt_stable = calculate_stable_dt(u, v, K_x, K_y, dx, dy)
      if dt > dt_stable:
          print(f"Uwaga: krok czasowy {dt} jest niestabilny. Zostanie zmieniony na {dt_stable}.")
          dt = dt_stable

      # założenie - brak dodatkowych źródeł emisji 
      S_c = np.zeros_like(C) 

      if debug is True:
        image_path = f'{directory}start_{pollutant}_concentration_grid.png'
        plot_concentration_grid(boxes, C.flatten(), data, pollutant , True, image_path)

      for step in range(num_steps):
          C = update_concentration_crank_nicolson(C, u, v, K_x, K_y, dx, dy, dt, S_c, nx, ny)
          if debug is True:
            # create and save debug files from each step
            pass
        
      if debug is True and step == num_steps-1:
        image_path = f'{directory}end_{pollutant}_concentration_grid.png'
        plot_concentration_grid(boxes, C.flatten(), data, pollutant, True, image_path)
        
      final_concentrations[pollutant] = C.flatten()
       
    return final_concentrations


# num_steps = 1000  
# dt = 0.01  

# final_concentration = simulate_pollution_spread(data_2, num_steps, dt, box_size=(None, None), grid_density="medium", urbanized=False, margin_boxes=5, debug=True)

# final_concentration = simulate_pollution_spread(data, num_steps, dt, pollutants=["CO"], box_size=(None, None), grid_density="medium", urbanized=False, margin_boxes=1, initial_distance=1, debug=True)

# with open("debug.txt", "w") as file:
#     file.write(str(final_concentration))

# final_concentration = simulate_pollution_spread(data_woj, num_steps, dt,pollutants=["CO"], box_size=(None, None), grid_density="sparse", urbanized=False, margin_boxes=5, initial_distance=1, debug=True``)

# final_concentration = simulate_pollution_spread(data_tar, num_steps, dt, pollutants=["CO", "NO2", "SO2", "O3"], box_size=(None, None), grid_density="dense", urbanized=True, margin_boxes=5, debug=True)
