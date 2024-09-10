import os
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime
from grid_and_interpolation import create_multibox_grid_with_interpolated_measurements

data_2 = [
    {
        "id": 42,
        "name": "Point 1",
        "latitude": 23.12,
        "longitude": 23.1,
        "wind_speed": 2.1,   
        "wind_direction": 45,
        "temperature": 32.21
    },
    {
        "id": 43,
        "name": "Point 2",
        "latitude": 23.13,
        "longitude": 24,
        "wind_speed": 2.2,   
        "wind_direction": 56,
        "temperature": 32.2
    },
    {
        "id": 44,
        "name": "Point 3",
        "latitude": 23.14,
        "longitude": 23.8,
        "wind_speed": 1.8,   
        "wind_direction": 33,
        "temperature": 32.19
    },
    {
        "id": 45,
        "name": "Point 4",
        "latitude": 23.15,
        "longitude": 23.5,
        "wind_speed": 2.3,   
        "wind_direction": 48,
        "temperature": 32.18
    },
    {
        "id": 46,
        "name": "Point 5",
        "latitude": 23.15,
        "longitude": 23.8,
        "wind_speed": 2.0,   
        "wind_direction": 102,
        "temperature": 32.21
    },
    {
        "id": 47,
        "name": "Point 6",
        "latitude": 23.18,
        "longitude": 23.6,
        "wind_speed": 2.2,   
        "wind_direction": 79,
        "temperature": 32.3
    }
]


data = [
  {
    "id": 48,
    "name": "Point 1 - Wawel",
    "latitude": 50.0545,
    "longitude": 19.9353,
    "temperature": 22.5,
    "wind_speed": 2.5,   
    "wind_direction": 45,
    "flightId": 6
  },
  {
    "id": 49,
    "name": "Point 2 - Main Square",
    "latitude": 50.0614,
    "longitude": 19.9372,
    "temperature": 23.1,
    "wind_speed": 3.0,   
    "wind_direction": 90,
    "flightId": 6
  },
  {
    "id": 50,
    "name": "Point 3 - Kazimierz",
    "latitude": 50.0487,
    "longitude": 19.9445,
    "temperature": 22.8,
    "wind_speed": 2.0,   
    "wind_direction": 135,
    "flightId": 6
  },
  {
    "id": 51,
    "name": "Point 4 - Vistula River",
    "latitude": 50.051,
    "longitude": 19.9366,
    "temperature": 22.3,
    "wind_speed": 1.8,   
    "wind_direction": 60,
    "flightId": 6
  },
  {
    "id": 52,
    "name": "Point 5 - Krakow University",
    "latitude": 50.0647,
    "longitude": 19.9248,
    "temperature": 23.4,
    "wind_speed": 2.6,   
    "wind_direction": 120,
    "flightId": 6
  },
  {
    "id": 53,
    "name": "Point 6 - St. Mary's Basilica",
    "latitude": 50.0616,
    "longitude": 19.9393,
    "temperature": 23.0,
    "wind_speed": 2.8,   
    "wind_direction": 100,
    "flightId": 6
  },
  {
    "id": 54,
    "name": "Point 7 - Planty Park",
    "latitude": 50.0594,
    "longitude": 19.9336,
    "temperature": 22.7,
    "wind_speed": 1.8,   
    "wind_direction": 78,
    "flightId": 6
  },
  {
    "id": 55,
    "name": "Point 8 - Krakow Barbican",
    "latitude": 50.0642,
    "longitude": 19.942,
    "temperature": 22.9,
    "wind_speed": 2.1,   
    "wind_direction": 108,
    "flightId": 6
  },
  {
    "id": 56,
    "name": "Point 9 - Floriańska Street",
    "latitude": 50.0636,
    "longitude": 19.9383,
    "temperature": 23.2,
    "wind_speed": 2.8,   
    "wind_direction": 132,
    "flightId": 6
  },
  {
    "id": 57,
    "name": "Point 10 - Blonia Park",
    "latitude": 50.0617,
    "longitude": 19.9115,
    "temperature": 23.3,
    "wind_speed": 2.3,   
    "wind_direction": 34,
    "flightId": 6
  },
  {
    "id": 58,
    "name": "Point 11 - Nowa Huta",
    "latitude": 50.07,
    "longitude": 20.0374,
    "temperature": 23.0,
    "wind_speed": 2.2,   
    "wind_direction": 22,
    "flightId": 6
  },
  {
    "id": 59,
    "name": "Point 12 - Wieliczka",
    "latitude": 49.9873,
    "longitude": 20.0652,
    "temperature": 22.6,
    "wind_speed": 2.2,   
    "wind_direction": 78,
    "flightId": 6
  }
]


def update_concentration(C, u, v, K_x, K_y, dx, dy, dt, S_c, nx, ny):
    """
    Aktualizuje stężenie zanieczyszczeń w każdym pudełku na podstawie modelu eulerowskiego.

    Parametry:
    - C: 2D macierz (nx, ny) stężenia zanieczyszczeń.
    - u: 2D macierz (nx, ny) prędkości wiatru w kierunku x.
    - v: 2D macierz (nx, ny) prędkości wiatru w kierunku y.
    - K_x: współczynnik dyfuzji w kierunku x.
    - K_y: współczynnik dyfuzji w kierunku y.
    - dx, dy: wymiary pudełka.
    - dt: krok czasowy.
    - S_c: źródła emisji zanieczyszczeń.
    - nx, ny: liczba pudełek w kierunku x i y.

    Zwraca:
    - Zaktualizowana macierz stężenia C.
    """
    dC_dt = np.zeros_like(C)

    for i in range(1, nx - 1):
        for j in range(1, ny - 1):
            # Konwekcja (transport przez wiatr)
            conv_x = -u[i, j] * (C[i, j] - C[i-1, j]) / dx
            conv_y = -v[i, j] * (C[i, j] - C[i, j-1]) / dy

            # Dyfuzja (rozpraszanie zanieczyszczeń)
            diff_x = K_x * ((C[i+1, j] - C[i, j]) - (C[i, j] - C[i-1, j])) / (dx**2)
            diff_y = K_y * ((C[i, j+1] - C[i, j]) - (C[i, j] - C[i, j-1])) / (dy**2)

            # Źródło emisji
            source = S_c[i, j]

            # Całkowita zmiana stężenia
            dC_dt[i, j] = conv_x + conv_y + diff_x + diff_y + source

    C_new = C + dC_dt * dt
    return C_new

def plot_concentration_grid(boxes, concentration_values, measurements, save_image=False, image_path=None):
    """
    Rysuje siatkę pudełek z interpolowanymi/obliczonymi w kolejnych krokach symulacji wartościami stężeń oraz opcjonalnie zapisuje obraz.
    
    Parametry:
    - boxes: lista granic geograficznych pudełek [(lat_min, lat_max, lon_min, lon_max), ...]
    - concentration_values: wartości stężeń przypisane do pudełek (None dla pustych pudełek)
    - measurements: lista punktów pomiarowych
    - save_image: boolean, jeśli True, zapisuje obraz do pliku
    - image_path: ścieżka do pliku, w którym zapisany zostanie obraz (jeśli save_image=True)
    """
    
    fig, ax = plt.subplots(figsize=(10, 8))

    valid_values = [value for value in concentration_values if value is not None]
    if valid_values:
        min_value, max_value = min(valid_values), max(valid_values)
    else:
        min_value, max_value = 0, 1

    for i, (lat_min, lat_max, lon_min, lon_max) in enumerate(boxes):
        color_value = concentration_values[i]
        if color_value is not None:
            normalized_value = (color_value - min_value) / (max_value - min_value)
            color = plt.cm.plasma(normalized_value)  
        else:
            color = 'lightgrey'
        
        rect = plt.Rectangle((lon_min, lat_min), lon_max - lon_min, lat_max - lat_min, 
                             linewidth=1, edgecolor='blue', facecolor=color)
        ax.add_patch(rect)

    latitudes = np.array([point["latitude"] for point in measurements])
    longitudes = np.array([point["longitude"] for point in measurements])
    plt.scatter(longitudes, latitudes, c='black', edgecolor='k', s=100, zorder=5)

    ax.set_xlabel('Longitude')
    ax.set_ylabel('Latitude')
    plt.colorbar(label='Pollutant Concentration')
    plt.grid(True)

    if save_image and image_path:
        plt.savefig(image_path)


def simulate_pollution_spread(data, num_steps, dt, min_box_size=0.001, max_box_size=0.02, margin=0.005, debug=False):
    """
    Symuluje rozprzestrzenianie się zanieczyszczeń w powietrzu w modelu eulerowskim.

    Parametry:
    - data: dane o punktach pomiarowych
    - num_steps: liczba kroków czasowych do symulacji
    - dt: krok czasowy
    - min_box_size, max_box_size: minimalny i maksymalny rozmiar pudełek
    - margin: margines w obszarze siatki

    Zwraca:
    - Ostateczne stężenie zanieczyszczeń po symulacji
    """

    if debug is False:
      boxes, temp_values, u_values, v_values = create_multibox_grid_with_interpolated_measurements(
        data, min_box_size=min_box_size, max_box_size=max_box_size, margin=margin)
    else:
      timestamp = datetime.now().strftime("%Y_%m_%d_%H%M%S")
      directory = f'models/euler_volume_muliboxes_model/debug/{timestamp}/plots/'

      if not os.path.exists(directory):
        os.makedirs(directory)

      boxes, temp_values, u_values, v_values = create_multibox_grid_with_interpolated_measurements(
        data, min_box_size=min_box_size, max_box_size=max_box_size, margin=margin, save_grid_images=True, save_path=directory) 

    x_coords = sorted(set([box[0] for box in boxes]))
    y_coords = sorted(set([box[2] for box in boxes]))

    nx = len(x_coords)
    ny = len(y_coords)

    C = np.random.uniform(0, 1, size=(nx, ny)) 

    u = np.array(u_values).reshape((nx, ny))  
    v = np.array(v_values).reshape((nx, ny)) 

    K_x = 0.1  
    K_y = 0.1 

    dx = (x_coords[1] - x_coords[0])  
    dy = (y_coords[1] - y_coords[0]) 

    S_c = np.zeros_like(C)
    S_c[0, 0] = 1  

    if debug is True:
      image_path = f'models/euler_volume_muliboxes_model/debug/{timestamp}/plots/start_pollutant_concentration_grid.png'
      plot_concentration_grid(boxes, C.flatten(), data, True, image_path)

    for step in range(num_steps):
        C = update_concentration(C, u, v, K_x, K_y, dx, dy, dt, S_c, nx, ny)
        if debug is True:
           # create and save debug files from each step
           pass
        
    if debug is True and step == num_steps-1:
      image_path = f'models/euler_volume_muliboxes_model/debug/{timestamp}/plots/final_pollutant_concentration_grid.png'
      plot_concentration_grid(boxes, C.flatten(), data, True, image_path)
       
    return C


num_steps = 100  
dt = 0.01  

final_concentration = simulate_pollution_spread(data_2, num_steps, dt, debug=True)
