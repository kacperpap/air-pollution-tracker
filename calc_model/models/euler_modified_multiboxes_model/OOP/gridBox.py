class GridBox:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.pollutant_concentration = 0.0 
        self.wind = None
        self.temperature = None

    def update_conditions(self, wind, temperature):
        self.wind = wind
        self.temperature = temperature

    def update_concentration(self, delta_concentration):
        self.pollutant_concentration += delta_concentration
