import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation, useParams } from 'react-router-dom';
import { NotificationProps } from '../../types/NotificationPropsType';
import { Notification } from "../../components/Notification";
import { ParameterSelector } from './ParameterSelector'
import { updateRectangleColors } from './utils'
import { loadFlightData } from './loadFlightData';
import { drawWindArrows, visualiseSimulation } from './visualiseSimulation';
import { Legend } from './Legend';


export default function Map() {
  const { flightId } = useParams();
  const location = useLocation();
  const [selectedParameter, setSelectedParameter] = useState<string>('');
  const [availableParameters, setAvailableParameters] = useState<string[]>([]);
  const [rectangles, setRectangles] = useState<L.Rectangle[]>([]);
  const [windArrows, setWindArrows] = useState<L.Polyline[]>([]);
  const [map, setMap] = useState<L.Map | null>(null);
  const [simulationData, setSimulationData] = useState<any>(null);

  useEffect(() => {
    if (simulationData?.pollutants?.final_step) {
      const initialParameter = Object.keys(simulationData.pollutants.final_step)[0];
      setSelectedParameter(initialParameter);
    }
  }, [simulationData]);

  const handleParameterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value;
    setSelectedParameter(selected);
  
    if (selected === 'wind') {
      const windData = {
        direction: simulationData.environment.windDirection,
        speed: simulationData.environment.windSpeed,
      };
      if (map !== null && simulationData) {
        rectangles.forEach(rect => {
          rect.setStyle({ opacity: 0, fillOpacity: 0 });
        });
        
        if (windArrows.length > 0) {
          windArrows.forEach(arrow => {
            arrow.setStyle({ opacity: 1 });
          });
        } else {
          drawWindArrows(simulationData.grid, map, windData, selectedParameter === 'wind');
        }
      }
    } else {
      windArrows.forEach(arrow => {
        arrow.setStyle({ opacity: 0 });
      });
  
      rectangles.forEach(rect => {
        rect.setStyle({ opacity: 1, fillOpacity: 0.5 });
      });
  
      if (simulationData) {
        const data = simulationData.pollutants.final_step[selected] || simulationData.environment[selected];
        if (data) {
          updateRectangleColors(simulationData, selected, rectangles);
        }
      }
    }
  };

  const [notification, setNotification] = useState<NotificationProps>({
    message: "",
    description: "",
    type: "",
  });

  useEffect(() => {
    const newMap = L.map('map', {
      zoomAnimation: true,
      markerZoomAnimation: true,
    }).setView([50.0534, 20.0037], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(newMap);

    setMap(newMap);

    return () => {
      newMap.off();
      newMap.remove();
    };
  }, []);

  useEffect(() => {
    if (location.pathname === '/map/run-simulation') {
      setSimulationData(location.state.simulationData);

      if (map !== null) {
        const initialParameter = selectedParameter ||
          (location.state.simulationData.pollutants.final_step &&
            Object.keys(location.state.simulationData.pollutants.final_step)[0]);

        visualiseSimulation(
          location.state.simulationData,
          map,
          initialParameter,
          setAvailableParameters,
          setRectangles,
          setWindArrows,
          setNotification
        );
      }
    } else if (flightId && map && location.pathname === `/map/${flightId}`) {
      loadFlightData(Number(flightId), map, setNotification);
    }
  }, [flightId, location.pathname, location.state, map]);


  const handleCloseNotification = () => {
    setNotification({ message: '', description: '', type: '' });
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

      <div id="map" className='absolute inset-0 w-full h-full relative z-10'></div>

      {location.pathname === '/map/run-simulation' && selectedParameter && (
        <>
          <Legend
            parameter={selectedParameter}
          />
          <ParameterSelector
            parameters={availableParameters}
            selectedParameter={selectedParameter}
            onChange={handleParameterChange}
          />
        </>
      )}
    </>
  );
}
