import numpy as np

from utils import log_with_time

def create_uniform_boxes(data, pollutants, grid_density=None, urbanized=False, margin_boxes=1, max_boxes=5000):
    
    latitudes = np.array([point["latitude"] for point in data])
    longitudes = np.array([point["longitude"] for point in data])
    temperatures = np.array([point["temperature"] for point in data])
    pressures = np.array([point["pressure"] for point in data])
    wind_speeds = np.array([point["windSpeed"] for point in data])
    wind_directions = np.array([point["windDirection"] for point in data])

    pollutants_initial_values = {pollutant: np.array([point[f'{pollutant}'] for point in data]) for pollutant in pollutants}
    
    
    """
    Kierunek wiatru podawany jest w stopniach, jako azymut, czyli odchylenie od północy co oznacza, że np. kierunek północny to 0 st.
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

    total_area = (lat_max - lat_min) * (lon_max - lon_min)
    target_boxes = {"dense": 1000, "medium": 100, "sparse": 10}.get(grid_density, 100)
        
    if urbanized:
        target_boxes *= 2
        
    box_area = total_area / target_boxes
    box_size_lat = np.sqrt(box_area)
    box_size_lon = box_size_lat
    
            
    lat_min -= margin_boxes * box_size_lat
    lat_max += margin_boxes * box_size_lat
    lon_min -= margin_boxes * box_size_lon
    lon_max += margin_boxes * box_size_lon
    
    num_lat_boxes = int(np.ceil((lat_max - lat_min) / box_size_lat))
    num_lon_boxes = int(np.ceil((lon_max - lon_min) / box_size_lon))
    total_boxes = num_lat_boxes * num_lon_boxes
    
    if total_boxes > max_boxes:
        raise ValueError(f"Exceeded maximum number of boxes. Generated {total_boxes} boxes, max allowed is {max_boxes}")
    
    
    boxes = []
    pollutant_values = {pollutant: np.full((num_lat_boxes, num_lon_boxes), None) for pollutant in pollutants}
    temperature_values = np.full((num_lat_boxes, num_lon_boxes), None)
    pressure_values = np.full((num_lat_boxes, num_lon_boxes), None)
    u_grid = np.full((num_lat_boxes, num_lon_boxes), None)
    v_grid = np.full((num_lat_boxes, num_lon_boxes), None)
    
    # obliczanie indeksów pudełek do których przypisujemy dane pomiarowe
    # lat - lat_min określa położenie na szerokości geograficzniej danego punktu pomiarowego jako odległość o poczatku siatki,
    # po czym podzielenie przez szerokość pudełka i zaokraglenie w górę daje nam index pudełka do którego przypisujemy zmierzone wartości 
    measurements_in_boxes = [[[] for _ in range(num_lon_boxes)] for _ in range(num_lat_boxes)]

    
    for lat, lon, temp, press, u, v, *pollutant_concentrations in zip(latitudes, longitudes, temperatures, pressures, u_values, v_values,  *pollutants_initial_values.values()):
        lat_idx = int((lat - lat_min) / box_size_lat)
        lon_idx = int((lon - lon_min) / box_size_lon)
        
        if 0 <= lat_idx < num_lat_boxes and 0 <= lon_idx < num_lon_boxes:
            measurements_in_boxes[lat_idx][lon_idx].append({
                "latitude": lat, "longitude": lon, "temperature": temp, "pressure": press,
                "u_value": u, "v_value": v,
                **{pollutant: concentration for pollutant, concentration in zip(pollutants, pollutant_concentrations)}
            })
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
    
    log_with_time(f"create_uniform_boxes -> Grid created, shape: {num_lat_boxes} x {num_lon_boxes}, total boxes number: {num_lat_boxes * num_lon_boxes}")
         
    return boxes, temperature_values.flatten(), pressure_values.flatten(), u_grid.flatten(), v_grid.flatten(), flattened_pollutant_values, grid_shape