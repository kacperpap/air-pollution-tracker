import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import L from "leaflet";
import pako from "pako";
import { getSimulationById } from "../simulation/api/getSimulationById";
import { Notification } from "../../components/Notification";
import { ParameterSelector } from "./ParameterSelector";
import { Legend } from "./Legend";
import { visualiseStep } from "./VisualiseStep"
import { NotificationProps } from "../../types/NotificationPropsType";
import { EnvironmentType, PollutantDataType, PollutantsType } from "../../types/SimulationResponseType";
import { MapState, PollutantParameter } from "./MapTypes";
import { DroneMeasurementType } from "../../types/DroneMeasurementType";
import { generateTooltipContent, updateRectangleColors } from "./utils";
import { getDroneFlightById } from "../drone/api/getDroneFlightById";
import { SimulationAnimation } from "./SimulationAnimation";

export default function MapSimulation() {
  const { simulationId } = useParams<{ simulationId: string }>();
  const location = useLocation();

  const [notification, setNotification] = useState<NotificationProps>({
    message: "",
    description: "",
    type: "",
  });

  const [state, setState] = useState<MapState>({
    map: null,
    simulationId: null,
    simulationData: null,
    selectedParameter: "",
    availableParameters: [],
    rectangles: [],
    windArrows: [],
    flightId: null,
    flightData: null,
    markers: [],
  });

  const updateState = useCallback((newState: Partial<MapState>) => {
    setState((prevState: any) => ({ ...prevState, ...newState }));
  }, []);

  useEffect(() => {
    const mapInstance = L.map("mapSimulation", {
      zoomAnimation: true,
      markerZoomAnimation: true,
      minZoom: 6,
    }).setView([50.0534, 20.0037], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstance);

    updateState({ map: mapInstance });

    return () => {
      mapInstance.off();
      mapInstance.remove();
    };
  }, [updateState]);


  useEffect(() => {
    const fetchSimulationData = async () => {
      try {
        const simulation = await getSimulationById(Number(simulationId));
        if (simulation.result) {
          const decompressed = pako.ungzip(new Uint8Array(simulation.result.data), { to: "string" });
          updateState({
            simulationData: JSON.parse(decompressed),
            simulationId: Number(simulationId)
          });

          if (simulation.droneFlightId) {
            updateState({
              flightData: await getDroneFlightById(simulation.droneFlightId as number),
              flightId: simulation.droneFlightId,
            });
          } else {
            setNotification({
              message: "Error",
              description: `Simulation data is missing droneFlightId or flight does not exist, cannot fetch drone flight data`,
              type: "error",
            });
          }
        } else {
          setNotification({
            message: "Error",
            description: `Simulation data: result is missing.`,
            type: "error",
          });
        }
      } catch (error) {
        setNotification({
          message: "Error",
          description: `Simulation data: ${error}`,
          type: "error",
        });
      }
    };

    if (!state.simulationData || state.simulationId !== Number(simulationId)) {
      fetchSimulationData();
    }
  }, [simulationId, location.pathname, updateState]);


  useEffect(() => {
    if (state.simulationData) {
      const { pollutants, environment } = state.simulationData;

      const availableParameters = [
        ...Object.keys(pollutants.final_step)
          .filter((p): p is keyof PollutantDataType => p in pollutants.final_step)
          .filter(p => pollutants.final_step[p].length > 0),
        ...(environment.windSpeed && environment.windDirection ? ['wind'] : []),
        ...Object.keys(environment)
          .filter(param => environment[param as keyof EnvironmentType]?.length > 0)
          .filter(param => param !== 'windSpeed' && param !== 'windDirection')
      ];

      updateState({
        availableParameters,
      });
    }
  }, [state.simulationData, updateState]);


  useEffect(() => {
    if (state.simulationData) {
      const validParams = Object.keys(state.simulationData.pollutants?.final_step || {})
        .filter(param =>
          (state.simulationData?.pollutants?.final_step[param as keyof PollutantDataType]?.length || 0) > 0
        );

      const initialParameter = validParams.length > 0 ? validParams[0] : '';
      updateState({ selectedParameter: initialParameter });

      if (initialParameter && state.map && state.flightData) {
        clearPreviousVisualization();

        visualiseStep({
          environment: state.simulationData.environment,
          grid: state.simulationData.grid,
          step: state.simulationData.pollutants.final_step,
          flightData: state.flightData,
          map: state.map,
          selectedParameter: initialParameter,
          setRectangles: (rectangles) => updateState({ rectangles }),
          setWindArrows: (windArrows) => updateState({ windArrows }),
          setMarkers: (markers) => updateState({ markers }),
          setNotification,
        });
      }
    }
  }, [state.simulationData, state.map, state.flightData, updateState]);



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
          ? state.simulationData.pollutants.final_step[selectedParameter as keyof PollutantDataType]
          : state.simulationData.environment[selectedParameter as keyof EnvironmentType];

        if (data) {
          updateRectangleColors(data, selectedParameter, state.rectangles);
        }
      }

      state.markers.forEach((marker, index) => {
        const point = state.flightData?.measurements[index];
        if (!point) return;

        let tooltipContent = `<strong>Measurement:</strong> ${point.name}<br>`;
        let value: number | [number, number] | null = null;

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
    setNotification({ message: "", description: "", type: "" });
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

      <div id="mapSimulation" className="absolute inset-0 w-full h-full relative z-10"></div>

      {location.pathname === `/map/run-simulation/${simulationId}` && state.selectedParameter && (
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
