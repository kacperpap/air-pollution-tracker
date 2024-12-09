import React, { useEffect, useState } from 'react';
import pako from 'pako';
import {
    DocumentIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    TrashIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    StopIcon
} from '@heroicons/react/24/outline';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Notification } from "../../components/Notification";
import { NotificationProps } from '../../types/NotificationPropsType';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getAllSimulations } from './api/getAllSimulations';
import { deleteSimulation } from './api/deleteSimulation';
import { getAllDroneFlights } from '../overview/api/getAllDroneFlights';
import { SimulationType } from '../../types/SimulationType';
import { SimulationStatus } from '../../types/SimulationStatusType';
import { DroneFlightType } from '../../types/DroneFlightType';
import { SimulationLightType } from '../../types/SimulationLightType';
import { getAllSimulationsLight } from './api/getAllSimulationsLight';
import { getSimulationById } from './api/getSimulationById';

interface SimulationSortConfig {
    createdAt: 'asc' | 'desc';
    updatedAt: 'asc' | 'desc';
}

export function SimulationOverview() {
    const navigate = useNavigate();
    const location = useLocation();
    const { simulationId } = useParams<{ simulationId?: string }>();

    const [simulations, setSimulations] = useState<SimulationLightType[]>([]);
    const [droneFlights, setDroneFlights] = useState<DroneFlightType[]>([]);
    const [loadingSimulations, setLoadingSimulations] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<NotificationProps>({ message: "", description: "", type: "" });
    const [openDialog, setOpenDialog] = useState<number | null>(null);
    const [expandedSimulation, setExpandedSimulation] = useState<number | null>(null);
    const [sortConfig, setSortConfig] = useState<SimulationSortConfig>({
        createdAt: 'desc',
        updatedAt: 'desc'
    });
    const [currentSortColumn, setCurrentSortColumn] = useState<'createdAt' | 'updatedAt'>('createdAt');


    useEffect(() => {
        const fetchData = async () => {
            try {
                const [fetchedLightSimulations, fetchedDroneFlights] = await Promise.all([
                    getAllSimulationsLight(),
                    getAllDroneFlights()
                ]);

                const droneFlightsMap = new Map<number, DroneFlightType>(
                    fetchedDroneFlights.map((flight: DroneFlightType) => [flight.id!, flight])
                );

                const enrichedSimulations: SimulationLightType[] = fetchedLightSimulations.map((simulation: SimulationLightType) => ({
                    ...simulation,
                    droneFlight: simulation.droneFlightId
                        ? { title: droneFlightsMap.get(simulation.droneFlightId)?.title || 'Unknown Flight' }
                        : undefined
                }));

                const sortedSimulations = [...enrichedSimulations].sort((a, b) => {
                    const dateA = new Date(a[currentSortColumn]).getTime();
                    const dateB = new Date(b[currentSortColumn]).getTime();
                    return sortConfig[currentSortColumn] === 'asc' ? dateA - dateB : dateB - dateA;
                });

                setSimulations(sortedSimulations);
                setDroneFlights(fetchedDroneFlights);
                setError(null);

                if (simulationId) {

                    const isFromRedirect = sessionStorage.getItem('isFromSimulationCreation');

                    if(isFromRedirect === "true"){
                        setNotification({
                            message: 'Data sent to simulation successfully!',
                            description: 'Your drone measurements are being processed to simulate pollution spread.',
                            type: 'success',
                            duration: 5000
                        });

                        sessionStorage.setItem('isFromSimulationCreation', 'false')
                    }
          
                    const simulationIdNumber = parseInt(simulationId, 10);
                    const foundSimulation = sortedSimulations.find(sim => sim.id === simulationIdNumber);
                    
                    if (foundSimulation) {
                        setExpandedSimulation(simulationIdNumber);
                    }
                }

            } catch (error) {
                setError('Failed to fetch simulations or drone flights');
                setSimulations([]);
                setDroneFlights([]);
            } finally {
                setLoadingSimulations(false);
            }
        };

        fetchData();
    }, []);

    const toggleExpand = (simulationId: number | null) => {
        setExpandedSimulation(expandedSimulation === simulationId ? null : simulationId);
    };

    const openDeleteDialog = (simulationId: number | null) => {
        setOpenDialog(simulationId);
    };

    const closeDeleteDialog = () => {
        setOpenDialog(null);
    };

    const handleDeleteSimulation = async (simulationId: number | null) => {
        if (simulationId !== null) {
            try {
                await deleteSimulation(simulationId);

                setSimulations((prevSimulations) =>
                    prevSimulations.filter(simulation => simulation.id !== simulationId)
                );

                setNotification({
                    message: 'Simulation deleted!',
                    description: 'Your simulation has been successfully deleted.',
                    type: 'success'
                });
            } catch (error) {
                setNotification({
                    message: 'Error',
                    description: 'Failed to delete simulation: ' + error,
                    type: 'error'
                });
            }
            closeDeleteDialog();
        }
    };

    const handleCloseNotification = () => {
        setNotification({ message: '', description: '', type: '' });
    };

    const renderStatusBadge = (status: SimulationStatus) => {
        const statusConfig = {
            pending: {
                icon: <ClockIcon className="h-5 w-5 text-yellow-500" />,
                text: 'text-yellow-800',
                bg: 'bg-yellow-100'
            },
            completed: {
                icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
                text: 'text-green-800',
                bg: 'bg-green-100'
            },
            failed: {
                icon: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />,
                text: 'text-red-800',
                bg: 'bg-red-100'
            },
            timeExceeded: {
                icon: <StopIcon className="h-5 w-5 text-orange-500" />,
                text: 'text-orange-800',
                bg: 'bg-orange-100'
            }
        };

        const { icon, text, bg } = statusConfig[status];
        return (
            <span className={`inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium ${text} ${bg}`}>
                {icon}
                {status}
            </span>
        );
    };


    const toggleSortOrder = (column: 'createdAt' | 'updatedAt') => {
        setSortConfig(prevConfig => {
            const newConfig = { ...prevConfig };
            newConfig[column] = newConfig[column] === 'asc' ? 'desc' : 'asc';
            
            setCurrentSortColumn(column);
    
            const sortedSimulations = [...simulations].sort((a, b) => {
                const dateA = new Date(a[column]).getTime();
                const dateB = new Date(b[column]).getTime();
                return newConfig[column] === 'asc' ? dateA - dateB : dateB - dateA;
            });
    
            setSimulations(sortedSimulations);
    
            return newConfig;
        });
    };


    const handleDownloadResult = async (simulationId: number) => {
        try {
            const simulation = await getSimulationById(simulationId)
    
            if (simulation.result) {

                const uint8Array = new Uint8Array(simulation.result.data);
                
                const decompressedResult = pako.ungzip(
                    uint8Array,
                    { to: 'string' }
                );
    
                const parsedResult = JSON.parse(decompressedResult);
    
                const blob = new Blob([JSON.stringify(parsedResult, null, 2)], { type: 'application/json' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `simulation_result_${simulationId}.json`;
                document.body.appendChild(link); 
                link.click();
                document.body.removeChild(link);
            } else {
                setNotification({
                    message: 'Error',
                    description: `Simulation with ID ${simulationId} does not contain a result.`,
                    type: 'error'
                });
            }
        } catch (error) {
            setNotification({
                message: 'Error',
                description: 'Failed to download or process result: ' + error,
                type: 'error'
            });
        }
    };

    const handleRunSimulationOnMap = async (simulationId: number) => {
    
        try {
            navigate(`/map/run-simulation/${simulationId}`)
        } catch (error) {
            setNotification({
                message: 'Error',
                description: 'Failed to show simulation on map: ' + error,
                type: 'error'
            });
        }
    }

    if (loadingSimulations) {
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
        <>
            {notification.type && (
                <Notification
                    message={notification.message}
                    description={notification.description}
                    type={notification.type}
                    duration={4000}
                    onClose={handleCloseNotification}
                />
            )}

            {!simulations.length ? (
                <div className="flex items-center justify-center h-full w-full bg-gray-100">
                    <div className="text-center p-4">
                        <h1 className="text-xl font-bold text-gray-800">Empty</h1>
                        <p className="mt-2 font-semibold text-gray-600">There is no simulation saved</p>
                    </div>
                </div>
            ) : (
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
                    <div className="flex justify-end space-x-2 mb-4">
                        <button
                            onClick={() => toggleSortOrder('createdAt')}
                            className={`px-3 py-2 rounded-md text-sm flex items-center 
                                ${currentSortColumn === 'createdAt'
                                    ? 'bg-blue-50 border-2 border-blue-200 font-semibold text-blue-600'
                                    : 'bg-gray-100 hover:bg-gray-200 border-2 border-transparent'}`}
                        >
                            Created At
                            {currentSortColumn === 'createdAt' 
                                ? (sortConfig.createdAt === 'asc' ? ' ▲' : ' ▼') 
                                : ''}
                        </button>
                        <button
                            onClick={() => toggleSortOrder('updatedAt')}
                            className={`px-3 py-2 rounded-md text-sm flex items-center 
                                ${currentSortColumn === 'updatedAt'
                                    ? 'bg-blue-50 border-2 border-blue-200 font-semibold text-blue-600'
                                    : 'bg-gray-100 hover:bg-gray-200 border-2 border-transparent'}`}
                        >
                            Updated At
                            {currentSortColumn === 'updatedAt' 
                                ? (sortConfig.updatedAt === 'asc' ? ' ▲' : ' ▼') 
                                : ''}
                        </button>
                    </div>

                    <ul role="list" className="divide-y divide-gray-100">
                        {simulations.map((simulation) => (
                            <li key={simulation.id} className="flex flex-col gap-y-4 py-5">
                                <div className="flex justify-between items-center gap-x-6">
                                    <div className="flex items-center gap-x-4">
                                        <div className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-gray-50 hover:bg-white">
                                            <DocumentIcon className="h-6 w-6 text-gray-600 hover:text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold leading-6 text-gray-900">
                                                Simulation #{simulation.id}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {simulation.droneFlight?.title || 'No associated drone flight'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-x-4">
                                        {renderStatusBadge(simulation.status)}
                                        <p className="text-sm leading-6 text-gray-900">
                                            Created: {new Date(simulation.createdAt).toLocaleString('pl-PL', {
                                                day: '2-digit', 
                                                month: '2-digit', 
                                                year: 'numeric', 
                                                hour: '2-digit', 
                                                minute: '2-digit', 
                                                second: '2-digit',
                                                hour12: false
                                            })}
                                        </p>
                                        <p className="text-sm leading-6 text-gray-900">
                                            Updated: {new Date(simulation.updatedAt).toLocaleString('pl-PL', {
                                                day: '2-digit', 
                                                month: '2-digit', 
                                                year: 'numeric', 
                                                hour: '2-digit', 
                                                minute: '2-digit', 
                                                second: '2-digit',
                                                hour12: false
                                            })}
                                        </p>
                                        <button
                                            onClick={() => toggleExpand(simulation.id)}
                                            className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900"
                                        >
                                            {expandedSimulation === simulation.id ? 'Collapse' : 'Expand'}
                                            {expandedSimulation === simulation.id ? (
                                                <ChevronUpIcon aria-hidden="true" className="h-5 w-5 flex-none text-gray-400" />
                                            ) : (
                                                <ChevronDownIcon aria-hidden="true" className="h-5 w-5 flex-none text-gray-400" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => openDeleteDialog(simulation.id)}
                                            className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-gray-50 hover:bg-white hover:text-red-500"
                                        >
                                            <TrashIcon aria-hidden="true" className="h-6 w-6 text-gray-600 hover:text-red-500" />
                                        </button>
                                    </div>
                                </div>

                                {expandedSimulation === simulation.id && (
                                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Simulation Parameters</h3>
                                            <div className="bg-white p-3 rounded-md border border-gray-200 max-h-64 overflow-y-auto">
                                                <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                                                    {JSON.stringify(simulation.parameters, null, 2)}
                                                </pre>
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Simulation Result</h3>
                                            <div className="bg-white p-3 rounded-md border border-gray-200">
                                            {simulation.status === "completed" ? (
                                                <div className='flex items-center justify-between'>
                                                    <p className="text-sm font-semibold text-green-600">
                                                        Result available
                                                    </p>
                                                    <button
                                                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                                                        onClick={() => handleDownloadResult(simulation.id)}
                                                    >
                                                        Download Result
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500">
                                                    No result available for this simulation
                                                </p>
                                            )}
                                            </div>
                                        </div>

                                        {simulation.status === "completed" && (
                                            <div className="mt-4 flex justify-end gap-6">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRunSimulationOnMap(simulation.id)}
                                                    className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                                >
                                                    Show simulation on map
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {openDialog === simulation.id && (
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
                                                                    Delete Simulation
                                                                </DialogTitle>
                                                                <div className="mt-2">
                                                                    <p className="text-sm text-gray-500">
                                                                        Are you sure you want to delete this simulation? This action cannot be undone.
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteSimulation(simulation.id)}
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
            )}
        </>
    );
}