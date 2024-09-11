import numpy as np

class Grid:
    def __init__(self, data, box_size=0.01, min_box_size=0.001, max_box_size=0.02, margin=0.005):
        self.width = width
        self.height = height
        self.grid_boxes = [[GridBox(i, j) for j in range(height)] for i in range(width)]
        self.interpolator = interpolator  # Obiekt klasy Interpolator, odpowiedzialny za interpolację

    def update_conditions(self, external_data):
        """
        Metoda aktualizująca warunki w każdym GridBox na podstawie danych zewnętrznych
        (np. dane o temperaturze i wietrze interpolowane dla danej pozycji).
        """
        for i in range(self.width):
            for j in range(self.height):
                wind, temp = self.interpolator.get_interpolated_values(i, j, external_data)
                self.grid_boxes[i][j].update_conditions(wind, temp)

    def get_grid_boxes(self):
        return self.grid_boxes
