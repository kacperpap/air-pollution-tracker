import json

class DiffusionCoefficients:
    @staticmethod
    def load_coefficients(filename='diffusion_coefficients.json'):
        with open(filename, 'r') as file:
            return json.load(file)
    
    coefficients = load_coefficients()

    @staticmethod
    def get_coefficient(pollutant):
        if pollutant not in DiffusionCoefficients.coefficients:
            raise ValueError(f"Nieznane zanieczyszczenie: {pollutant}")
        return DiffusionCoefficients.coefficients[pollutant]
