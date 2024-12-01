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

    const [formData, setFormData] = useState<SimulationRequestType>({
        droneFlight: {
            id: null,
            title: '',
            description: '',
            date: undefined,
            measurements: [],
        },
        numSteps: 1000,
        dt: 1,
        pollutants: [],
        boxSize: [null, null],
        gridDensity: '',
        urbanized: false,
        marginBoxes: 1,
        initialDistance: 1,
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
    
        if (formData.dt <= 0) {
            setNotification({
                message: 'Error',
                description: 'Time step (dt) must be a positive value.',
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
    
        if (formData.boxSize[0] !== null && formData.boxSize[0] < 0) {
            setNotification({
                message: 'Error',
                description: 'Box width cannot be a negative value.',
                type: 'error',
            });
            return;
        }
    
        if (formData.boxSize[1] !== null && formData.boxSize[1] < 0) {
            setNotification({
                message: 'Error',
                description: 'Box height cannot be a negative value.',
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
                dt: 1,
                pollutants: [],
                boxSize: [null, null],
                gridDensity: '',
                urbanized: false,
                marginBoxes: 1,
                initialDistance: 1,
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
    
            {/* Time Step (dt) */}
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium leading-6 text-gray-900">Time Step (dt)</label>
              <input
                type="number"
                name="dt"
                value={formData.dt = Number(formData.dt)}
                onChange={handleFormChange}
                min="0.1"
                step="0.1"
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
              />
              <p className="text-sm text-gray-600 mt-1">Set the time step for each simulation iteration.</p>
            </div>
    
            {/* Pollutants Selection */}
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium leading-6 text-gray-900">Pollutants</label>
              <div className="mt-2 space-y-2">
                {['CO', 'O3', 'SO2', 'NO2'].map((pollutant) => (
                  <label key={pollutant} className="flex items-center">
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
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">{pollutant}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-1">Select which pollutants to include in the simulation.</p>
            </div>
    
            {/* Box Size */}
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium leading-6 text-gray-900">Box Size*</label>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Width"
                  value={Number(formData.boxSize[0]) || ''}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    box_size: [parseFloat(e.target.value) || null, prev.boxSize[1]],
                  }))}
                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Height"
                  value={Number(formData.boxSize[1]) || ''}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    box_size: [prev.boxSize[0], parseFloat(e.target.value) || null],
                  }))}
                  className="block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                />
              </div>
              <p className="text-sm text-gray-600 mt-1">Specify the size of the simulation box (Width, Height). Do not specify if you want to run simulation with sizes calculated from other parameters such as grid density</p>
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
                <option value="spare">Spare</option>
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

