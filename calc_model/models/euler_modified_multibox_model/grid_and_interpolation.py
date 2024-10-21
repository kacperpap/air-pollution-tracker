import numpy as np
import matplotlib.pyplot as plt

def create_uniform_boxes(data, pollutants, box_size=(None, None), grid_density=None, urbanized=False, margin_boxes=1):
    """
    Tworzy siatkę pudełek o rozmiarze opartym na średniej odległości między punktami pomiarowymi,
    uwzględniając dodatkowe parametry takie jak gęstość siatki oraz urbanizacja.

    Parametry:
    - data: lista punktów pomiarowych (zawiera latitude, longitude, temperature, wind_speed, wind_direction)
    - pollutants: lista zanieczyszczeń do uwzględnienia (np. ["CO", "O3", "NO2"])
    - box_size: rozmiar pudełka w stopniach (jeśli podany, ignoruje inne parametry dotyczące gęstości)
    - grid_density: gęstość siatki ('gęsta', 'średnia', 'rzadka')
    - urbanized: czy obszar jest zurbanizowany (bool)
    - margin_boxes: liczba dodatkowych pudełek dodanych z każdej strony siatki

    Zwraca:
    - boxes: lista granic geograficznych pudełek w formacie [(lat_min, lat_max, lon_min, lon_max), ...]
    - temperature_values: wartości temperatur przypisane do pudełek
    - u_grid: wartości składowej wiatru w kierunku x przypisane do pudełek
    - v_grid: wartości składowej wiatru w kierunku y przypisane do pudełek
    - pollutant_values: słownik z wartościami stężeń dla każdego z zanieczyszczeń
    - co_values: wartości stężenia CO przypisane do pudełek
    """

    latitudes = np.array([point["latitude"] for point in data])
    longitudes = np.array([point["longitude"] for point in data])
    temperatures = np.array([point["temperature"] for point in data])
    pressures = np.array([point["pressure"] for point in data])
    wind_speeds = np.array([point["windSpeed"] for point in data])
    wind_directions = np.array([point["windDirection"] for point in data])

    pollutants_initial_values = {pollutant: np.array([point[f'{pollutant}'] for point in data]) for pollutant in pollutants}
    

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

    if box_size[0] is None and box_size[1] is None:
        total_area = (lat_max - lat_min) * (lon_max - lon_min)
        
        target_boxes = {"dense": 1000, "medium": 100, "sparse": 10}.get(grid_density, 100)
        
        if urbanized:
            target_boxes *= 2
        
        box_area = total_area / target_boxes
        box_size_lat = np.sqrt(box_area)
        box_size_lon = box_size_lat
    else:
        if box_size[0] is None:
            box_size_lat = box_size[1]
            box_size_lon = box_size[1]
        elif box_size[1] is None:
            box_size_lat = box_size[0]
            box_size_lon = box_size[0]
        else:
            box_size_lat, box_size_lon = box_size


    lat_min -= margin_boxes * box_size_lat
    lat_max += margin_boxes * box_size_lat
    lon_min -= margin_boxes * box_size_lon
    lon_max += margin_boxes * box_size_lon
    
    num_lat_boxes = int(np.ceil((lat_max - lat_min) / box_size_lat))
    num_lon_boxes = int(np.ceil((lon_max - lon_min) / box_size_lon))
    
    boxes = []
    pollutant_values = {pollutant: np.full((num_lat_boxes, num_lon_boxes), None) for pollutant in pollutants}
    temperature_values = np.full((num_lat_boxes, num_lon_boxes), None)
    pressure_values = np.full((num_lat_boxes, num_lon_boxes), None)
    u_grid = np.full((num_lat_boxes, num_lon_boxes), None)
    v_grid = np.full((num_lat_boxes, num_lon_boxes), None)
    
    # obliczanie indeksów pudełek do których przypisujemy dane pomiarowe
    # lat - lat_min określa położenie na szerokości geograficzniej danego punktu pomiarowego jako odległość o poczatku siatki,
    # po czym podzielenie przez szerokość pudełka i zaokraglenie w górę daje nam index pudełka do którego przypisujemy zmierzone wartości 
    for lat, lon, temp, press, u, v, *pollutant_concentrations in zip(latitudes, longitudes, temperatures, pressures, u_values, v_values,  *pollutants_initial_values.values()):
        lat_idx = int((lat - lat_min) / box_size_lat)
        lon_idx = int((lon - lon_min) / box_size_lon)
        
        if 0 <= lat_idx < num_lat_boxes and 0 <= lon_idx < num_lon_boxes:
            if temperature_values[lat_idx, lon_idx] is None:
                temperature_values[lat_idx, lon_idx] = temp
                pressure_values[lat_idx, lon_idx] = press
                u_grid[lat_idx, lon_idx] = u
                v_grid[lat_idx, lon_idx] = v
                                
                for pollutant, concentration in zip(pollutant_values.keys(), pollutant_concentrations):
                    pollutant_values[pollutant][lat_idx, lon_idx] = concentration
                    
            else:
                temperature_values[lat_idx, lon_idx] = (temperature_values[lat_idx, lon_idx] + temp) / 2
                pressure_values[lat_idx, lon_idx] = (pressure_values[lat_idx, lon_idx] + press) / 2
                u_grid[lat_idx, lon_idx] = (u_grid[lat_idx, lon_idx] + u) / 2
                v_grid[lat_idx, lon_idx] = (v_grid[lat_idx, lon_idx] + v) / 2
                
                for pollutant, concentration in zip(pollutant_values.keys(), pollutant_concentrations):
                    if pollutant_values[pollutant][lat_idx, lon_idx] is None:
                        pollutant_values[pollutant][lat_idx, lon_idx] = concentration
                    else:
                        pollutant_values[pollutant][lat_idx, lon_idx] = (pollutant_values[pollutant][lat_idx, lon_idx] + concentration) / 2

    for i in range(num_lat_boxes):
      for j in range(num_lon_boxes):
        lat_min_box = lat_min + i * box_size_lat
        lat_max_box = lat_min + (i + 1) * box_size_lat
        lon_min_box = lon_min + j * box_size_lon
        lon_max_box = lon_min + (j + 1) * box_size_lon
            
        boxes.append((lat_min_box, lat_max_box, lon_min_box, lon_max_box))
    
    grid_shape = (num_lat_boxes, num_lon_boxes)
    
    flattened_pollutant_values = {pollutant: values.flatten() for pollutant, values in pollutant_values.items()}
    
    return boxes, temperature_values.flatten(), pressure_values.flatten(), u_grid.flatten(), v_grid.flatten(), flattened_pollutant_values, grid_shape

def interpolate_empty_boxes(boxes, box_values, grid_shape, max_distance=1):
    """
    Interpoluje wartości w pustych pudełkach na podstawie sąsiednich pudełek w odległości wyrażonej liczbą pudełek. Jako nerby_values znajduje wszystkie pudełka o odległości max_distance w pionie, poziomie oraz po skosie, które mają
    wartości różne on None.
    
    Parametry:
    - boxes: lista granic geograficznych pudełek [(lat_min, lat_max, lon_min, lon_max), ...]
    - box_values: wartości przypisane do pudełek (None dla pustych pudełek)
    - grid_shape: kształt siatki (liczba pudełek na osi szerokości i długości geograficznej)
    - max_distance: maksymalna odległość wyrażona liczbą pudełek
    
    Zwraca:
    - box_values: zaktualizowane wartości dla pudełek po interpolacji
    """
     
    num_lat_boxes, num_lon_boxes = grid_shape
    
    for i in range(num_lat_boxes):
        for j in range(num_lon_boxes):
            if box_values[i * num_lon_boxes + j] is None: 
                nearby_values = []
                for di in range(-max_distance, max_distance + 1):
                    for dj in range(-max_distance, max_distance + 1):
                        ni = i + di
                        nj = j + dj
                        if 0 <= ni < num_lat_boxes and 0 <= nj < num_lon_boxes:
                            neighbor_value = box_values[ni * num_lon_boxes + nj]
                            if neighbor_value is not None:
                                nearby_values.append(neighbor_value)
                if nearby_values:
                    box_values[i * num_lon_boxes + j] = np.mean(nearby_values)
    
    
    return box_values

def recursive_interpolation_until_filled(boxes, temp_values, press_values, u_values, v_values, pollutant_values, grid_shape, initial_distance=1, max_increment=1):
    """
    Rekursywna interpolacja dla temperatury i prędkości wiatru, która kontynuuje, dopóki wszystkie pudełka nie zostaną wypełnione wartościami.
    
    Parametry:
    - boxes: lista granic geograficznych pudełek
    - temp_values, u_values, v_values: wartości przypisane do pudełek (None dla pustych)
    - pollutant_values: słownik zawierający wartości dla każdego zanieczyszczenia
    - grid_shape: kształt siatki (liczba pudełek na osi szerokości i długości geograficznej)
    - initial_distance: początkowa maksymalna odległość do sąsiednich pudełek (liczona w liczbie pudełek)
    - max_increment: krok zwiększający maksymalną odległość sąsiadów w każdej iteracji (w liczbie pudełek)
    
    Zwraca:
    - zaktualizowane temp_values, u_values, v_values, pollutant_values
    """
    
    distance = initial_distance
    
    while (
        any(value is None for value in temp_values) or 
        any(value is None for value in press_values) or 
        any(value is None for value in u_values) or 
        any(value is None for value in v_values) or 
        any(any(value is None for value in pollutant_values[pollutant]) for pollutant in pollutant_values)
    ):
        temp_values = interpolate_empty_boxes(boxes, temp_values, grid_shape, max_distance=distance)
        press_values = interpolate_empty_boxes(boxes, press_values, grid_shape, max_distance=distance)
        u_values = interpolate_empty_boxes(boxes, u_values, grid_shape, max_distance=distance)
        v_values = interpolate_empty_boxes(boxes, v_values, grid_shape, max_distance=distance)

        for pollutant in pollutant_values:
            pollutant_values[pollutant] = interpolate_empty_boxes(boxes, pollutant_values[pollutant], grid_shape, max_distance=distance)
        
        distance += max_increment
    
    return temp_values, press_values, u_values, v_values, pollutant_values


def plot_values_grid(boxes, values, measurements, values_type=None, save_image=False, image_path=None):
    """
    Rysuje siatkę pudełek z interpolowanymi wartościami oraz opcjonalnie zapisuje obraz.
    
    Parametry:
    - boxes: lista granic geograficznych pudełek [(lat_min, lat_max, lon_min, lon_max), ...]
    - values: wartości przypisane do pudełek (None dla pustych pudełek)
    - measurements: lista punktów pomiarowych
    - save_image: boolean, jeśli True, zapisuje obraz do pliku
    - image_path: ścieżka do pliku, w którym zapisany zostanie obraz (jeśli save_image=True)
    """
    
    fig, ax = plt.subplots(figsize=(10, 8))

    valid_values = [value for value in values if value is not None]
    if valid_values:
        min_value, max_value = min(valid_values), max(valid_values)
    else:
        min_value, max_value = 0, 1

    for i, (lat_min, lat_max, lon_min, lon_max) in enumerate(boxes):
        color_value = values[i]
        if color_value is not None and not np.isnan(color_value) and np.isfinite(color_value):
            if max_value != min_value:
                normalized_value = (color_value - min_value) / (max_value - min_value)
            else:
                normalized_value = 0
            color = plt.cm.coolwarm(normalized_value)  
        else:
            color = 'lightgrey'
        
        rect = plt.Rectangle((lon_min, lat_min), lon_max - lon_min, lat_max - lat_min, 
                             linewidth=0.5, edgecolor='black', facecolor=color)
        ax.add_patch(rect)

        # EDIT: wypisywanie temperatury wewnątrz boxa

        # center_lat = 0.5 * (lat_min + lat_max)
        # center_lon = 0.5 * (lon_min + lon_max)
        
        # if color_value is not None:
        #     plt.text(center_lon, center_lat, f'{color_value:.1f}', ha='center', va='center', fontsize=8, color='black', fontweight='bold')

    latitudes = np.array([point["latitude"] for point in measurements])
    longitudes = np.array([point["longitude"] for point in measurements])
    measured_values = np.array([point[f"{values_type}"] for point in measurements])
    plt.scatter(longitudes, latitudes, c=measured_values, cmap='coolwarm', edgecolor='k', s=100, zorder=5)

    ax.set_xlabel('Longitude')
    ax.set_ylabel('Latitude')
    ax.set_title('Uniform Grid Boxes with Interpolated Values')
    plt.colorbar(label=f'{values_type}')
    plt.grid(True)

    if save_image and image_path:
        plt.savefig(image_path)

def plot_wind_grid(boxes, u_values, v_values, measurements, grid_shape, save_image=False, image_path=None):
    """
    Rysuje siatkę pudełek z prędkością i kierunkiem wiatru (u, v) oraz opcjonalnie zapisuje obraz.
    
    Parametry:
    - boxes: lista granic geograficznych pudełek [(lat_min, lat_max, lon_min, lon_max), ...]
    - u_values, v_values: wartości przypisane do pudełek (składowe prędkości wiatru u, v)
    - measurements: lista punktów pomiarowych (zawiera latitude, longitude i wind_speed, wind_direction)
    - save_image: boolean, jeśli True, zapisuje obraz do pliku
    - image_path: ścieżka do pliku, w którym zapisany zostanie obraz (jeśli save_image=True)
    """
    
    num_boxes = len(boxes) 
    num_lat_boxes, num_lon_boxes = grid_shape
    
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
        
        
    if num_boxes >= 1000: 
        arrow_scale_factor = 1
        step = 5 
    elif 100 < num_boxes < 1000: 
        arrow_scale_factor = 0.2
        step = 1  
    else: 
        arrow_scale_factor = 0.4
        step = 1

    
    for i, (lat_min, lat_max, lon_min, lon_max) in enumerate(boxes):
        u_value = u_values[i]
        v_value = v_values[i]
        wind_speed = np.sqrt(u_value**2 + v_value**2) if u_value is not None and v_value is not None else None
        
        if wind_speed is not None:
            color = plt.cm.viridis(wind_speed / max_speed)
        else:
            color = 'lightgrey'
        
        rect = plt.Rectangle((lon_min, lat_min), lon_max - lon_min, lat_max - lat_min, 
                             linewidth=0.5, edgecolor='black', facecolor=color)
        ax.add_patch(rect)

        center_lat = 0.5 * (lat_min + lat_max)
        center_lon = 0.5 * (lon_min + lon_max)
        
        lat_min, lat_max, lon_min, lon_max = boxes[0]
        box_size = np.sqrt((lon_max - lon_min)**2 + (lat_max - lat_min)**2)
        arrow_scale = box_size * arrow_scale_factor * wind_speed / max_speed if wind_speed is not None else 1

        if u_value is not None and v_value is not None and (i % step == 0):
            ax.quiver(center_lon, center_lat, u_value, v_value, angles='xy', scale_units='xy', scale=1/arrow_scale, color='black', zorder=5)

    latitudes = np.array([point["latitude"] for point in measurements])
    longitudes = np.array([point["longitude"] for point in measurements])
    wind_speeds = np.array([point["windSpeed"] for point in measurements])
    
    plt.scatter(longitudes, latitudes, c=wind_speeds, cmap='viridis', edgecolor='k', s=100, zorder=5)

    ax.set_xlabel('Longitude')
    ax.set_ylabel('Latitude')
    ax.set_title('Wind Speed and Direction Grid')
    plt.colorbar(label='Wind Speed (m/s)')
    plt.grid(True)

    if save_image and image_path:
        plt.savefig(image_path)
        
    
def create_multibox_grid_with_interpolated_measurements(measurements,
                                                        pollutants, 
                                                        box_size=None, 
                                                        grid_density="medium", 
                                                        urbanized=False, 
                                                        margin_boxes=1, 
                                                        initial_distance=1,
                                                        max_increment=1,
                                                        save_grid_images=False,
                                                        save_path=None):
    """
    Tworzy siatkę pudełek z interpolowanymi pomiarami oraz opcjonalnie zapisuje obraz z wizualizacją.
    
    Parametry:
    - measurements: lista punktów pomiarowych (zawiera latitude, longitude, temperature, wind speed oraz wind direction)
    - pollutants: lista zanieczyszczeń (np. ["CO", "O3", "NO2"])
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
        
    boxes, temp_values, press_values, u_values, v_values, pollutant_values, grid_shape = create_uniform_boxes(measurements, 
                                                                                                pollutants,
                                                                                                box_size=box_size, 
                                                                                                grid_density=grid_density, 
                                                                                                urbanized=urbanized, 
                                                                                                margin_boxes=margin_boxes)
    
    
    temp_values, press_values, u_values, v_values, pollutant_values = recursive_interpolation_until_filled(boxes, 
                                                                                             temp_values,
                                                                                             press_values, 
                                                                                             u_values, 
                                                                                             v_values, 
                                                                                             pollutant_values, 
                                                                                             grid_shape, 
                                                                                             initial_distance, 
                                                                                             max_increment)
    
    if save_grid_images:
        image_path_wind_plot = f'{save_path}/multibox_grid_with_interpolated_wind_values.png'
        image_path_temp_plot = f'{save_path}/multibox_grid_with_interpolated_temp_values.png'
        image_path_press_plot = f'{save_path}/multibox_grid_with_interpolated_press_values.png'
        
        plot_values_grid(boxes, temp_values, measurements, values_type="temperature", save_image=save_grid_images, image_path=image_path_temp_plot)
        plot_values_grid(boxes, press_values, measurements, values_type="pressure", save_image=save_grid_images, image_path=image_path_press_plot)
        plot_wind_grid(boxes, u_values, v_values, measurements, grid_shape=grid_shape, save_image=save_grid_images, image_path=image_path_wind_plot)

    return boxes, temp_values, press_values, u_values, v_values, pollutant_values


