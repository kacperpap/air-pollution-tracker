from matplotlib import pyplot as plt
import numpy as np


def plot_concentration_grid(boxes, concentration_values, measurements, pollutant=None, image_path=None):
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

    if image_path:
        plt.savefig(image_path)
        
        
def plot_values_grid(boxes, values, measurements, values_type=None, image_path=None):
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

    if image_path:
        plt.savefig(image_path)

def plot_wind_grid(boxes, u_values, v_values, measurements, grid_shape, image_path=None):
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

    if image_path:
        plt.savefig(image_path)