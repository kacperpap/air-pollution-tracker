import React, { useCallback, useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation, useParams } from 'react-router-dom';

import { NotificationProps } from '../../types/NotificationPropsType';
import { DroneMeasurementType } from '../../types/DroneMeasurementType';
import { PollutantDataType, EnvironmentType, PollutantsType } from '../../types/SimulationResponseType';

import { Notification } from "../../components/Notification";
import { ParameterSelector } from './ParameterSelector';
import { Legend } from './Legend';

import { generateTooltipContent, updateRectangleColors } from './utils';
import { loadFlightData } from './loadFlightData';
import { visualiseSimulation } from './visualiseSimulation';

import { MapState, PollutantParameter } from './MapTypes';


export default function Map() {
  const { flightId } = useParams();
  const location = useLocation();

  const [state, setState] = useState<MapState>({
    map: null,
    selectedParameter: '',
    availableParameters: [],
    rectangles: [],
    windArrows: [],
    flightData: [],
    markers: []
  });

  const [notification, setNotification] = useState<NotificationProps>({
    message: "",
    description: "",
    type: "",
  });

  const updateState = useCallback((newState: Partial<MapState>) => {
    setState(prevState => ({ ...prevState, ...newState }));
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
    const validParams = Object.keys(state.simulationData?.pollutants?.final_step || {})
      .filter(param => (state.simulationData?.pollutants?.final_step[param as keyof PollutantDataType]?.length || 0) > 0);
    
    const initialParameter = validParams.length > 0 ? validParams[0] : '';
    updateState({ selectedParameter: initialParameter });
  }, [state.simulationData, updateState]);
  

  useEffect(() => {
    if (location.pathname === `/map/run-simulation/${flightId}`) {
      const simulationData = location.state.simulationData;
      
      updateState({ simulationData });

      if (state.map && state.selectedParameter) {
        clearPreviousVisualization();
        visualiseSimulation({
          simulationData,
          flightId,
          map: state.map,
          selectedParameter: state.selectedParameter,
          setAvailableParameters: (params) => updateState({ availableParameters: params }),
          setRectangles: (rectangles) => updateState({ rectangles }),
          setWindArrows: (windArrows) => updateState({ windArrows }),
          setFlightData: (flightData) => updateState({ flightData }),
          setMarkers: (markers) => updateState({ markers }),
          setNotification,
        });        
      }
    } else if (flightId && state.map && location.pathname === `/map/${flightId}`) {
      loadFlightData(Number(flightId), state.map, setNotification, updateState);
    }
  }, [flightId, location.pathname, location.state, state.map, state.selectedParameter, updateState]);

  const handleParameterChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedParameter = event.target.value as PollutantParameter;
    updateState({ selectedParameter });

    if (state.simulationData) {
      const updateVisibility = (items: L.Polyline[] | L.Rectangle[], isVisible: boolean) => 
        items.forEach(item => item.setStyle({ 
          opacity: isVisible ? 1 : 0, 
          fillOpacity: isVisible ? 0.5 : 0 
        }));

      if (selectedParameter === 'wind') {
        updateVisibility(state.rectangles, false);
        updateVisibility(state.windArrows, true);
      } else {
        updateVisibility(state.windArrows, false);
        updateVisibility(state.rectangles, true);
        
        const data = ["CO", "NO2", "O3", "SO2"].includes(selectedParameter)
          ? state.simulationData.pollutants[selectedParameter as keyof PollutantsType]
          : state.simulationData.environment[selectedParameter as keyof EnvironmentType];

        if (data) {
          updateRectangleColors(state.simulationData, selectedParameter, state.rectangles);
        }
      }

      state.markers.forEach((marker, index) => {
        const point = state.flightData[index];
        if (!point) return;

        let tooltipContent = `<strong>Measurement:</strong> ${point.name}<br>`;
        let value : number | [number, number ] | null = null;

        if (selectedParameter === 'wind') {
          value = point.windSpeed !== null && point.windDirection !== null 
            ? [point.windSpeed, point.windDirection] 
            : null;
        } else if (['temperature', 'pressure'].includes(selectedParameter)) {
          value = point[selectedParameter as keyof DroneMeasurementType] as number;
        } else if (['CO', 'NO2', 'O3', 'SO2'].includes(selectedParameter)) {
          const pollutant = point.pollutionMeasurements.find(p => p.type === selectedParameter);
          value = pollutant ? pollutant.value : null;
        }

        tooltipContent += value !== null 
          ? generateTooltipContent(selectedParameter, value)
          : `\n${selectedParameter}: No Data`;

        marker.getTooltip()?.setContent(tooltipContent);
      });

      state.rectangles.forEach((rectangle, index) => {
        if (state.simulationData) {
          let value: number | [number, number] | null = null;

          if (selectedParameter === 'wind') {
            const windSpeed = state.simulationData.environment.windSpeed[index];
            const windDirection = state.simulationData.environment.windDirection[index];
            value = windSpeed !== undefined && windDirection !== undefined 
              ? [windSpeed, windDirection] 
              : null;
          } else if (['temperature', 'pressure'].includes(selectedParameter)) {
            const envData = state.simulationData.environment[selectedParameter as keyof EnvironmentType];
            value = envData && envData[index] !== undefined ? envData[index] : null;
          } else if (['CO', 'NO2', 'O3', 'SO2'].includes(selectedParameter)) {
            const pollutantData = state.simulationData.pollutants.final_step[selectedParameter as keyof PollutantDataType];
            value = pollutantData && pollutantData[index] !== undefined ? pollutantData[index] : null;
          }

          const tooltipContent = value !== null 
            ? generateTooltipContent(selectedParameter, value)
            : `No data for ${selectedParameter}`;
          
          rectangle.getTooltip()?.setContent(tooltipContent);
        }
      });
    }
  }, [state, updateState]);

  const clearPreviousVisualization = () => {
    state.rectangles.forEach(rectangle => {
      rectangle.remove();
    });
  
    state.windArrows.forEach(arrow => {
      arrow.remove();
    });
  
    state.markers.forEach(marker => {
      marker.remove();
    });
  };

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

      {location.pathname === `/map/run-simulation/${flightId}` && state.selectedParameter && (
        <>
          <Legend parameter={state.selectedParameter} />
          <ParameterSelector
            parameters={state.availableParameters}
            selectedParameter={state.selectedParameter}
            onChange={handleParameterChange}
          />
        </>
      )}
    </>
  );
}
