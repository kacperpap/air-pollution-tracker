import numpy as np
from scipy.spatial import KDTree
import matplotlib.pyplot as plt
from datetime import datetime

def create_uniform_boxes(data, box_size=0.01, min_box_size=0.001, max_box_size=0.02, margin=0.005):
    """
    Tworzy siatkę pudełek o rozmiarze opartym na średniej odległości między punktami pomiarowymi,
    uwzględniając temperaturę, prędkość wiatru oraz kierunek wiatru.
    
    Parametry:
    - data: lista punktów pomiarowych (zawiera latitude, longitude, temperature, wind_speed, wind_direction)
    - min_box_size: minimalny rozmiar pudełka (w stopniach)
    - max_box_size: maksymalny rozmiar pudełka (w stopniach)
    - margin: dodatkowy margines na granicach (w stopniach)
    
    Zwraca:
    - boxes: lista granic geograficznych pudełek w formacie [(lat_min, lat_max, lon_min, lon_max), ...]
    - box_values: wartości pomiarów przypisane do pudełek (temperatura, u, v)
    """

    latitudes = np.array([point["latitude"] for point in data])
    longitudes = np.array([point["longitude"] for point in data])
    temperatures = np.array([point["temperature"] for point in data])
    wind_speeds = np.array([point["wind_speed"] for point in data])
    wind_directions = np.array([point["wind_direction"] for point in data])
    co_concentrations = np.array([point["CO_concentration"] for point in data])
    

    """
    Kierunek wiatru podawany jest w stopniach, co oznacza, że np. kierunek północny to 0 st.
    Aby rozłożyć kierunek wiatru na składowe u, v (nie uwzględniamy kierunku pionowego - pomiary na stałej wysokości),
    zamieniamy stopnie na radiany i obliczamy składowe zgodnie z:
        u=V⋅sin(θ)
        v=V⋅cos(θ)
    """
    wind_directions_rad = np.deg2rad(wind_directions)  # Konwersja stopni na radiany
    u_values = wind_speeds * np.sin(wind_directions_rad)  # Składowa w kierunku x
    v_values = wind_speeds * np.cos(wind_directions_rad)  # Składowa w kierunku y

    lat_min, lat_max = np.min(latitudes), np.max(latitudes)
    lon_min, lon_max = np.min(longitudes), np.max(longitudes)
    
    lat_min -= margin
    lat_max += margin
    lon_min -= margin
    lon_max += margin
    
    lat_diffs = np.diff(np.sort(latitudes))
    lon_diffs = np.diff(np.sort(longitudes))
    
    avg_lat_diff = np.mean(lat_diffs) if len(lat_diffs) > 0 else max_box_size
    avg_lon_diff = np.mean(lon_diffs) if len(lon_diffs) > 0 else max_box_size
    
    box_size_lat = np.clip(avg_lat_diff, min_box_size, max_box_size)
    box_size_lon = np.clip(avg_lon_diff, min_box_size, max_box_size)
    
    num_lat_boxes = int(np.ceil((lat_max - lat_min) / box_size_lat))
    num_lon_boxes = int(np.ceil((lon_max - lon_min) / box_size_lon))
    
    boxes = []
    temperature_values = np.full((num_lat_boxes, num_lon_boxes), None)
    co_values = np.full((num_lat_boxes, num_lon_boxes), None)
    u_grid = np.full((num_lat_boxes, num_lon_boxes), None)
    v_grid = np.full((num_lat_boxes, num_lon_boxes), None)
    
    # obliczanie indeksów pudełek do których przypisujemy dane pomiarowe
    # lat - lat_min określa położenie na szerokości geograficzniej danego punktu pomiarowego jako odległość o poczatku siatki,
    # po czym podzielenie przez szerokość pudełka i zaokraglenie w górę daje nam index pudełka do którego przypisujemy zmierzone wartości 
    for lat, lon, temp, u, v, co in zip(latitudes, longitudes, temperatures, u_values, v_values, co_concentrations):
        lat_idx = int((lat - lat_min) / box_size_lat)
        lon_idx = int((lon - lon_min) / box_size_lon)
        
        if 0 <= lat_idx < num_lat_boxes and 0 <= lon_idx < num_lon_boxes:
            if temperature_values[lat_idx, lon_idx] is None:
                temperature_values[lat_idx, lon_idx] = temp
                u_grid[lat_idx, lon_idx] = u
                v_grid[lat_idx, lon_idx] = v
                co_values[lat_idx, lon_idx] = co
            else:
                temperature_values[lat_idx, lon_idx] = (temperature_values[lat_idx, lon_idx] + temp) / 2
                u_grid[lat_idx, lon_idx] = (u_grid[lat_idx, lon_idx] + u) / 2
                v_grid[lat_idx, lon_idx] = (v_grid[lat_idx, lon_idx] + v) / 2
                co_values[lat_idx, lon_idx] = (co_values[lat_idx, lon_idx] + co) / 2




    for i in range(num_lat_boxes):
      for j in range(num_lon_boxes):
        lat_min_box = lat_min + i * box_size_lat
        lat_max_box = lat_min + (i + 1) * box_size_lat
        lon_min_box = lon_min + j * box_size_lon
        lon_max_box = lon_min + (j + 1) * box_size_lon
            
        boxes.append((lat_min_box, lat_max_box, lon_min_box, lon_max_box))
    
    return boxes, temperature_values.flatten(), u_grid.flatten(), v_grid.flatten(), co_values.flatten()

def interpolate_empty_boxes(boxes, box_values, max_distance=0.01):
    """
    Interpoluje wartości w pustych pudełkach na podstawie sąsiednich pudełek.
    
    Parametry:
    - boxes: lista granic geograficznych pudełek [(lat_min, lat_max, lon_min, lon_max), ...]
    - box_values: wartości przypisane do pudełek (None dla pustych pudełek)
    - max_distance: maksymalna odległość do sąsiednich pudełek dla interpolacji
    
    Zwraca:
    - box_values: zaktualizowane wartości dla pudełek po interpolacji
    """
    centers = [(0.5 * (box[0] + box[1]), 0.5 * (box[2] + box[3])) for box in boxes]  
    tree = KDTree(centers)
    
    for i, value in enumerate(box_values):
        if value is None:
            # tree.query: centers[i] - środek aktualnie rozważanego pudełka
            #             k=5, szukamy 5 najbliższych sasiadów
            #             distance_upper_bound=max_distance, uwzględnia podczas szukania tylko sasiadów o określonej oganiczonej odłegłości 
            dist, idx = tree.query(centers[i], k=5, distance_upper_bound=max_distance)
            nearby_values = [box_values[j] for j in idx if j < len(box_values) and box_values[j] is not None]
            
            if nearby_values:
                box_values[i] = np.mean(nearby_values)
    
    return box_values

def recursive_interpolation_until_filled(boxes, temp_values, u_values, v_values, co_values, initial_distance=0.01, max_increment=0.01):
    """
    Rekursywna interpolacja dla temperatury i prędkości wiatru, która kontynuuje, dopóki wszystkie pudełka nie zostaną wypełnione wartościami.
    
    Parametry:
    - boxes: lista granic geograficznych pudełek
    - temp_values, u_values, v_values: wartości przypisane do pudełek (None dla pustych)
    - initial_distance: początkowa maksymalna odległość do sąsiednich pudełek
    - max_increment: krok zwiększający maksymalną odległość sąsiadów w każdej iteracji
    
    Zwraca:
    - zaktualizowane temp_values, u_values, v_values
    """
    distance = initial_distance
    while any(value is None for value in temp_values) or any(value is None for value in u_values) or any(value is None for value in v_values) or any(value is None for value in co_values):
        temp_values = interpolate_empty_boxes(boxes, temp_values, max_distance=distance)
        u_values = interpolate_empty_boxes(boxes, u_values, max_distance=distance)
        v_values = interpolate_empty_boxes(boxes, v_values, max_distance=distance)
        co_values = interpolate_empty_boxes(boxes, co_values, max_distance=distance)
        distance += max_increment
    
    return temp_values, u_values, v_values, co_values


def plot_temperature_grid(boxes, temp_values, measurements, save_image=False, image_path=None):
    """
    Rysuje siatkę pudełek z interpolowanymi wartościami oraz opcjonalnie zapisuje obraz.
    
    Parametry:
    - boxes: lista granic geograficznych pudełek [(lat_min, lat_max, lon_min, lon_max), ...]
    - temp_values: wartości temperatury przypisane do pudełek (None dla pustych pudełek)
    - measurements: lista punktów pomiarowych
    - save_image: boolean, jeśli True, zapisuje obraz do pliku
    - image_path: ścieżka do pliku, w którym zapisany zostanie obraz (jeśli save_image=True)
    """
    
    fig, ax = plt.subplots(figsize=(10, 8))

    # normalizacja 
    valid_values = [value for value in temp_values if value is not None]
    if valid_values:
        min_value, max_value = min(valid_values), max(valid_values)
    else:
        min_value, max_value = 0, 1

    for i, (lat_min, lat_max, lon_min, lon_max) in enumerate(boxes):
        color_value = temp_values[i]
        if color_value is not None:
            normalized_value = (color_value - min_value) / (max_value - min_value)
            color = plt.cm.coolwarm(normalized_value)  
        else:
            color = 'lightgrey'
        
        rect = plt.Rectangle((lon_min, lat_min), lon_max - lon_min, lat_max - lat_min, 
                             linewidth=1, edgecolor='blue', facecolor=color)
        ax.add_patch(rect)

        center_lat = 0.5 * (lat_min + lat_max)
        center_lon = 0.5 * (lon_min + lon_max)
        if color_value is not None:
            plt.text(center_lon, center_lat, f'{color_value:.1f}', ha='center', va='center', fontsize=8, color='black', fontweight='bold')

    latitudes = np.array([point["latitude"] for point in measurements])
    longitudes = np.array([point["longitude"] for point in measurements])
    temperatures = np.array([point["temperature"] for point in measurements])
    plt.scatter(longitudes, latitudes, c=temperatures, cmap='coolwarm', edgecolor='k', s=100, zorder=5)

    ax.set_xlabel('Longitude')
    ax.set_ylabel('Latitude')
    ax.set_title('Uniform Grid Boxes with Interpolated Values')
    plt.colorbar(label='Temperature')
    plt.grid(True)

    if save_image and image_path:
        plt.savefig(image_path)

def plot_wind_grid(boxes, u_values, v_values, measurements, save_image=False, image_path=None):
    """
    Rysuje siatkę pudełek z prędkością i kierunkiem wiatru (u, v) oraz opcjonalnie zapisuje obraz.
    
    Parametry:
    - boxes: lista granic geograficznych pudełek [(lat_min, lat_max, lon_min, lon_max), ...]
    - u_values, v_values: wartości przypisane do pudełek (składowe prędkości wiatru u, v)
    - measurements: lista punktów pomiarowych (zawiera latitude, longitude i wind_speed, wind_direction)
    - save_image: boolean, jeśli True, zapisuje obraz do pliku
    - image_path: ścieżka do pliku, w którym zapisany zostanie obraz (jeśli save_image=True)
    """
    
    fig, ax = plt.subplots(figsize=(10, 8))

    u_values = np.asarray(u_values, dtype=float)
    v_values = np.asarray(v_values, dtype=float)


    wind_speeds = np.sqrt([np.square(u_values) + np.square(v_values)])  # Obliczamy prędkość wiatru jako |V| = sqrt(u^2 + v^2)
    
    valid_wind_speeds = [ws for ws in wind_speeds if ws is not None]
    valid_wind_speeds = wind_speeds[np.isfinite(wind_speeds)]

    
    if valid_wind_speeds.size > 0:
        min_speed, max_speed = min(valid_wind_speeds), max(valid_wind_speeds)
    else:
        min_speed, max_speed = 0, 1

    
    for i, (lat_min, lat_max, lon_min, lon_max) in enumerate(boxes):
        u_value = u_values[i]
        v_value = v_values[i]
        wind_speed = np.sqrt(u_value**2 + v_value**2) if u_value is not None and v_value is not None else None
        
        if wind_speed is not None:
            if min_speed == max_speed:
                normalized_speed = 0
            else:
                normalized_speed = (wind_speed - min_speed) / (max_speed - min_speed)
            color = plt.cm.viridis(normalized_speed)  # Używamy palety kolorów 'viridis'
        else:
            color = 'lightgrey'
        
        rect = plt.Rectangle((lon_min, lat_min), lon_max - lon_min, lat_max - lat_min, 
                             linewidth=1, edgecolor='blue', facecolor=color)
        ax.add_patch(rect)

        center_lat = 0.5 * (lat_min + lat_max)
        center_lon = 0.5 * (lon_min + lon_max)
        
        lat_min, lat_max, lon_min, lon_max = boxes[0]
        box_size = np.sqrt((lon_max - lon_min)**2 + (lat_max - lat_min)**2)
        arrow_scale = box_size * 300

        if u_value is not None and v_value is not None:
            ax.quiver(center_lon, center_lat, u_value, v_value, scale=arrow_scale, scale_units='inches', color='black', zorder=5)

    latitudes = np.array([point["latitude"] for point in measurements])
    longitudes = np.array([point["longitude"] for point in measurements])
    wind_speeds = np.array([point["wind_speed"] for point in measurements])
    
    plt.scatter(longitudes, latitudes, c=wind_speeds, cmap='viridis', edgecolor='k', s=100, zorder=5)

    ax.set_xlabel('Longitude')
    ax.set_ylabel('Latitude')
    ax.set_title('Wind Speed and Direction Grid')
    plt.colorbar(label='Wind Speed (m/s)')
    plt.grid(True)

    if save_image and image_path:
        plt.savefig(image_path)
    
def create_multibox_grid_with_interpolated_measurements(measurements, 
                                                        box_size=0.01, 
                                                        min_box_size=0.001, 
                                                        max_box_size=0.02, 
                                                        margin=0.005, 
                                                        save_grid_images=False,
                                                        save_path=None):
    """
    Tworzy siatkę pudełek z interpolowanymi pomiarami oraz opcjonalnie zapisuje obraz z wizualizacją.
    
    Parametry:
    - measurements: lista punktów pomiarowych (zawiera latitude, longitude, temperature, wind speed oraz wind direction)
    - box_size: początkowy rozmiar pudełka (w stopniach)
    - min_box_size: minimalny rozmiar pudełka (w stopniach)
    - max_box_size: maksymalny rozmiar pudełka (w stopniach)
    - margin: dodatkowy margines na granicach (w stopniach)
    - save_grid_images: boolean, jeśli True, zapisuje obrazy do plików
    - image_path: ścieżka do pliku, w którym zapisany zostanie obraz (jeśli save_grid_image=True)

    Zwraca:
    - boxes: lista granic geograficznych pudełek w formacie [(lat_min, lat_max, lon_min, lon_max), ...]
    - box_values: wartości pomiarów przypisane do pudełek (po interpolacji wartości pomiędzy pudełkami)
    """
    
    boxes, temp_values, u_values, v_values, co_values = create_uniform_boxes(measurements, 
                                                                  box_size=box_size, 
                                                                  min_box_size=min_box_size, 
                                                                  max_box_size=max_box_size, 
                                                                  margin=margin)
    
    temp_values, u_values, v_values, co_values = recursive_interpolation_until_filled(boxes, temp_values, u_values, v_values, co_values)
    
    if save_grid_images:
        image_path_wind_plot = f'{save_path}/multibox_grid_with_interpolated_wind_values.png'
        image_path_temp_plot = f'{save_path}/multibox_grid_with_interpolated_temp_values.png'
        plot_temperature_grid(boxes, temp_values, measurements, save_image=save_grid_images, image_path=image_path_temp_plot)
        plot_wind_grid(boxes, u_values, v_values, measurements, save_image=save_grid_images, image_path=image_path_wind_plot)

    return boxes, temp_values, u_values, v_values, co_values


