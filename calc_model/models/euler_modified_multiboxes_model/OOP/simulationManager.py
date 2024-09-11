class SimulationManager:
    def __init__(self, grid, concentration_simulator):
        self.grid = grid
        self.concentration_simulator = concentration_simulator

    def run_simulation(self, steps, external_data):
        """
        Główna pętla symulacji. Dla każdej iteracji aktualizuje warunki atmosferyczne,
        a następnie przeprowadza symulację zmiany stężenia zanieczyszczeń.
        """
        for step in range(steps):
            print(f"Running step {step+1}...")

            self.grid.update_conditions(external_data)

            self.concentration_simulator.simulate_step(self.grid.get_grid_boxes())
