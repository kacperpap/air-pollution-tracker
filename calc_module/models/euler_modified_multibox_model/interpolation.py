from utils import log_with_time


def chessboard_distance(i1, j1, i2, j2):
    return max(abs(i1 - i2), abs(j1 - j2))

def get_neighbors(grid_shape, i, j, distance):
    
    rows, cols = grid_shape
    neighbors = []
    
    for di in range(-distance, distance + 1):
        for dj in range(-distance, distance + 1):
            if di == 0 and dj == 0:
                continue
            
            new_i, new_j = i + di, j + dj
            
            if (0 <= new_i < rows and 
                0 <= new_j < cols and 
                chessboard_distance(i,j, new_i, new_j) <= distance):
                neighbors.append((new_i, new_j))
    
    return neighbors


def weighted_interpolation(values, grid_shape, distance, value_name=None):
    interpolated_values = values.copy()
    num_rows, num_cols = grid_shape

    effective_distance = max(1, min(distance, max(num_rows, num_cols)))

    full_indices = [
        (i, j) for i in range(num_rows) for j in range(num_cols)
        if interpolated_values[i * num_cols + j] is not None
    ]

    updated_boxes = {}

    for i, j in full_indices:
        neighbors = get_neighbors(grid_shape, i, j, effective_distance)

        for ni, nj in neighbors:
            neighbor_idx = ni * num_cols + nj

            if interpolated_values[neighbor_idx] is None:
                dist = chessboard_distance(i, j, ni, nj)
                weight = 1 / (1 + dist**2)

                if (ni, nj) not in updated_boxes:
                    updated_boxes[(ni, nj)] = (interpolated_values[i * num_cols + j] * weight, weight)
                else:
                    existing_value, existing_weight = updated_boxes[(ni, nj)]
                    new_value = interpolated_values[i * num_cols + j] * weight
                    updated_boxes[(ni, nj)] = (
                        existing_value + new_value,
                        existing_weight + weight
                    )

    for (ni, nj), (total_value, total_weight) in updated_boxes.items():
        interpolated_values[ni * num_cols + nj] = total_value / total_weight

    return interpolated_values


def recursive_interpolation_until_filled(boxes, temp_values, press_values, u_values, v_values, pollutant_values, grid_shape, initial_distance=1, increment=1):


    distance = max(1, initial_distance)
    
    while (
        any(value is None for value in temp_values) or 
        any(value is None for value in press_values) or 
        any(value is None for value in u_values) or 
        any(value is None for value in v_values) or 
        any(any(value is None for value in pollutant_values[pollutant]) for pollutant in pollutant_values)
    ):  
            
        iteration_details = {
            "Interpolation Distance": distance,
            "Grid Shape": grid_shape,
            "Interpolation Values": {}
        }
  

        temp_values = weighted_interpolation(
            temp_values, grid_shape,
            distance, 
            value_name="temperature",
        )
        
        press_values = weighted_interpolation(
            press_values, grid_shape, 
            distance, 
            value_name="pressure"
        )
        
        u_values = weighted_interpolation(
            u_values, grid_shape, 
            distance, 
            value_name="u value"
        )
                
        v_values = weighted_interpolation(
            v_values, grid_shape,
            distance, 
            value_name="v value",
        )
                
        for pollutant in pollutant_values:
            pollutant_values[pollutant] = weighted_interpolation(
                pollutant_values[pollutant], grid_shape, 
                distance, 
                value_name=str(pollutant)
            )
        
        distance += increment
        
    log_with_time(f"recursive_interpolation_until_filled -> interpolation finished")    
    return temp_values, press_values, u_values, v_values, pollutant_values
