import traceback
import numpy as np
from utils import log_with_time
from models.euler_modified_multibox_model.debug_utils.plotting import plot_concentration_grid, plot_values_grid, plot_wind_grid
from models.euler_modified_multibox_model.diffusion_advection import calculate_diffusion_coefficients, calculate_stable_dt, update_concentration_crank_nicolson
from models.euler_modified_multibox_model.grid import create_uniform_boxes
from models.euler_modified_multibox_model.interpolation import recursive_interpolation_until_filled


def convert_geo_to_meters(boxes):
    """
    Latitude in radians is approximately 111 320 m (~111,32 km)
    Longitude lenghth in meters depends on latitude, and decreases with moving away from equator
    """
    dx = []
    dy = []
    
    for box in boxes:
        lat_center = np.radians((box[0] + box[1]) / 2)  
        dlat = box[1] - box[0]  
        dlon = box[3] - box[2]  
        
        dy.append(dlat * 111320)  
        dx.append(dlon * 111320 * np.cos(lat_center))
    
    return np.array(dx), np.array(dy)
  

def initialize_source_emission(flattened_pollutant_values, grid_shape, pollutant, dt=1):
    """
    Initialize the source term matrix for emissions.

    Parameters:
        flattened_pollutant_values (dict): Flattened pollutant values from the grid.
        grid_shape (tuple): Shape of the grid (num_lat_boxes, num_lon_boxes).
        pollutant (str): Pollutant name.

    Returns:
        2D array: Source term matrix (S_c) with emissions only at measurement points.
    """
    source_emission = np.zeros(grid_shape)
    pollutant_values = flattened_pollutant_values[pollutant].reshape(grid_shape)

    pollutant_values = np.where(pollutant_values == None, np.nan, pollutant_values).astype(float)

    valid_mask = ~np.isnan(pollutant_values)
    source_emission[valid_mask] = pollutant_values[valid_mask] / 3600 * dt

    return source_emission





def simulate_pollution_spread(data, num_steps, pollutants, grid_density="medium", urbanized=False, margin_boxes=1, initial_distance=1, max_increment=1, decay_rate=0.01, debug=False, debug_dir=None, snap_interval=10):
    
  try:
    
    boxes, temperature_values, pressure_values, u_grid, v_grid, flattened_pollutant_values, grid_shape = create_uniform_boxes(data,
                                                                                                                              pollutants,
                                                                                                                              grid_density=grid_density, urbanized=urbanized, margin_boxes=margin_boxes)
      
      
    temp_values, press_values, u_values, v_values, pollutant_values = recursive_interpolation_until_filled(boxes,
                                                                                                          temperature_values,
                                                                                                          pressure_values,
                                                                                                          u_grid,
                                                                                                          v_grid,
                                                                                                          flattened_pollutant_values,
                                                                                                          grid_shape,
                                                                                                          initial_distance=initial_distance,
                                                                                                          increment=max_increment)      
        
    if debug and debug_dir:
        image_path_wind_plot = f'{debug_dir}/multibox_grid_with_interpolated_wind_values.png'
        image_path_temp_plot = f'{debug_dir}/multibox_grid_with_interpolated_temp_values.png'
        image_path_press_plot = f'{debug_dir}/multibox_grid_with_interpolated_press_values.png'
          
        plot_values_grid(boxes, temp_values, data, values_type="temperature", image_path=image_path_temp_plot)
        plot_values_grid(boxes, press_values, data, values_type="pressure", image_path=image_path_press_plot)
        plot_wind_grid(boxes, u_values, v_values, data, grid_shape=grid_shape, image_path=image_path_wind_plot)
    
        
    # RUN SIMULATION, 
    
    x_coords = sorted(set([box[0] for box in boxes]))
    y_coords = sorted(set([box[2] for box in boxes]))
    nx, ny = len(x_coords), len(y_coords)
    
    dx_array, dy_array = convert_geo_to_meters(boxes)
    dx = np.mean(dx_array)
    dy = np.mean(dy_array)
    dt = 1

    
    final_concentration = {}
    snap_concentrations = {pollutant: [] for pollutant in pollutants}

    for pollutant in pollutants:
      
      C = np.array(pollutant_values[pollutant]).reshape((nx, ny))
      
      K_x = calculate_diffusion_coefficients(
          pollutant=pollutant,
          temperatures=np.array(temp_values).reshape((nx, ny)),
          pressures=np.array(press_values).reshape((nx, ny)),
          u_wind=np.array(u_values).reshape((nx, ny)),
          z_levels=10,  # Stała wysokość referencyjna dla turbulentnej dyfuzji
          box_size=dx,
          method="turbulent") # "molecular" | "turbulent"

      K_y = K_x.copy() 
             
      u = np.array(u_values).reshape((nx, ny))  
      v = np.array(v_values).reshape((nx, ny)) 
                   
      dt_stable = calculate_stable_dt(u, v, K_x, K_y, dx, dy)
      
      if dt > dt_stable:
          log_with_time(f"Info: step time {dt} is unstable. Will be changed to: {dt_stable}.")          
          dt = dt_stable
          
      else:
          log_with_time(f"Simulation running with step time {dt} (stability check passed: dt_stable = {dt_stable}).")
      
      source_emission = initialize_source_emission(flattened_pollutant_values, grid_shape, pollutant, dt=dt)

      S_c = np.zeros((nx, ny))
      
      snap_concentrations[pollutant].append(C.copy().flatten())

      if debug and debug_dir:
        image_path = f'{debug_dir}/start_{pollutant}_concentration_grid.png'
        plot_concentration_grid(boxes, C.flatten(), data, pollutant, image_path)
          
      for step in range(num_steps):
        
        S_c += source_emission
        
        C = update_concentration_crank_nicolson(C, u, v, K_x, K_y, dx, dy, dt, S_c, nx, ny, decay_rate=decay_rate)
        
        if step % snap_interval == 0:
          snap_concentrations[pollutant].append(C.copy().flatten())
                
        
        if dt > dt_stable:
          log_with_time(f"Simulation Info: step time {dt} becomce unstable in step: {step}. Will be changed to: {dt_stable}.")
          dt = min(dt, dt_stable)
        
      final_concentration[pollutant] = C.flatten().tolist()
          
      if debug and debug_dir and step == num_steps-1:
        image_path = f'{debug_dir}/end_{pollutant}_concentration_grid.png'
        plot_concentration_grid(boxes, C.flatten(), data, pollutant, image_path)
        
    return final_concentration, snap_concentrations, boxes, temp_values, press_values, u_values, v_values
  
  except Exception as e:
    log_with_time(f"simulate_pollution_spread -> Error occurred: {str(e)}")
    traceback.print_exc()