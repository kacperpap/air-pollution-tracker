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
  

def initialize_source_emission(flattened_pollutant_values, grid_shape, pollutant, dt=1, emission_rate=0.01):
    
    source_emission = np.zeros(grid_shape)
    pollutant_values = flattened_pollutant_values[pollutant].reshape(grid_shape)

    # Create mask for original measurement points (before interpolation)
    pollutant_array = np.array(pollutant_values, dtype=float)
    mask = pollutant_array != None
    pollutant_array = np.where(mask, pollutant_array, np.nan)
    
    original_sources_mask = ~np.isnan(pollutant_array)
       
    # Calculate emission based on initial concentration and emission rate
    # Similar to decay factor: exp(-decay_rate * dt / 3600)
    # But for emission we want to add concentration
    emission_factor = (1 - np.exp(-emission_rate * dt / 3600))
     
    base_emission = np.zeros_like(pollutant_values)
    
    base_emission[original_sources_mask] = (
        pollutant_values[original_sources_mask] * emission_factor
    )

    source_emission[original_sources_mask] = base_emission[original_sources_mask] / dt
    
    return source_emission





def simulate_pollution_spread(data, num_steps, pollutants, grid_density="medium", urbanized=False, margin_boxes=1, initial_distance=1, max_increment=1, decay_rate=0.01, emission_rate=0.01, debug=False, debug_dir=None, snap_interval=10):
    
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
    surface_roughness = 1.0 if urbanized else 0.1

    for pollutant in pollutants:
      
      C = np.array(pollutant_values[pollutant]).reshape((nx, ny))
      
      K_x = calculate_diffusion_coefficients(
          pollutant=pollutant,
          temperatures=np.array(temp_values).reshape((nx, ny)),
          pressures=np.array(press_values).reshape((nx, ny)),
          u_wind=np.array(u_values).reshape((nx, ny)),
          v_wind=np.array(v_values).reshape((nx,ny)),
          z_levels=10,  # Stała wysokość referencyjna dla turbulentnej dyfuzji
          box_size=dx,
          surface_roughness=surface_roughness,
          method="empirical") # "molecular" | "turbulent" | "empirical"

      K_y = K_x
                
      u = np.array(u_values).reshape((nx, ny))  
      v = np.array(v_values).reshape((nx, ny)) 
                         
      dt_stable = calculate_stable_dt(u, v, K_x, K_y, dx, dy)
      
      if dt > dt_stable:
          log_with_time(f"Pollutant {pollutant} simulation: step time {dt} is unstable. Will be changed to: {dt_stable}.",'warning')          
          dt = dt_stable
          
      else:
          log_with_time(f"Pollutant {pollutant} simulation: running with step time {dt} (stability check passed: dt_stable = {dt_stable}).")
      
      source_emission = initialize_source_emission(flattened_pollutant_values, grid_shape, pollutant, dt=dt, emission_rate=emission_rate)
      log_with_time(f'Pollutant {pollutant} simulation: initialize_source_emission -> calculated emission_factor = {(1 - np.exp(-emission_rate * dt / 3600))} (based on emission_rate = {emission_rate})')
      
      log_with_time(f'Pollutant {pollutant} simulation: update_concentration_crank_nicolson -> calculated decay_factor = {np.exp(-decay_rate * dt / 3600)} (based on decay_rate = {decay_rate})')


      S_c = np.zeros((nx, ny))
      S_c = source_emission
    
      snap_concentrations[pollutant].append(C.copy().flatten())

      if debug and debug_dir:
        image_path = f'{debug_dir}/start_{pollutant}_concentration_grid.png'
        plot_concentration_grid(boxes, C.flatten(), data, pollutant, image_path)
          
      for step in range(num_steps):
        
        C = update_concentration_crank_nicolson(C, u, v, K_x, K_y, dx, dy, dt, S_c, nx, ny, decay_rate=decay_rate)
        
        if step % snap_interval == 0:
          snap_concentrations[pollutant].append(C.copy().flatten())
                
        
        if dt > dt_stable:
          log_with_time(f"Pollutant {pollutant} simulation: step time {dt} becomce unstable in step: {step}. Will be changed to: {dt_stable}.", 'warning')
          dt = min(dt, dt_stable)
        
      final_concentration[pollutant] = C.flatten().tolist()
          
      if debug and debug_dir and step == num_steps-1:
        image_path = f'{debug_dir}/end_{pollutant}_concentration_grid.png'
        plot_concentration_grid(boxes, C.flatten(), data, pollutant, image_path)
        
    return final_concentration, snap_concentrations, boxes, temp_values, press_values, u_values, v_values
  
  except Exception as e:
    log_with_time(f"simulate_pollution_spread -> Error occurred: {str(e)}",'error')
    traceback.print_exc()