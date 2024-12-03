import traceback
import numpy as np
from utils import log_with_time
from models.euler_modified_multibox_model.debug_utils.logging import log_to_file
from models.euler_modified_multibox_model.debug_utils.plotting import plot_concentration_grid, plot_values_grid, plot_wind_grid
from models.euler_modified_multibox_model.diffusion_advection import calculate_diffusion_coefficient, calculate_stable_dt, update_concentration_crank_nicolson
from models.euler_modified_multibox_model.grid import create_uniform_boxes
from models.euler_modified_multibox_model.interpolation import recursive_interpolation_until_filled


def simulate_pollution_spread(data, num_steps, dt, pollutants, grid_density="medium", urbanized=False, margin_boxes=1, initial_distance=1, max_increment=1, debug=False, debug_with_plots=False, debug_dir=None, debug_file=None):
    
  try:
    
    # grid creation
    boxes, temperature_values, pressure_values, u_grid, v_grid, flattened_pollutant_values, grid_shape = create_uniform_boxes(data,
                                                                                                                              pollutants,
                                                                                                                              grid_density=grid_density, urbanized=urbanized, margin_boxes=margin_boxes,
                                                                                                                              debug=debug,
                                                                                                                              debug_file=debug_file)
      
      
    # interpolation values across all grid boxes
    temp_values, press_values, u_values, v_values, pollutant_values = recursive_interpolation_until_filled(boxes,
                                                                                                          temperature_values,
                                                                                                          pressure_values,
                                                                                                          u_grid,
                                                                                                          v_grid,
                                                                                                          flattened_pollutant_values,
                                                                                                          grid_shape,
                                                                                                          initial_distance=initial_distance,
                                                                                                          increment=max_increment,
                                                                                                          debug=debug,
                                                                                                          debug_file=debug_file)
      
    # if debug plot interpolated values on grid
    if debug_with_plots and debug_dir:
        image_path_wind_plot = f'{debug_dir}/multibox_grid_with_interpolated_wind_values.png'
        image_path_temp_plot = f'{debug_dir}/multibox_grid_with_interpolated_temp_values.png'
        image_path_press_plot = f'{debug_dir}/multibox_grid_with_interpolated_press_values.png'
          
        plot_values_grid(boxes, temp_values, data, values_type="temperature", image_path=image_path_temp_plot)
        plot_values_grid(boxes, press_values, data, values_type="pressure", image_path=image_path_press_plot)
        plot_wind_grid(boxes, u_values, v_values, data, grid_shape=grid_shape, image_path=image_path_wind_plot)
    
        
    # run simulation
    x_coords = sorted(set([box[0] for box in boxes]))
    y_coords = sorted(set([box[2] for box in boxes]))

    nx = len(x_coords)
    ny = len(y_coords)
      
    # concentration_over_time = {pollutant: [] for pollutant in pollutants}
    final_concentration = {}
      
    for pollutant in pollutants:
      C = np.array(pollutant_values[pollutant]).reshape((nx, ny))
      K_x = np.zeros_like(C)
      K_y = np.zeros_like(C)

      for i in range(nx):
          for j in range(ny):
              K = calculate_diffusion_coefficient(pollutant, temp_values[i * ny + j], press_values[i * ny + j])  
              K_x[i, j] = K
              K_y[i, j] = K

      u = np.array(u_values).reshape((nx, ny))  
      v = np.array(v_values).reshape((nx, ny)) 
  
      dx = (x_coords[1] - x_coords[0])  
      dy = (y_coords[1] - y_coords[0]) 
        
      dt_stable = calculate_stable_dt(u, v, K_x, K_y, dx, dy)
      if dt > dt_stable:
          print(f"Uwaga: krok czasowy {dt} jest niestabilny. Zostanie zmieniony na {dt_stable}.")
          dt = dt_stable

      # założenie - brak dodatkowych źródeł emisji 
      S_c = np.zeros_like(C) 

      if debug_with_plots and debug_dir:
        image_path = f'{debug_dir}/start_{pollutant}_concentration_grid.png'
        plot_concentration_grid(boxes, C.flatten(), data, pollutant, image_path)
          
    #   concentration_over_time[pollutant].append(C.copy())


      for step in range(num_steps):
          C = update_concentration_crank_nicolson(C, u, v, K_x, K_y, dx, dy, dt, S_c, nx, ny)
        #   concentration_over_time[pollutant].append(C.copy())
          if debug is True:
            # create and save debug files from each step
            pass
      
      final_concentration[pollutant] = C.flatten().tolist()

          
      if debug_with_plots and debug_dir and step == num_steps-1:
        image_path = f'{debug_dir}/end_{pollutant}_concentration_grid.png'
        plot_concentration_grid(boxes, C.flatten(), data, pollutant, image_path)
       
    return final_concentration, boxes, temp_values, press_values, u_values, v_values
  
  except Exception as e:
    log_with_time(f"simulate_pollution_spread -> Error occurred: {str(e)}")
    traceback.print_exc()