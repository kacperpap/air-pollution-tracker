export const generateSimulationData = () => {
 
 return {
   selectedFlight: "",
   numerOfSteps: '1000',
   pollutants: ["CO"],
   decayRate: '0,02',
   emissionRate: '0,02',
   gridDensity: 'Sparse',
   margniBoxes: '1',
   snapInterval: '100'
 };
};