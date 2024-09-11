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
        "CO_concentration": 8900,
        "temperature": 32.21
    },
    {
        "id": 43,
        "name": "Point 2",
        "latitude": 23.13,
        "longitude": 24,
        "wind_speed": 2.2,   
        "wind_direction": 56,
        "CO_concentration": 9800,
        "temperature": 32.2
    },
    {
        "id": 44,
        "name": "Point 3",
        "latitude": 23.14,
        "longitude": 23.8,
        "wind_speed": 1.8,   
        "wind_direction": 33,
        "CO_concentration": 7899,
        "temperature": 32.19
    },
    {
        "id": 45,
        "name": "Point 4",
        "latitude": 23.15,
        "longitude": 23.5,
        "wind_speed": 2.3,   
        "wind_direction": 48,
        "CO_concentration": 7980,
        "temperature": 32.18
    },
    {
        "id": 46,
        "name": "Point 5",
        "latitude": 23.15,
        "longitude": 23.8,
        "wind_speed": 2.0,   
        "wind_direction": 102,
        "CO_concentration": 6790,
        "temperature": 32.21
    },
    {
        "id": 47,
        "name": "Point 6",
        "latitude": 23.18,
        "longitude": 23.6,
        "wind_speed": 2.2,   
        "wind_direction": 79,
        "CO_concentration": 5600,
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
    "CO_concentration": 5234,
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
    "CO_concentration": 7894,
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
    "CO_concentration": 8900,
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
    "CO_concentration": 4560,
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
    "CO_concentration": 7800,
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
    "CO_concentration": 7900,
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
    "CO_concentration": 8900,
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
    "CO_concentration": 11230,
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
    "CO_concentration": 10900,
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
    "CO_concentration": 9300,
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
    "CO_concentration": 14600,
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
    "CO_concentration": 6770,
    "flightId": 6
  }
]


data_woj = [
  {
    "id": 1,
    "name": "Point 1 - Zakopane",
    "latitude": 49.2954,
    "longitude": 19.9496,
    "temperature": 17.8,
    "wind_speed": 1.2,
    "wind_direction": 120,
    "CO_concentration": 3500,
    "flightId": 1
  },
  {
    "id": 2,
    "name": "Point 2 - Nowy Sącz",
    "latitude": 49.6204,
    "longitude": 20.7213,
    "temperature": 19.4,
    "wind_speed": 3.0,
    "wind_direction": 75,
    "CO_concentration": 4100,
    "flightId": 1
  },
  {
    "id": 3,
    "name": "Point 3 - Oświęcim",
    "latitude": 50.0294,
    "longitude": 19.2083,
    "temperature": 20.5,
    "wind_speed": 2.6,
    "wind_direction": 90,
    "CO_concentration": 5000,
    "flightId": 1
  },
  {
    "id": 4,
    "name": "Point 4 - Tarnów",
    "latitude": 50.0114,
    "longitude": 20.9894,
    "temperature": 21.2,
    "wind_speed": 1.8,
    "wind_direction": 45,
    "CO_concentration": 4700,
    "flightId": 1
  },
  {
    "id": 5,
    "name": "Point 5 - Wieliczka",
    "latitude": 49.9873,
    "longitude": 20.0652,
    "temperature": 22.6,
    "wind_speed": 2.2,
    "wind_direction": 78,
    "CO_concentration": 6770,
    "flightId": 1
  },
  {
    "id": 6,
    "name": "Point 6 - Kraków - Rynek Główny",
    "latitude": 50.0614,
    "longitude": 19.9372,
    "temperature": 23.1,
    "wind_speed": 3.0,
    "wind_direction": 90,
    "CO_concentration": 7894,
    "flightId": 1
  },
  {
    "id": 7,
    "name": "Point 7 - Kraków - Kazimierz",
    "latitude": 50.0487,
    "longitude": 19.9445,
    "temperature": 22.8,
    "wind_speed": 2.0,
    "wind_direction": 135,
    "CO_concentration": 8900,
    "flightId": 1
  },
  {
    "id": 8,
    "name": "Point 8 - Bielsko-Biała",
    "latitude": 49.8223,
    "longitude": 19.0580,
    "temperature": 18.7,
    "wind_speed": 2.5,
    "wind_direction": 100,
    "CO_concentration": 3200,
    "flightId": 1
  },
  {
    "id": 9,
    "name": "Point 9 - Limanowa",
    "latitude": 49.6490,
    "longitude": 20.4474,
    "temperature": 20.0,
    "wind_speed": 1.5,
    "wind_direction": 60,
    "CO_concentration": 3400,
    "flightId": 1
  },
  {
    "id": 10,
    "name": "Point 10 - Andrychów",
    "latitude": 49.8330,
    "longitude": 19.4856,
    "temperature": 19.6,
    "wind_speed": 2.2,
    "wind_direction": 80,
    "CO_concentration": 3300,
    "flightId": 1
  },
  {
    "id": 11,
    "name": "Point 11 - Myślenice",
    "latitude": 49.9916,
    "longitude": 19.9632,
    "temperature": 21.4,
    "wind_speed": 2.1,
    "wind_direction": 40,
    "CO_concentration": 4100,
    "flightId": 1
  },
  {
    "id": 12,
    "name": "Point 12 - Skawina",
    "latitude": 49.9767,
    "longitude": 19.8190,
    "temperature": 21.0,
    "wind_speed": 1.9,
    "wind_direction": 55,
    "CO_concentration": 4300,
    "flightId": 1
  },
  {
    "id": 13,
    "name": "Point 13 - Wadowice",
    "latitude": 49.8850,
    "longitude": 19.4938,
    "temperature": 19.5,
    "wind_speed": 2.3,
    "wind_direction": 90,
    "CO_concentration": 3200,
    "flightId": 1
  },
  {
    "id": 14,
    "name": "Point 14 - Mszana Dolna",
    "latitude": 49.6842,
    "longitude": 20.1862,
    "temperature": 18.9,
    "wind_speed": 1.8,
    "wind_direction": 100,
    "CO_concentration": 2900,
    "flightId": 1
  },
  {
    "id": 15,
    "name": "Point 15 - Olkusz",
    "latitude": 50.2814,
    "longitude": 19.5636,
    "temperature": 22.0,
    "wind_speed": 2.4,
    "wind_direction": 110,
    "CO_concentration": 4800,
    "flightId": 1
  },
  {
    "id": 16,
    "name": "Point 16 - Rabka-Zdrój",
    "latitude": 49.6333,
    "longitude": 19.9650,
    "temperature": 17.4,
    "wind_speed": 1.7,
    "wind_direction": 80,
    "CO_concentration": 3100,
    "flightId": 1
  },
  {
    "id": 17,
    "name": "Point 17 - Klucze",
    "latitude": 50.3540,
    "longitude": 19.5222,
    "temperature": 20.2,
    "wind_speed": 1.9,
    "wind_direction": 130,
    "CO_concentration": 3400,
    "flightId": 1
  },
  {
    "id": 18,
    "name": "Point 18 - Proszowice",
    "latitude": 50.2311,
    "longitude": 20.1242,
    "temperature": 21.7,
    "wind_speed": 2.0,
    "wind_direction": 95,
    "CO_concentration": 3700,
    "flightId": 1
  },
  {
    "id": 19,
    "name": "Point 19 - Świątniki Górne",
    "latitude": 49.9956,
    "longitude": 19.9404,
    "temperature": 20.9,
    "wind_speed": 2.3,
    "wind_direction": 70,
    "CO_concentration": 3500,
    "flightId": 1
  },
  {
    "id": 20,
    "name": "Point 20 - Sułkowice",
    "latitude": 49.9121,
    "longitude": 19.6066,
    "temperature": 18.8,
    "wind_speed": 1.8,
    "wind_direction": 85,
    "CO_concentration": 3200,
    "flightId": 1
  },
  {
    "id": 21,
    "name": "Point 21 - Kalwaria Zebrzydowska",
    "latitude": 49.8322,
    "longitude": 19.6894,
    "temperature": 19.4,
    "wind_speed": 1.6,
    "wind_direction": 110,
    "CO_concentration": 3300,
    "flightId": 1
  },
  {
    "id": 22,
    "name": "Point 22 - Dąbrowa Tarnowska",
    "latitude": 50.0831,
    "longitude": 21.0622,
    "temperature": 22.1,
    "wind_speed": 2.2,
    "wind_direction": 60,
    "CO_concentration": 4000,
    "flightId": 1
  }
]

data_tar = [
  {
    "id": 1,
    "name": "Point 1",
    "latitude": 50.0114,
    "longitude": 20.9894,
    "temperature": 21.2,
    "wind_speed": 1.8,
    "wind_direction": 45,
    "CO_concentration": 4700,
    "flightId": 1
  },
  {
    "id": 2,
    "name": "Point 2",
    "latitude": 50.0120,
    "longitude": 20.9930,
    "temperature": 21.0,
    "wind_speed": 2.1,
    "wind_direction": 70,
    "CO_concentration": 4500,
    "flightId": 1
  },
  {
    "id": 3,
    "name": "Point 3",
    "latitude": 50.0140,
    "longitude": 20.9850,
    "temperature": 21.5,
    "wind_speed": 1.9,
    "wind_direction": 85,
    "CO_concentration": 4600,
    "flightId": 1
  },
  {
    "id": 4,
    "name": "Point 4",
    "latitude": 50.0150,
    "longitude": 20.9900,
    "temperature": 21.7,
    "wind_speed": 2.3,
    "wind_direction": 100,
    "CO_concentration": 4800,
    "flightId": 1
  },
  {
    "id": 5,
    "name": "Point 5",
    "latitude": 50.0100,
    "longitude": 20.9860,
    "temperature": 20.9,
    "wind_speed": 2.0,
    "wind_direction": 120,
    "CO_concentration": 4400,
    "flightId": 1
  },
  {
    "id": 6,
    "name": "Point 6",
    "latitude": 50.0135,
    "longitude": 20.9920,
    "temperature": 21.3,
    "wind_speed": 1.7,
    "wind_direction": 130,
    "CO_concentration": 4700,
    "flightId": 1
  },
  {
    "id": 7,
    "name": "Point 7",
    "latitude": 50.0160,
    "longitude": 20.9880,
    "temperature": 21.0,
    "wind_speed": 2.2,
    "wind_direction": 110,
    "CO_concentration": 4600,
    "flightId": 1
  },
  {
    "id": 8,
    "name": "Point 8",
    "latitude": 50.0170,
    "longitude": 20.9820,
    "temperature": 21.6,
    "wind_speed": 2.4,
    "wind_direction": 90,
    "CO_concentration": 4800,
    "flightId": 1
  },
  {
    "id": 9,
    "name": "Point 9",
    "latitude": 50.0125,
    "longitude": 20.9790,
    "temperature": 20.8,
    "wind_speed": 2.0,
    "wind_direction": 70,
    "CO_concentration": 4300,
    "flightId": 1
  },
  {
    "id": 10,
    "name": "Point 10",
    "latitude": 50.0155,
    "longitude": 20.9950,
    "temperature": 21.4,
    "wind_speed": 1.8,
    "wind_direction": 85,
    "CO_concentration": 4500,
    "flightId": 1
  }
]


def update_concentration(C, u, v, K_x, K_y, dx, dy, dt, S_c, nx, ny):
    """
    Aktualizuje stężenie zanieczyszczeń w każdym pudełku na podstawie modelu eulerowskiego.

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
            diff_x = K_x[i, j] * ((C[i+1, j] - C[i, j]) - (C[i, j] - C[i-1, j])) / (dx**2)
            diff_y = K_y[i, j] * ((C[i, j+1] - C[i, j]) - (C[i, j] - C[i, j-1])) / (dy**2)

            # Źródło emisji
            source = S_c[i, j]

            # Całkowita zmiana stężenia
            dC_dt[i, j] = conv_x + conv_y + diff_x + diff_y + source

    C_new = C + dC_dt * dt
    return C_new


def calculate_diffusion_coefficient(pollutant, temperature, pressure=101325, additional_params=None):
    """
    Oblicza współczynnik dyfuzji w powietrzu dla zanieczyszczenia w zależności od temperatury, ciśnienia i innych parametrów.
    
    Parametry:
    - pollutant: str, nazwa zanieczyszczenia (np. 'CO')
    - temperature: temperatura w stopniach Celsjusza
    - pressure: ciśnienie w Pa (domyślnie 101325 Pa)
    - additional_params: dodatkowe parametry, jeśli są potrzebne do obliczeń (opcjonalnie)
    
    Zwraca:
    - Współczynnik dyfuzji (K) w [m^2/s]
    """
    if pollutant == 'CO':
        T_kelvin = temperature + 273.15  # zamiana temperatury na Kelwiny
        D_0 = 0.16  # Współczynnik dyfuzji CO w powietrzu w standardowych warunkach [cm^2/s]
        D_0 /= 10000  # Zamiana z cm^2/s na m^2/s

        # Empiryczna zależność od temperatury, na podstawie prawa Arrheniusa
        K = D_0 * (T_kelvin / 293.15) ** 1.75
        return K
    else:
        raise ValueError(f"Nieznane zanieczyszczenie: {pollutant}")


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


def simulate_pollution_spread(data, num_steps, dt, box_size=None, grid_density="medium", urbanized=False, margin_boxes=1, debug=False):
    """
    Symuluje rozprzestrzenianie się zanieczyszczeń w powietrzu w modelu eulerowskim.

    Parametry:
    - data: dane o punktach pomiarowych
    - num_steps: liczba kroków czasowych do symulacji
    - dt: krok czasowy
    - min_box_size, max_box_size: minimalny i maksymalny rozmiar pudełek
    - margin: margines w obszarze siatki
    - debug: jeśli True, zapisuje obrazy debugowania

    Zwraca:
    - Ostateczne stężenie zanieczyszczeń po symulacji
    """

    if debug is False:
      boxes, temp_values, u_values, v_values, co_values = create_multibox_grid_with_interpolated_measurements(
        data, box_size=box_size, grid_density=grid_density, urbanized=urbanized, margin_boxes=margin_boxes)
    else:
      timestamp = datetime.now().strftime("%Y_%m_%d_%H%M%S")
      directory = f'models/euler_modified_multiboxes_model/Procedural/debug/{timestamp}/plots/'

      if not os.path.exists(directory):
        os.makedirs(directory)

      boxes, temp_values, u_values, v_values, co_values = create_multibox_grid_with_interpolated_measurements(
        data, box_size=box_size, grid_density=grid_density, urbanized=urbanized, margin_boxes=margin_boxes, save_grid_images=True, save_path=directory) 

    x_coords = sorted(set([box[0] for box in boxes]))
    y_coords = sorted(set([box[2] for box in boxes]))

    nx = len(x_coords)
    ny = len(y_coords)

    # uogólnij dla różnych zanieczyszczeń nie tylko CO 
    C = np.array(co_values).reshape((nx, ny))

    K_x = np.zeros_like(C)
    K_y = np.zeros_like(C)

    for i in range(nx):
        for j in range(ny):
            K = calculate_diffusion_coefficient('CO', temp_values[i * ny + j])  
            K_x[i, j] = K
            K_y[i, j] = K

    u = np.array(u_values).reshape((nx, ny))  
    v = np.array(v_values).reshape((nx, ny)) 
 
    dx = (x_coords[1] - x_coords[0])  
    dy = (y_coords[1] - y_coords[0]) 

    # założenie - brak dodatkowych źródeł emisji 
    S_c = np.zeros_like(C) 

    if debug is True:
      image_path = f'models/euler_modified_multiboxes_model/Procedural/debug/{timestamp}/plots/start_pollutant_concentration_grid.png'
      plot_concentration_grid(boxes, C.flatten(), data, True, image_path)

    for step in range(num_steps):
        C = update_concentration(C, u, v, K_x, K_y, dx, dy, dt, S_c, nx, ny)
        if debug is True:
           # create and save debug files from each step
           pass
        
    if debug is True and step == num_steps-1:
      image_path = f'models/euler_modified_multiboxes_model/Procedural/debug/{timestamp}/plots/final_pollutant_concentration_grid.png'
      plot_concentration_grid(boxes, C.flatten(), data, True, image_path)
       
    return C


num_steps = 100  
dt = 0.01  

final_concentration = simulate_pollution_spread(data_2, num_steps, dt, box_size=(0.01,0.2), grid_density="medium", urbanized=False, margin_boxes=5, debug=True)
 