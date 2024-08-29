import { useEffect, useState } from "react";
import { DroneMeasurementType } from "../../types/DroneMeasurementType"
import { DroneFlightFormType } from "../../types/DroneFlightFormType"
import { useNavigate, useParams } from "react-router-dom";
import { Notification } from "../../components/Notification";
import { NotificationProps } from "../../types/NotificationPropsType";
import { saveDroneFlight } from "./api/saveDroneFlight";
import { getDroneFlightById } from "./api/getDroneFlightById";
import { editDroneFlight } from "./api/editDroneFlight";


export function DroneInput() {

    const navigate = useNavigate()

    const { flightId } = useParams();

    const [isEditMode, setIsEditMode] = useState(false);

    const [notification, setNotification] = useState<NotificationProps>({
        message: "",
        description: "",
        type: "",
      });

    const [formData, setFormData] = useState<DroneFlightFormType>({
        title: '',
        description: '',
        date: undefined,
        measurements: []
    })

    const [currentMeasurement, setCurrentMeasurement] = useState<DroneMeasurementType>({
        name: '',
        latitude: null,
        longitude: null,
        temperature: null,
    });

    useEffect(() => {
        if (flightId) {
            setIsEditMode(true);
            const fetchFlightData = async () => {
                try {
                    const flight = await getDroneFlightById(Number(flightId));
                    const flightData = {
                        ...flight,
                        date: flight.date ? new Date(flight.date) : undefined
                    }
                    setFormData(flightData);
                } catch (error) {
                    setNotification({
                        message: 'Error',
                        description: 'Failed to fetch flight data: ' + error,
                        type: 'error'
                    });
                }
            };
            fetchFlightData();
        }
    }, [flightId]);


    const handleCurrentMeasurementChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target
        setCurrentMeasurement((prevMeasurement) => ({
            ...prevMeasurement,
            [name]: value
        }))
    }

    const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = event.target
        setFormData((prevForm) => ({
            ...prevForm,
            [name]: name === 'date' ? new Date(value) : value
        }))
    }

    const addMeasurement = () => {

        if(
            currentMeasurement.name.trim() !== '' &&
            currentMeasurement.latitude !== null &&
            !isNaN(currentMeasurement.latitude) &&
            currentMeasurement.longitude !== null &&
            !isNaN(currentMeasurement.longitude) &&
            currentMeasurement.temperature !== null &&
            !isNaN(currentMeasurement.temperature)
        ){
            setFormData((prevForm) => ({
                ...prevForm,
                measurements: [...prevForm.measurements, currentMeasurement]
            }))
            setCurrentMeasurement({
                name: '',
                latitude: null,
                longitude: null,
                temperature: null,
            })
        } else {
            setNotification({
                message: 'Incomplete Measurement',
                description: 'Please fill out all fields: name, latitude, longitude, and temperature must be provided and have correct types.',
                type: 'error',
            });
        }

    }

    const removeMeasurement = (index: number) => {
        setFormData((prevForm) => ({
            ...prevForm,
            measurements: prevForm.measurements.filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (!formData.title.trim()) {
            setNotification({ message: 'Validation Error', description: 'Title is required.', type: 'error'
            });
            return;
        }
    
        if (!formData.date) {
            setNotification({ message: 'Validation Error', description: 'Date is required.', type: 'error'
            });
            return;
        }
    
        if (formData.measurements.length === 0) {
            setNotification({ message: 'Validation Error', description: 'At least one measurement is required.', type: 'error'
            });
            return;
        }

        
        /**
         * If we edit data, there is userId and id for flight existing in the formulae,
         * so we need to delete that info from form data, and pass userID (with credentials in token)
         * and flightId as separete parameter
         */
        const preparedEditData: DroneFlightFormType = {
            title: formData.title,
            description: formData.description,
            date: new Date(formData.date), 
            measurements: formData.measurements.map(measurement => ({
                name: measurement.name,
                latitude: measurement.latitude,
                longitude: measurement.longitude,
                temperature: measurement.temperature,
            })),
        };
        
        
        try {
            if (isEditMode && flightId) {
                await editDroneFlight(preparedEditData, Number(flightId));
                setNotification({
                    message: 'Data updated successfully!',
                    description: 'Your drone measurements have been updated.',
                    type: 'success'
                });
                setFormData({title: '', description: '', date: undefined, measurements: []})

            } else {
                await saveDroneFlight(formData)
                setNotification({
                    message: 'Data saved successfully!',
                    description: 'Your drone measurements have been saved.',
                    type: 'success'
                })
                setFormData({title: '', description: '', date: undefined, measurements: []})
            }
        } catch (error) {
            setNotification({
                message: 'Error',
                description: 'Failed to save data: ' + error,
                type: 'error'
            })
        }
    }

    const handleCloseNotification = () => {
        setNotification({ message: '', description: '', type: ''});
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
            <h3 className="text-base text-lg font-semibold leading-7 text-gray-900 ">Drone Flight Feature</h3>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              This feature enables you to create a custom drone flight map with provided data gathered during your flight.
              If you want to preserve your data, log in to your account.
            </p>
          </div>
    
          <form onSubmit={handleSubmit} method="POST" className="space-y-6">
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label className="block text-sm font-medium leading-6 text-gray-900">Flight Title</label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                  <input 
                    type="text" 
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="Enter flight title"
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6" 
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-4">
                <label className="block text-sm font-medium leading-6 text-gray-900">Flight Date</label>
                <div className="mt-2">
                    <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                    <input 
                        type="date" 
                        name="date"
                        value={formData.date instanceof Date && !isNaN(formData.date.getTime()) ? formData.date.toISOString().substring(0,10) : ''}
                        onChange={handleFormChange}
                        className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:date-gray-400 focus:ring-0 sm:text-sm sm:leading-6" 
                    />
                    </div>
                </div>
            </div>
    
            <div className="col-span-full">
              <label className="block text-sm font-medium leading-6 text-gray-900">Description</label>
              <div className="mt-2">
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Enter flight description"
                    className="block w-full rounded-md border-0 py-1.5 pl-1 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
    
            <div className="col-span-full">
                <h3 className="text-lg font-semibold text-gray-800">Measurement Points</h3>
                <div className="mt-2 max-h-56 overflow-y-auto">
                    <div className="grid grid-cols-4 p-2 bg-gray-100 rounded-md shadow-sm">
                        <div className="text-sm font-semibold text-center mr-4 text-gray-700">Name</div>
                        <div className="text-sm font-semibold text-center mr-6 text-gray-700">Latitude</div>
                        <div className="text-sm font-semibold text-center mr-8 text-gray-700">Longitude</div>
                        <div className="text-sm font-semibold text-center mr-10 text-gray-700">Temperature</div>
                    </div>

                    {formData.measurements.map((measurement, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-4 p-2 bg-white border-gray-300 shadow-sm relative"
                    >
                        <div>
                        <input
                            type="text"
                            value={measurement.name}
                            readOnly
                            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                        />
                        </div>
                        <div>
                        <input
                            type="text"
                            value={measurement.latitude ?? ''}
                            readOnly
                            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                        />
                        </div>
                        <div>
                        <input
                            type="text"
                            value={measurement.longitude ?? ''}
                            readOnly
                            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                        />
                        </div>
                        <div>
                        <input
                            type="text"
                            value={measurement.temperature ?? ''}
                            readOnly
                            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                        />
                        </div>
                        <div className="flex justify-center items-center">
                            <button
                                type="button"
                                onClick={() => removeMeasurement(index)}
                                className="text-red-500 hover:text-red-700"
                            >
                                &#x2715;
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
            </div>

    
            <div className="col-span-full grid grid-cols-4 gap-4">
                <div className="sm:col-span-1">
                    <label className="block text-sm font-medium leading-6 text-gray-900">Name</label>
                    <div className="mt-2">
                    <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                        <input
                        type="text"
                        name="name"
                        value={currentMeasurement.name}
                        onChange={handleCurrentMeasurementChange}
                        placeholder="Point name"
                        className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                        />
                    </div>
                    </div>
                </div>
                
                <div className="sm:col-span-1">
                    <label className="block text-sm font-medium leading-6 text-gray-900">Latitude</label>
                    <div className="mt-2">
                    <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                        <input
                        type="text"
                        name="latitude"
                        value={currentMeasurement.latitude ?? ''}
                        onChange={handleCurrentMeasurementChange}
                        placeholder="Latitude"
                        className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                        />
                    </div>
                    </div>
                </div>

                <div className="sm:col-span-1">
                    <label className="block text-sm font-medium leading-6 text-gray-900">Longitude</label>
                    <div className="mt-2">
                    <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                        <input
                        type="text"
                        name="longitude"
                        value={currentMeasurement.longitude ?? ''}
                        onChange={handleCurrentMeasurementChange}
                        placeholder="Longitude"
                        className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                        />
                    </div>
                    </div>
                </div>

                <div className="sm:col-span-1">
                    <label className="block text-sm font-medium leading-6 text-gray-900">Temperature</label>
                    <div className="mt-2">
                    <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 sm:max-w-md">
                        <input
                        type="text"
                        name="temperature"
                        value={currentMeasurement.temperature ?? ''}
                        onChange={handleCurrentMeasurementChange}
                        placeholder="Temperature"
                        className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                        />
                    </div>
                    </div>
                </div>
            </div>

            <div className="col-span-full justify-self-end">
                <button 
                        type="button"
                        onClick={addMeasurement}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Add measurement
                </button>
            </div>


            <div className="col-span-full space-y-6 border-t border-gray-900/10 pt-8">
                <div className="flex items-center justify-end gap-x-6">
                    <button 
                        type="button"
                        onClick={() => {
                            if (isEditMode) {
                              navigate('/data-overview');
                            } else {
                              setFormData({ title: '', description: '', measurements: [] });
                            }
                          }}
                        className="text-sm font-semibold leading-6 text-gray-900"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        {isEditMode ? 'Save Edit' : 'Save'}
                    </button>
                </div>
            </div>
            </div>
          </form>
        </div>
      );
}