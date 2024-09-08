import numpy as np
import matplotlib.pyplot as plt
from scipy.interpolate import griddata

# Generowanie przykładowych danych pomiarowych
def generate_measurement_data(num_points=20):
    # Losowe współrzędne geograficzne (szerokość i długość)
    latitudes = np.random.uniform(50.0, 50.5, num_points)
    longitudes = np.random.uniform(19.0, 19.5, num_points)
    # Losowe pomiary (np. stężenie zanieczyszczeń, prędkość wiatru)
    pollution_values = np.random.uniform(10, 100, num_points)  # np. stężenie pyłów
    return latitudes, longitudes, pollution_values

# Przykład danych pomiarowych
lats, lons, pollution = generate_measurement_data()


def create_grid_and_interpolate(lats, lons, values, grid_size=0.01):
    """
    Tworzy siatkę dla obszaru zawierającego punkty pomiarowe oraz interpoluje wartości w siatce.
    
    Parametry:
    - lats: lista szerokości geograficznych punktów pomiarowych
    - lons: lista długości geograficznych punktów pomiarowych
    - values: lista wartości pomiarowych (np. stężenie pyłów)
    - grid_size: rozmiar siatki (odległość między komórkami siatki, np. 0.01 stopnia)
    
    Zwraca:
    - grid_x, grid_y: współrzędne siatki
    - grid_values: interpolowane wartości w siatce
    """
    # Określenie zakresu dla siatki (szerokości i długości)
    lat_min, lat_max = min(lats), max(lats)
    lon_min, lon_max = min(lons), max(lons)
    
    # Tworzenie regularnej siatki
    grid_x, grid_y = np.meshgrid(np.arange(lon_min, lon_max, grid_size),
                                 np.arange(lat_min, lat_max, grid_size))
    
    # Interpolacja danych do siatki
    grid_values = griddata((lons, lats), values, (grid_x, grid_y), method='linear')

    return grid_x, grid_y, grid_values

# Tworzenie siatki i interpolacja
grid_x, grid_y, grid_values = create_grid_and_interpolate(lats, lons, pollution)

def calculate_box_size(lats, lons, grid_size=0.01):
    """
    Na podstawie danych pomiarowych tworzy siatkę i dostosowuje rozmiary pudełek.
    
    Parametry:
    - lats: szerokości geograficzne punktów pomiarowych
    - lons: długości geograficzne punktów pomiarowych
    - grid_size: rozmiar pudełek (np. 0.01 stopnia = ~1km w rzeczywistości)

    Zwraca:
    - box_width, box_height: rozmiary pudełek w [m]
    - lat_min, lat_max, lon_min, lon_max: zakresy obszaru dla siatki
    """
    # Określenie zakresów geograficznych dla siatki
    lat_min, lat_max = min(lats), max(lats)
    lon_min, lon_max = min(lons), max(lons)
    
    # Przeliczenie stopni geograficznych na metry (w przybliżeniu dla małych obszarów)
    box_width = grid_size * 111e3  # 1 stopień długości geograficznej ~111 km
    box_height = grid_size * 111e3  # 1 stopień szerokości geograficznej ~111 km
    
    return box_width, box_height, lat_min, lat_max, lon_min, lon_max

# Przykład: Obliczamy rozmiary pudełek
box_width, box_height, lat_min, lat_max, lon_min, lon_max = calculate_box_size(lats, lons)
print(f"Rozmiar pudełek: {box_width}m x {box_height}m")

def calculate_time_step(box_width, max_wind_speed):
    """
    Oblicza krok czasowy na podstawie warunku CFL (Couranta) dla stabilności symulacji.
    
    Parametry:
    - box_width: szerokość pudełka [m]
    - max_wind_speed: maksymalna prędkość wiatru [m/s]

    Zwraca:
    - dt: krok czasowy [s]
    """
    # Warunek CFL: dt <= dx / u_max
    dt = box_width / max_wind_speed
    return dt

# Przykład: Zakładamy maksymalną prędkość wiatru 10 m/s
max_wind_speed = 10  # m/s
dt = calculate_time_step(box_width, max_wind_speed)
print(f"Krok czasowy: {dt} sekund")

def generate_wind_and_temperature(lats, lons, grid_size=0.01):
    """
    Generuje pole prędkości wiatru i temperatury dla obszaru pokrywanego przez siatkę.

    Parametry:
    - lats, lons: dane geograficzne punktów pomiarowych
    - grid_size: rozmiar siatki

    Zwraca:
    - u_wind: pole prędkości wiatru w kierunku x [m/s]
    - v_wind: pole prędkości wiatru w kierunku y [m/s]
    - temperature: pole temperatury [K]
    """
    grid_x, grid_y = np.meshgrid(np.arange(min(lons), max(lons), grid_size),
                                 np.arange(min(lats), max(lats), grid_size))
    
    # Prędkość wiatru - losowe wartości (np. z przedziału 0-10 m/s)
    u_wind = np.random.uniform(0, 10, grid_x.shape)
    v_wind = np.random.uniform(0, 10, grid_y.shape)
    
    # Temperatura - losowe wartości (np. z przedziału 280-300 K)
    temperature = np.random.uniform(280, 300, grid_x.shape)

    return u_wind, v_wind, temperature

# Generujemy pola prędkości wiatru i temperatury
u_wind, v_wind, temperature = generate_wind_and_temperature(lats, lons)

def euler_advection_diffusion(C, u_wind, v_wind, Kz, dt, dx, dy, dz):
    """
    Symulacja adwekcji i dyfuzji zanieczyszczeń metodą Eulera.
    
    Parametry:
    - C: pole stężenia zanieczyszczeń
    - u_wind, v_wind: prędkość wiatru w kierunkach x i y
    - Kz: współczynnik dyfuzji turbulentnej w pionie
    - dt: krok czasowy [s]
    - dx, dy, dz: rozmiary pudełek w kierunkach x, y, z [m]

    Zwraca:
    - Nowa wartość pola C po jednym kroku symulacji.
    """
    # Adwekcja w kierunku x i y
    C_x = C - dt * (u_wind * np.gradient(C, dx, axis=1))  # Adwekcja w osi x
    C_y = C - dt * (v_wind * np.gradient(C, dy, axis=0))  # Adwekcja w osi y
    
    # Dyfuzja pionowa
    C_z = C + dt * Kz * np.gradient(np.gradient(C, dz, axis=2), dz, axis=2)  # Dyfuzja w pionie

    # Sumowanie efektów
    C_new = C_x + C_y + C_z
    return C_new

# Symulacja dla przykładowego pola stężenia C
C = np.random.uniform(0, 100, u_wind.shape)  # Pole stężenia zanieczyszczeń
Kz = 0.1  # Przykładowy współczynnik dyfuzji w pionie

# Symulujemy jedną iterację
C_new = euler_advection_diffusion(C, u_wind, v_wind, Kz, dt, box_width, box_height, 100)

def run_simulation(C_init, u_wind, v_wind, Kz, steps, dt, dx, dy, dz):
    """
    Przeprowadza pełną symulację dla zadanej liczby kroków czasowych.
    
    Parametry:
    - C_init: początkowe pole stężenia zanieczyszczeń
    - u_wind, v_wind: prędkości wiatru
    - Kz: współczynnik dyfuzji
    - steps: liczba kroków czasowych
    - dt: krok czasowy
    - dx, dy, dz: rozmiary pudełek
    
    Zwraca:
    - C_hist: historia stężeń zanieczyszczeń w każdym kroku czasowym
    """
    C_hist = [C_init]
    C = C_init
    
    for step in range(steps):
        C = euler_advection_diffusion(C, u_wind, v_wind, Kz, dt, dx, dy, dz)
        C_hist.append(C)
    
    return C_hist

# Przykład: Uruchamiamy symulację na 10 kroków czasowych
steps = 10
C_hist = run_simulation(C, u_wind, v_wind, Kz, steps, dt, box_width, box_height, 100)

# Wizualizacja wyniku po ostatnim kroku
plt.imshow(C_hist[-1], cmap='viridis')
plt.colorbar(label='Stężenie zanieczyszczeń')
plt.title('Rozkład zanieczyszczeń po 10 krokach')
plt.show()



# Wizualizacja danych pomiarowych i interpolowanych wartości na siatce
plt.figure(figsize=(8, 6))
plt.scatter(lons, lats, c=pollution, s=100, cmap='viridis', label='Pomiary')
plt.contourf(grid_x, grid_y, grid_values, levels=20, cmap='viridis', alpha=0.7)
plt.colorbar(label='Stężenie zanieczyszczeń')
plt.title("Interpolacja stężenia zanieczyszczeń na siatce")
plt.xlabel('Długość geograficzna')
plt.ylabel('Szerokość geograficzna')
plt.legend()
plt.show()

