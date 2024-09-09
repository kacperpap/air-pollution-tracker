import numpy as np
from scipy.spatial import KDTree
import matplotlib.pyplot as plt
from datetime import datetime

def create_uniform_boxes(data, box_size=0.01, min_box_size=0.001, max_box_size=0.02, margin=0.005):
    """
    Tworzy siatkę pudełek o rozmiarze opartym na średniej odległości między punktami pomiarowymi.
    
    Parametry:
    - data: lista punktów pomiarowych (zawiera latitude i longitude)
    - min_box_size: minimalny rozmiar pudełka (w stopniach)
    - max_box_size: maksymalny rozmiar pudełka (w stopniach)
    - margin: dodatkowy margines na granicach (w stopniach)
    
    Zwraca:
    - boxes: lista granic geograficznych pudełek w formacie [(lat_min, lat_max, lon_min, lon_max), ...]
    - box_values: wartości pomiarów przypisane do pudełek
    """

    latitudes = np.array([point["latitude"] for point in data])
    longitudes = np.array([point["longitude"] for point in data])
    temperatures = np.array([point["temperature"] for point in data])
    
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
    box_values = np.full((num_lat_boxes, num_lon_boxes), None)
    
    # obliczanie indeksów pudełek do których przypisujemy dane pomiarowe
    # lat - lat_min określa położenie na szerokości geograficzniej danego punktu pomiarowego jako odległość o poczatku siatki,
    # po czym podzielenie przez szerokość pudełka i zaokraglenie w górę daje nam index pudełka do którego przypisujemy zmierzone wartości 
    for lat, lon, temp in zip(latitudes, longitudes, temperatures):
        lat_idx = int((lat - lat_min) / box_size_lat)
        lon_idx = int((lon - lon_min) / box_size_lon)
        
        if 0 <= lat_idx < num_lat_boxes and 0 <= lon_idx < num_lon_boxes:
            if box_values[lat_idx, lon_idx] is None:
                box_values[lat_idx, lon_idx] = temp
            else:
                box_values[lat_idx, lon_idx] = (box_values[lat_idx, lon_idx] + temp) / 2



    for i in range(num_lat_boxes):
      for j in range(num_lon_boxes):
        lat_min_box = lat_min + i * box_size_lat
        lat_max_box = lat_min + (i + 1) * box_size_lat
        lon_min_box = lon_min + j * box_size_lon
        lon_max_box = lon_min + (j + 1) * box_size_lon
            
        boxes.append((lat_min_box, lat_max_box, lon_min_box, lon_max_box))
    
    return boxes, box_values.flatten()

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

def recursive_interpolation_until_filled(boxes, box_values, initial_distance=0.01, max_increment=0.01):
    """
    Rekursywna interpolacja, która kontynuuje, dopóki wszystkie pudełka nie zostaną wypełnione wartościami.
    
    Parametry:
    - boxes: lista granic geograficznych pudełek
    - box_values: wartości przypisane do pudełek (None dla pustych)
    - initial_distance: początkowa maksymalna odległość do sąsiednich pudełek
    - max_increment: krok zwiększający maksymalną odległość sąsiadów w każdej iteracji
    
    Zwraca:
    - box_values: wypełnione wartości w pudełkach
    """
    distance = initial_distance
    while any(value is None for value in box_values):
        box_values = interpolate_empty_boxes(boxes, box_values, max_distance=distance)
        distance += max_increment
    
    return box_values


def plot_boxes_with_values(boxes, box_values, measurements, save_image=False, image_path=None):
    """
    Rysuje siatkę pudełek z interpolowanymi wartościami oraz opcjonalnie zapisuje obraz.
    
    Parametry:
    - boxes: lista granic geograficznych pudełek [(lat_min, lat_max, lon_min, lon_max), ...]
    - box_values: wartości przypisane do pudełek (None dla pustych pudełek)
    - measurements: lista punktów pomiarowych (zawiera latitude, longitude i temperature)
    - save_image: boolean, jeśli True, zapisuje obraz do pliku
    - image_path: ścieżka do pliku, w którym zapisany zostanie obraz (jeśli save_image=True)
    """
    
    fig, ax = plt.subplots(figsize=(10, 8))

    # normalizacja 
    valid_values = [value for value in box_values if value is not None]
    if valid_values:
        min_value, max_value = min(valid_values), max(valid_values)
    else:
        min_value, max_value = 0, 1

    # Rysowanie pudełek
    for i, (lat_min, lat_max, lon_min, lon_max) in enumerate(boxes):
        color_value = box_values[i]
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
    
def create_multibox_grid_with_interpolated_measurements(measurements, 
                                                        box_size=0.01, 
                                                        min_box_size=0.001, 
                                                        max_box_size=0.02, 
                                                        margin=0.005, 
                                                        save_grid_image=False, 
                                                        image_path=None):
    """
    Tworzy siatkę pudełek z interpolowanymi pomiarami oraz opcjonalnie zapisuje obraz z wizualizacją.
    
    Parametry:
    - measurements: lista punktów pomiarowych (zawiera latitude, longitude i temperature)
    - box_size: początkowy rozmiar pudełka (w stopniach)
    - min_box_size: minimalny rozmiar pudełka (w stopniach)
    - max_box_size: maksymalny rozmiar pudełka (w stopniach)
    - margin: dodatkowy margines na granicach (w stopniach)
    - save_grid_image: boolean, jeśli True, zapisuje obraz do pliku
    - image_path: ścieżka do pliku, w którym zapisany zostanie obraz (jeśli save_grid_image=True)

    Zwraca:
    - boxes: lista granic geograficznych pudełek w formacie [(lat_min, lat_max, lon_min, lon_max), ...]
    - box_values: wartości pomiarów przypisane do pudełek (po interpolacji wartości pomiędzy pudełkami)
    """
    
    boxes, box_values = create_uniform_boxes(measurements, box_size, min_box_size, max_box_size, margin)
    
    box_values = recursive_interpolation_until_filled(boxes, box_values)
    
    if save_grid_image and image_path is None:
        date_str = datetime.now().strftime("%Y_%m_%d_%H%M%S")
        image_path = f'models/euler_volume_muliboxes_model/multibox_grid_with_interpolated_values_{date_str}.png'
    
    if save_grid_image:
      plot_boxes_with_values(boxes, box_values, measurements, save_image=save_grid_image, image_path=image_path)

    return boxes, box_values


