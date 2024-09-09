import numpy as np
import matplotlib.pyplot as plt
from grid import create_multibox_grid_with_interpolated_measurements

data_2 = [
    {
        "id": 42,
        "name": "Point 1",
        "latitude": 23.12,
        "longitude": 23.1,
        "some_value_1": 1,
        "temperature": 32.21
    },
    {
        "id": 43,
        "name": "Point 2",
        "latitude": 23.13,
        "longitude": 24,
        "some_value_1": 1,
        "temperature": 32.2
    },
    {
        "id": 44,
        "name": "Point 3",
        "latitude": 23.14,
        "longitude": 23.8,
        "some_value_1": 1,
        "temperature": 32.19
    },
    {
        "id": 45,
        "name": "Point 4",
        "latitude": 23.15,
        "longitude": 23.5,
        "some_value_1": 1,
        "temperature": 32.18
    },
    {
        "id": 46,
        "name": "Point 5",
        "latitude": 23.15,
        "longitude": 23.8,
        "some_value_1": 1,
        "temperature": 32.21
    },
    {
        "id": 47,
        "name": "Point 6",
        "latitude": 23.18,
        "longitude": 23.6,
        "some_value_1": 1,
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
    "flightId": 6
  },
  {
    "id": 49,
    "name": "Point 2 - Main Square",
    "latitude": 50.0614,
    "longitude": 19.9372,
    "temperature": 23.1,
    "flightId": 6
  },
  {
    "id": 50,
    "name": "Point 3 - Kazimierz",
    "latitude": 50.0487,
    "longitude": 19.9445,
    "temperature": 22.8,
    "flightId": 6
  },
  {
    "id": 51,
    "name": "Point 4 - Vistula River",
    "latitude": 50.051,
    "longitude": 19.9366,
    "temperature": 22.3,
    "flightId": 6
  },
  {
    "id": 52,
    "name": "Point 5 - Krakow University",
    "latitude": 50.0647,
    "longitude": 19.9248,
    "temperature": 23.4,
    "flightId": 6
  },
  {
    "id": 53,
    "name": "Point 6 - St. Mary's Basilica",
    "latitude": 50.0616,
    "longitude": 19.9393,
    "temperature": 23.0,
    "flightId": 6
  },
  {
    "id": 54,
    "name": "Point 7 - Planty Park",
    "latitude": 50.0594,
    "longitude": 19.9336,
    "temperature": 22.7,
    "flightId": 6
  },
  {
    "id": 55,
    "name": "Point 8 - Krakow Barbican",
    "latitude": 50.0642,
    "longitude": 19.942,
    "temperature": 22.9,
    "flightId": 6
  },
  {
    "id": 56,
    "name": "Point 9 - Floriańska Street",
    "latitude": 50.0636,
    "longitude": 19.9383,
    "temperature": 23.2,
    "flightId": 6
  },
  {
    "id": 57,
    "name": "Point 10 - Blonia Park",
    "latitude": 50.0617,
    "longitude": 19.9115,
    "temperature": 23.3,
    "flightId": 6
  },
  {
    "id": 58,
    "name": "Point 11 - Nowa Huta",
    "latitude": 50.07,
    "longitude": 20.0374,
    "temperature": 23.0,
    "flightId": 6
  },
  {
    "id": 59,
    "name": "Point 12 - Wieliczka",
    "latitude": 49.9873,
    "longitude": 20.0652,
    "temperature": 22.6,
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


def simulate_pollution_spread(data, num_steps, dt, min_box_size=0.001, max_box_size=0.02, margin=0.005):
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
    boxes, initial_concentration = create_multibox_grid_with_interpolated_measurements(data, min_box_size=min_box_size, max_box_size=max_box_size, margin=margin)

    x_coords = sorted(set([box[0] for box in boxes]))
    y_coords = sorted(set([box[2] for box in boxes]))

    nx = len(x_coords)
    ny = len(y_coords)

    # Początkowe wartości stężeń, prędkości wiatru i dyfuzji
    C = np.array(initial_concentration, dtype=float).reshape((nx, ny))    
    u = np.random.uniform(1, 3, size=(nx, ny))  # losowa prędkość wiatru w kierunku x
    v = np.random.uniform(1, 3, size=(nx, ny))  # losowa prędkość wiatru w kierunku y
    K_x = 0.1  # współczynnik dyfuzji w kierunku x
    K_y = 0.1  # współczynnik dyfuzji w kierunku y
    S_c = np.zeros((nx, ny))  # brak dodatkowych źródeł emisji na początku

    # Rozmiary pudełek (zakładamy, że wymiary są stałe w obrębie siatki)
    dx = np.mean([box[1] - box[0] for box in boxes])  # średnia szerokość pudełka w kierunku x
    dy = np.mean([box[3] - box[2] for box in boxes])  # średnia szerokość pudełka w kierunku y


    # Symulacja w pętli czasowej
    for step in range(num_steps):
        C = update_concentration(C, u, v, K_x, K_y, dx, dy, dt, S_c, nx, ny)
        
        # Opcjonalnie: wizualizacja co kilka kroków
        if step % 10 == 0:
            plt.imshow(C, cmap='hot', interpolation='nearest')
            plt.colorbar()
            plt.title(f"Stężenie zanieczyszczeń - krok {step}")
            plt.show()

    return C



# Parametry symulacji
num_steps = 100  # liczba kroków czasowych
dt = 0.01  # krok czasowy

# Uruchomienie symulacji
final_concentration = simulate_pollution_spread(data, num_steps, dt)

# Wizualizacja końcowego stężenia
plt.imshow(final_concentration, cmap='hot', interpolation='nearest')
plt.colorbar()
plt.title("Końcowe stężenie zanieczyszczeń")
plt.show()