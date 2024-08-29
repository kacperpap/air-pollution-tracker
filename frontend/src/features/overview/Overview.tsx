import { useEffect, useState } from 'react';
import { DocumentIcon, ChevronDownIcon, ChevronUpIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { deleteDroneFlight } from './api/deleteDroneFlight';
import { Notification } from "../../components/Notification";
import { NotificationProps } from '../../types/NotificationPropsType';
import { useNavigate } from 'react-router-dom';
import { getAllDroneFlights } from './api/getAllDroneFlights';
import { DroneFlightType } from '../../types/DroneFlightType';

export function Overview() {
    const navigate = useNavigate()

    const [droneFlights, setDroneFlights] = useState<DroneFlightType[]>([]);
    const [loadingDroneFlights, setLoadingDroneFlights] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<NotificationProps>({message: "",description: "",type: ""});
    const [openDialog, setOpenDialog] = useState<number | null>(null);
    const [expandedFlight, setExpandedFlight] = useState<number | null>(null);

    useEffect(() => {
      const fetchData = async () => {
          try {
              const flights = await getAllDroneFlights();
              setDroneFlights(flights);
              setError(null);
          } catch (error) {
              setError('Failed to fetch data');
              setDroneFlights([]);
          } finally {
              setLoadingDroneFlights(false);
          }
      };
  
      fetchData();
    }, []);

    const toggleExpand = (flightId: number | null) => {
        setExpandedFlight(expandedFlight === flightId ? null : flightId);
    };

    const openDeleteDialog = (flightId: number) => {
        setOpenDialog(flightId);
    };

    const closeDeleteDialog = () => {
        setOpenDialog(null);
    };

    const editDroneInput = (flightId: number) => {
        navigate(`/drone-input/${flightId}`)
    }

    const handleDeleteFlight = async (flightId: number) => {
      try {
        await deleteDroneFlight(flightId)
        
        setDroneFlights((prevFlights) => prevFlights.filter(flight => flight.id !== flightId));

        setNotification({
          message: 'Drone flight deleted!',
          description: 'Your drone flight has been deleted.',
          type: 'success'
        })
        navigate('/data-overview')
      } catch (error) {
        setNotification({
          message: 'Error',
          description: 'Failed to delete data: ' + error,
          type: 'error'
        })
      }
      closeDeleteDialog();
    };

    const handleCloseNotification = () => {
      setNotification({ message: '', description: '', type: ''});
    }


    if (loadingDroneFlights) {
      return (
        <div className="flex items-center justify-center h-full w-full bg-gray-100">
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

    if (error) {
      return (
          <div className="flex items-center justify-center h-full w-full bg-gray-100">
              <div className="text-center p-4">
                  <h1 className="text-xl font-bold text-gray-800">Error</h1>
                  <p className="mt-2 font-semibold text-gray-600">{error}</p>
              </div>
          </div>
      );
    }

    return (
      <div className="max-w-[96rem] mx-auto p-6 bg-white shadow-md rounded-lg mt-6 mb-50 overflow-y-auto">
        {notification.type && (
            <Notification
              message={notification.message}
              description={notification.description}
              type={notification.type}
              duration={4000}
              onClose={handleCloseNotification}
            />
          )}
        <ul role="list" className="divide-y divide-gray-100">
          {droneFlights.map((droneFlight) => (
            <li key={droneFlight.id} className="flex flex-col gap-y-4 py-5">
              <div className="flex justify-between items-center gap-x-6">
                <div className="flex items-center gap-x-4">
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-gray-50 hover:bg-white">
                    <DocumentIcon className="h-6 w-6 text-gray-600 hover:text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold leading-6 text-gray-900">{droneFlight.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-x-4">
                  <p className="text-sm leading-6 text-gray-900">
                  Flight date: {droneFlight.date ? new Date(droneFlight.date).toISOString().substring(0,10) : 'Date not available'}
                  </p>
                  <p className="text-sm leading-6 text-gray-900">
                    {droneFlight.measurements.length} {droneFlight.measurements.length === 1 ? 'measurement' : 'measurements'}
                  </p>
                  <button onClick={() => toggleExpand(droneFlight.id)} className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900">
                    {expandedFlight === droneFlight.id ? 'Collapse' : 'Expand'}
                    {expandedFlight === droneFlight.id ? (
                      <ChevronUpIcon aria-hidden="true" className="h-5 w-5 flex-none text-gray-400" />
                    ) : (
                      <ChevronDownIcon aria-hidden="true" className="h-5 w-5 flex-none text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => openDeleteDialog(droneFlight.id)}
                    className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-gray-50 hover:bg-white hover:text-red-500"
                  >
                    <TrashIcon aria-hidden="true" className="h-6 w-6 text-gray-600 hover:text-red-500" />
                  </button>
                </div>
              </div>
              {expandedFlight === droneFlight.id && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Flight description</h3>
                  <p className="mt-3 text-sm leading-5 text-gray-800">{droneFlight.description}</p>
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-800">Measurement Points</h3>
                    <div className="mt-2 max-h-56 overflow-y-auto bg-gray-100 rounded-md shadow-sm p-4">
                      <div className="grid grid-cols-4 gap-4 text-sm font-semibold text-center text-gray-700">
                        <div>Name</div>
                        <div>Latitude</div>
                        <div>Longitude</div>
                        <div>Temperature</div>
                      </div>
                      {droneFlight.measurements.map((measurement, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-4 gap-4 p-2 bg-white border border-gray-300 shadow-sm rounded-md mt-2"
                        >
                          <div className="text-center">{measurement.name}</div>
                          <div className="text-center">{measurement.latitude}</div>
                          <div className="text-center">{measurement.longitude}</div>
                          <div className="text-center">{measurement.temperature}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end gap-6">
                      <button
                        type="button"
                        className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        Show on map
                      </button>
                      <button
                        type="button"
                        onClick={() => editDroneInput(expandedFlight)}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        Edit measurement
                      </button>
                    </div>
                  </div>
                </div>
              )}
  
              {openDialog === droneFlight.id && (
                <Dialog open={true} onClose={closeDeleteDialog} className="relative z-10">
                  <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                  />
                  <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                      <DialogPanel
                        transition
                        className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
                      >
                        <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                          <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                              <ExclamationTriangleIcon aria-hidden="true" className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                              <DialogTitle as="h3" className="text-base font-semibold leading-6 text-gray-900">
                                Delete Flight
                              </DialogTitle>
                              <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                  Are you sure you want to delete this flight? This action cannot be undone.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                          <button
                            type="button"
                            onClick={() => handleDeleteFlight(droneFlight.id)}
                            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={closeDeleteDialog}
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          >
                            Cancel
                          </button>
                        </div>
                      </DialogPanel>
                    </div>
                  </div>
                </Dialog>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
}