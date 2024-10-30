import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation, useParams } from 'react-router-dom';
import { NotificationProps } from '../../types/NotificationPropsType';
import { Notification } from "../../components/Notification";
import { ParameterSelector } from './ParameterSelector'
import { generateTooltipContent, updateRectangleColors } from './utils'
import { loadFlightData } from './loadFlightData';
import { drawWindArrows, visualiseSimulation } from './visualiseSimulation';
import { Legend } from './Legend';
import { DroneMeasurementType } from '../../types/DroneMeasurementType';
import { EnvironmentType, PollutantDataType, PollutantsType, SimulationResponseType } from '../../types/SimulationResponseType';
import { PollutantParameter } from './MapTypes';


export default function Map() {
  const { flightId } = useParams();
  const location = useLocation();
  const [selectedParameter, setSelectedParameter] = useState<string>('');
  const [availableParameters, setAvailableParameters] = useState<string[]>([]);
  const [rectangles, setRectangles] = useState<L.Rectangle[]>([]);
  const [windArrows, setWindArrows] = useState<L.Polyline[]>([]);
  const [map, setMap] = useState<L.Map | null>(null);
  const [simulationData, setSimulationData] = useState<SimulationResponseType>();
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const [flightData, setFlightData] = useState<DroneMeasurementType[]>([]);


  useEffect(() => {
    if (simulationData?.pollutants?.final_step) {
      const validParams = Object.keys(simulationData.pollutants.final_step).filter(param => simulationData.pollutants.final_step[param as keyof PollutantDataType].length > 0);
      const initialParameter = validParams.length > 0 ? validParams[0] : '';
      setSelectedParameter(initialParameter);
    }
  }, [simulationData]);


  const updateMarkerTooltips = (parameter: string) => {
    if (!markers || markers.length === 0) return;
    markers.forEach((marker, index) => {
      const point = flightData[index];
      if (!point) return;

      let tooltipContent = `<strong>Measurement:</strong> ${point.name}`;

      tooltipContent += generateTooltipContent(parameter, point);
      marker.getTooltip()?.setContent(tooltipContent);
    });
  };

  const updateRectangleTooltips = (parameter: string) => {
    if (!rectangles || rectangles.length === 0) return;

    rectangles.forEach((rectangle, index) => {

      if (simulationData) {
        const pollutantValues = simulationData.pollutants[parameter as keyof PollutantsType] ||
          simulationData.environment[parameter as keyof typeof simulationData.environment];

        if (Array.isArray(pollutantValues)) {
          const point = pollutantValues[index] || null;

          if (typeof point === 'number' || point === null) {
            const tooltipContent = generateTooltipContent(parameter, point);
            rectangle.getTooltip()?.setContent(tooltipContent);
          }
        } else {
          const tooltipContent = generateTooltipContent(parameter, null);
          rectangle.getTooltip()?.setContent(tooltipContent);
        }
      }
    });
  };

  const handleParameterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value as PollutantParameter;
    setSelectedParameter(selected);

    if (simulationData) {
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

        let data;

        if (["CO", "NO2", "O3", "SO2"].includes(selected)) {
          data = simulationData.pollutants[selected as keyof PollutantsType];
        } else {
          data = simulationData.environment[selected as keyof EnvironmentType];
        }

        if (data) {
          updateRectangleColors(simulationData, selected, rectangles);
        }
      }
    }

    updateMarkerTooltips(selected);
    updateRectangleTooltips(selected);
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
      minZoom: 6,
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
    if (location.pathname === `/map/run-simulation/${flightId}`) {
      setSimulationData(location.state.simulationData);
      console.log(simulationData)

      if (map !== null) {
        const initialParameter = selectedParameter || (location.state.simulationData.pollutants.final_step && Object.keys(location.state.simulationData.pollutants.final_step).filter((key) => Array.isArray(location.state.simulationData.pollutants.final_step[key]) && location.state.simulationData.pollutants.final_step[key].length > 0)[0]);


        visualiseSimulation(
          location.state.simulationData,
          flightId,
          map,
          initialParameter,
          setAvailableParameters,
          setRectangles,
          setWindArrows,
          setFlightData,
          setMarkers,
          setNotification
        );
      }
    } else if (flightId && map && location.pathname === `/map/${flightId}`) {
      loadFlightData(Number(flightId), map, setNotification);
    }
  }, [flightId, location.pathname, location.state, map, selectedParameter, simulationData]);


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

      {location.pathname === `/map/run-simulation/${flightId}` && selectedParameter && (
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
