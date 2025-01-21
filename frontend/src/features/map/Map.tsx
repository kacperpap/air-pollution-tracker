import { useCallback, useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation, useParams } from 'react-router-dom';
import { NotificationProps } from '../../types/NotificationPropsType';
import { Notification } from "../../components/Notification";
import { loadFlightData } from './loadFlightData';
import { DroneMeasurementType } from '../../types/DroneMeasurementType';

export interface FlightMap {
  map: L.Map | null;
  flightData: DroneMeasurementType[];
  markers: L.Marker[];
}


export default function Map() {
  const { flightId } = useParams();
  const location = useLocation();

  const [state, setState] = useState<FlightMap>({
    map: null,
    flightData: [],
    markers: [],
  });

  const [notification, setNotification] = useState<NotificationProps>({
    message: "",
    description: "",
    type: "",
  });

  const updateState = useCallback((newState: Partial<FlightMap>) => {
    setState((prevState: any) => ({ ...prevState, ...newState }));
  }, []);


  useEffect(() => {
    const newMap = L.map('map', {
      zoomAnimation: true,
      markerZoomAnimation: true,
      minZoom: 6,
    }).setView([50.0534, 20.0037], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(newMap);

    updateState({ map: newMap });

    return () => {
      newMap.off();
      newMap.remove();
    };
  }, [updateState]);


  useEffect(() => {
    if (flightId && state.map && location.pathname === `/map/${flightId}`) {
      loadFlightData(Number(flightId), state.map, setNotification, updateState);
    }
  }, [flightId, location.pathname, state.map, updateState]);


  const handleCloseNotification = () => {
    setNotification({ message: '', description: '', type: '' });
  };

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

      <div id="map" className='absolute inset-0 w-full h-full relative z-10'></div>
    </>
  );
}
