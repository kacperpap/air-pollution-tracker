import React, { useState, useEffect } from 'react';
import { DroneFlightType } from '../../types/DroneFlightType';
import { SimulationRequestType } from '../../types/SimulationRequestType';
import { getAllDroneFlights } from '../overview/api/getAllDroneFlights';
import { Notification } from "../../components/Notification";
import { NotificationProps } from '../../types/NotificationPropsType';
import { simulatePollutionSpread } from './api/simulate';
import { useNavigate } from 'react-router-dom';
import { SimulationResponseType } from '../../types/SimulationResponseType';


export function SimulationInput() {

    const navigate = useNavigate()

    const [loading, setLoading] = useState(false);

    const [notification, setNotification] = useState<NotificationProps>({
        message: "",
        description: "",
        type: "",
      });

    const [droneFlights, setDroneFlights] = useState<DroneFlightType[]>([]);
    const [availablePollutants, setAvailablePollutants] = useState<string[]>([]);

    const [formData, setFormData] = useState<SimulationRequestType>({
        droneFlight: {
            id: null,
            title: '',
            description: '',
            date: undefined,
            measurements: [],
        },
        numSteps: 1000,
        pollutants: [],
        gridDensity: 'medium',
        urbanized: false,
        marginBoxes: 1,
        initialDistance: 1,
        decayRate: 0.01,
        emissionRate: 0.01,
        snapInterval: 10
    });


    useEffect(() => {
        const fetchFlightData = async () => {
          try {
            const flights = await getAllDroneFlights(); 
            setDroneFlights(flights); 
          } catch (error) {
            setNotification({
              message: 'Error',
              description: 'Failed to fetch flight data: ' + error,
              type: 'error',
            });
          }
        };
        fetchFlightData();
      }, []);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSelectFlight = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedFlight = droneFlights.find((flight) => flight.id === parseInt(e.target.value));
        if (selectedFlight) {
          setFormData((prev) => ({
            ...prev,
            droneFlight: selectedFlight, 
          }));

          const availablePollutants = selectedFlight.measurements
          .flatMap(measurement => measurement.pollutionMeasurements.map(pm => pm.type));

          setAvailablePollutants(Array.from(new Set(availablePollutants)));
        }
      };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
    

        if (formData.numSteps <= 0) {
            setNotification({
                message: 'Error',
                description: 'Number of steps must be a positive value.',
                type: 'error',
            });
            return;
        }
    
        if (formData.pollutants.length === 0) {
            setNotification({
                message: 'Error',
                description: 'At least one pollutant must be selected.',
                type: 'error',
            });
            return;
        }
    
        if (!formData.droneFlight.id) {
            setNotification({
                message: 'Error',
                description: 'You must select a drone flight.',
                type: 'error',
            });
            return;
        }
    
        if (formData.marginBoxes < 0) {
            setNotification({
                message: 'Error',
                description: 'Margin boxes cannot be a negative value.',
                type: 'error',
            });
            return;
        }
    
        if (formData.initialDistance < 0) {
            setNotification({
                message: 'Error',
                description: 'Initial distance cannot be a negative value.',
                type: 'error',
            });
            return;
        }

        if (formData.decayRate <= 0 || formData.decayRate >= 1) {
          setNotification({
              message: 'Error',
              description: 'Decay rate must be in (0,1) range.',
              type: 'error',
          });
          return;
        }

        if (formData.snapInterval < 0) {
          setNotification({
              message: 'Error',
              description: 'Snap interval cannot be a negative value.',
              type: 'error',
          });
          return;
        }
    

        try {
            setLoading(true)
            
            const { simulationId }: { simulationId: number } = await simulatePollutionSpread(formData);

            setFormData({
                droneFlight: {
                    id: null,
                    title: '',
                    description: '',
                    date: undefined,
                    measurements: [],
                },
                numSteps: 1000,
                pollutants: [],
                gridDensity: 'medium',
                urbanized: false,
                marginBoxes: 1,
                initialDistance: 1,
                decayRate: 0.01,
                emissionRate: 0.01,
                snapInterval: 10
            });

            sessionStorage.setItem('isFromSimulationCreation', 'true');
            navigate(`/simulation-overview/${simulationId}`);

        } catch (error) {
            setNotification({
                message: 'Error',
                description: 'Failed to send data to simulation module: ' + error,
                type: 'error',
            });
        } finally {
          setLoading(false)
        }
    };

    const handleCloseNotification = () => {
        setNotification({ message: '', description: '', type: ''});
      }

    if (loading) {
        return (
          <div className="z-40 flex items-center justify-center h-full w-full bg-gray-100">
              {notification.type && (
                  <Notification
                  message={notification.message}
                  description={notification.description}
                  type={notification.type}
                  duration={4000}
                  onClose={handleCloseNotification}
                  />
              )}
              <div className="space-x-4">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-solid border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_2s_linear_infinite]" role="status">
                      <span className="sr-only">Loading...</span>
                  </div>
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-green-500 border-solid border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_2s_linear_infinite]" role="status">
                      <span className="sr-only">Loading...</span>
                  </div>
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-solid border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_2s_linear_infinite]" role="status">
                      <span className="sr-only">Loading...</span>
                  </div>
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-yellow-500 border-solid border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_2s_linear_infinite]" role="status">
                      <span className="sr-only">Loading...</span>
                  </div>
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-solid border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_2s_linear_infinite]" role="status">
                      <span className="sr-only">Loading...</span>
                  </div>
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-solid border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_2s_linear_infinite]" role="status">
                      <span className="sr-only">Loading...</span>
                  </div>
              </div>
          </div>
      );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 bg-white shadow-md rounded-lg mt-6 mb-50 overflow-y-auto">
            {notification.type && (
                <Notification
                message={notification.message}
                description={notification.description}
                type={notification.type}
                duration={4000}
                onClose={handleCloseNotification}
                />
            )}
          <div className="space-y-6 border-b border-gray-900/10 pb-8">
            <h3 className="text-base text-lg font-semibold leading-7 text-gray-900">Simulation Setup</h3>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Use this form to configure a simulation based on data from a previously saved drone flight. Adjust parameters for better accuracy.
            </p>
          </div>
    
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Flight Selection */}
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium leading-6 text-gray-900">Select Drone Flight</label>
              <div className="mt-2 relative">
                <select
                    name="droneFlight"
                    value={formData.droneFlight.id !== null ? formData.droneFlight.id : ''} 
                    onChange={handleSelectFlight}
                    className="block w-full rounded-md border border-gray-300 p-2 shadow-sm sm:text-sm"
                >
                    <option value="" disabled>Select a flight...</option>
                    {droneFlights.length > 0 ? (
                        droneFlights.map((flight) => (
                            <option key={flight.id} value={flight.id !== null ? flight.id : ''}>
                                {flight.title} ({flight.measurements.length} points)
                            </option>
                        ))
                    ) : (
                        <option value="" disabled>No flights available</option>
                    )}
                </select>
              </div>
            </div>
    
            {/* Number of Steps */}
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium leading-6 text-gray-900">Number of Steps</label>
              <input
                type="number"
                name="numSteps"
                value={formData.numSteps = Number(formData.numSteps)}
                onChange={handleFormChange}
                min='1'
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
              />
              <p className="text-sm text-gray-600 mt-1">Define the total number of simulation steps (iterations).</p>
            </div>
    
          
            {/* Pollutants Selection */}
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium leading-6 text-gray-900">Pollutants</label>
              <div className="mt-2 space-y-2">
                {['CO', 'O3', 'SO2', 'NO2'].map((pollutant) => {
                  const isDisabled = !availablePollutants.includes(pollutant);
                  return (
                    <label
                      key={pollutant}
                      className={`flex items-center ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        name="pollutants"
                        checked={formData.pollutants.includes(pollutant)}
                        onChange={(e) => {
                          const newPollutants = e.target.checked
                            ? [...formData.pollutants, pollutant]
                            : formData.pollutants.filter((p) => p !== pollutant);
                          setFormData((prev) => ({ ...prev, pollutants: newPollutants }));
                        }}
                        disabled={isDisabled}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className={`ml-2 text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>
                        {pollutant}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="text-sm text-gray-600 mt-1">Select which pollutants to include in the simulation.</p>
            </div>

            {/* Decay rate (1/h) */}
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium leading-6 text-gray-900">Decay rate (1/h)</label>
              <input
                type="number"
                name="decayRate"
                value={formData.decayRate = Number(formData.decayRate)}
                onChange={handleFormChange}
                min="0.00"
                step="0.01"
                max="0.99"
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
              />
              <p className="text-sm text-gray-600 mt-1">Set the exponenital decay rate for decay mechanism in simulation</p>
            </div>

            {/* Emission rate (1/h) */}
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium leading-6 text-gray-900">Emission rate (1/h)</label>
              <input
                type="number"
                name="emissionRate"
                value={formData.emissionRate = Number(formData.emissionRate)}
                onChange={handleFormChange}
                min="0.00"
                step="0.01"
                max="0.99"
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
              />
              <p className="text-sm text-gray-600 mt-1">Set the exponenital emission rate for emission mechanism in simulation</p>
            </div>

    
            {/* Grid Density */}
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium leading-6 text-gray-900">Grid Density</label>
              <select
                name="gridDensity"
                value={formData.gridDensity}
                onChange={handleFormChange}
                className="block w-full rounded-md border border-gray-300 p-2 shadow-sm sm:text-sm"
              >
                <option value="sparse">Sparse</option>
                <option value="medium">Medium</option>
                <option value="dense">Dense</option>
              </select>
              <p className="text-sm text-gray-600 mt-1">Select grid density for the simulation area.</p>
            </div>
    
            {/* Urbanized */}
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium leading-6 text-gray-900">Urbanized</label>
              <div className="mt-2 flex items-center">
                <input
                  type="checkbox"
                  name="urbanized"
                  checked={formData.urbanized}
                  onChange={handleFormChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-600">Simulate in an urbanized area.</span>
              </div>
            </div>
    
            {/* Margin Boxes */}
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium leading-6 text-gray-900">Margin Boxes</label>
              <input
                type="number"
                name="marginBoxes"
                value={formData.marginBoxes = Number(formData.marginBoxes)}
                onChange={handleFormChange}
                min="0"
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
              />
              <p className="text-sm text-gray-600 mt-1">Define the number of margin boxes around the simulation area.</p>
            </div>
    
            {/* Initial Distance */}
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium leading-6 text-gray-900">Initial Distance</label>
              <input
                type="number"
                name="initialDistance"
                value={formData.initialDistance = Number(formData.initialDistance)}
                onChange={handleFormChange}
                min="0"
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
              />
              <p className="text-sm text-gray-600 mt-1">Set the initial distance between particles.</p>
            </div>

            {/* Snap interval */}
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium leading-6 text-gray-900">Snap interval</label>
              <input
                type="number"
                name="snapInterval"
                value={formData.snapInterval = Number(formData.snapInterval)}
                onChange={handleFormChange}
                min="0"
                max="100"
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
              />
              <p className="text-sm text-gray-600 mt-1">Define the frequency of simulation snap for further animation</p>
            </div>
    
            <div className='flex items-cneter justify-end '>
              <button
                type="submit"
                className="flex justify-end py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Start Simulation
              </button>
            </div>
          </form>
        </div>
      );
}

