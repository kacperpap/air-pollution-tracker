import L, { Marker } from 'leaflet';
import { Box, PollutantParameter } from './MapTypes';
import { generateTooltipContent, getColorForValue, updateRectangleColors } from './utils';
import { NotificationProps } from '../../types/NotificationPropsType';
import { getDroneFlightById } from '../drone/api/getDroneFlightById';
import { DroneMeasurementType } from '../../types/DroneMeasurementType';

export const visualiseSimulation = async (
  simulationData: any,
  flightId: string | number | undefined,
  map: L.Map,
  selectedParameter: string,
  setAvailableParameters: (params: string[]) => void,
  setRectangles: (rectangles: L.Rectangle[]) => void,
  setWindArrows: (arrows: L.Polyline[]) => void,
  setFlightData: (data: DroneMeasurementType[]) => void,
  setMarkers: (markers: Marker[]) => void,
  setNotification: (notification: NotificationProps) => void
) => {

    if (!simulationData || !map) {
        setNotification({
            message: 'Error',
            description: 'No simulation data found.',
            type: 'error',
        });
        return;
    }

    const { grid, pollutants, environment } = simulationData;

    const pollutantParams = Object.keys(pollutants.final_step).filter(p => pollutants.final_step[p].length > 0);

    let environmentParams = Object.keys(environment).filter(param => param !== 'windSpeed' && param !== 'windDirection');

    if (environment.windSpeed && environment.windDirection) {
        environmentParams.push('wind');
    }

    const availableParameters = [...pollutantParams, ...environmentParams];
    setAvailableParameters(availableParameters);


    const pollutantValues = simulationData.pollutants.final_step[selectedParameter] || simulationData.environment[selectedParameter];

    if (!Array.isArray(pollutantValues)) {
        setNotification({
            message: 'Error',
            description: `No data available for ${selectedParameter}.`,
            type: 'error',
        });
        return;
    }

    const rectangles: L.Rectangle[] = grid.boxes.map((box: Box, index: number) => {
        const bounds: L.LatLngBoundsLiteral = [
        [box.lat_min, box.lon_min],
        [box.lat_max, box.lon_max],
        ];

        const value = pollutantValues[index];
        const color = value !== undefined ? getColorForValue(value, selectedParameter as PollutantParameter) : '#000000';


        const rectangle = L.rectangle(bounds, {
            color: color,
            fillColor: color,
            fillOpacity: 0.5,
            weight: 1,
        });

        const tooltipContent = generateTooltipContent(selectedParameter, pollutantValues[index])

        rectangle.bindTooltip(tooltipContent, {
          permanent: false,
          direction: 'center',
          className: 'box-tooltip',
        })

        rectangle.addTo(map);
        return rectangle;

    });

    updateRectangleColors(simulationData, selectedParameter, rectangles);
    setRectangles(rectangles);

    const windData = {
      direction: environment.windDirection,
      speed: environment.windSpeed,
    };
    
    const arrows = drawWindArrows(grid, map, windData, selectedParameter === 'wind');
    setWindArrows(arrows);

    if (flightId) {
      try {
        const flight = await getDroneFlightById(flightId as number);
        const validPoints = flight.measurements.filter(
          (point: DroneMeasurementType) => point.latitude !== null && point.longitude !== null
        );

        setFlightData(validPoints);

        const markers: L.Marker[] = validPoints.map((point: DroneMeasurementType) => {
          let tooltipContent = `<strong>Measurement:</strong> ${point.name}`;
        
          tooltipContent += generateTooltipContent(selectedParameter, point)

          const marker = L.marker([point.latitude as number, point.longitude as number], {
            icon: L.icon({
              iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png', 
              iconSize: [32, 32],
              iconAnchor: [16, 32],
            }),
          })

          marker.bindTooltip(tooltipContent, {
            permanent: false,
            direction: 'top',
            className: 'measurement-tooltip',
          });

          marker.addTo(map)

          return marker
        });

        setMarkers(markers)

        const bounds = L.latLngBounds(
          validPoints.map((point: DroneMeasurementType) => [point.latitude, point.longitude] as [number, number])
        );
        map.fitBounds(bounds);
      } catch (error) {
        setNotification({
          message: 'Error',
          description: 'Failed to load flight data.',
          type: 'error',
        });
      }
    }
};

export const drawWindArrows = (
  grid: any,
  map: L.Map,
  windData: { direction: number[], speed: number[]},
  isVisible: boolean
) => {
  const arrows: L.Polyline[] = [];

  grid.boxes.forEach((box: Box, index: number) => {
    const direction = windData.direction[index];
    const speed = windData.speed[index];
    
    const center: L.LatLngExpression = [
      (box.lat_min + box.lat_max) / 2,
      (box.lon_min + box.lon_max) / 2
    ];
    
    const arrowLength = Math.min(
      (box.lat_max - box.lat_min) * 0.4,
      (box.lon_max - box.lon_min) * 0.4
    ) * speed; 

    const angleRad = (direction * Math.PI) / 180;
    const endPoint: L.LatLngExpression = [
      center[0] + Math.cos(angleRad) * arrowLength,
      center[1] + Math.sin(angleRad) * arrowLength
    ];

    const arrowColor = getColorForValue(
      windData.speed[index], 
      'wind' as PollutantParameter
    );

    const arrow = L.polyline([center, endPoint], {
      color: arrowColor,
      weight: 2,
      opacity: isVisible ? 1 : 0
    }).addTo(map);
    
    const arrowHead = L.polyline(
      [
        [
          endPoint[0] - Math.cos(angleRad + Math.PI / 6) * arrowLength * 0.2,
          endPoint[1] - Math.sin(angleRad + Math.PI / 6) * arrowLength * 0.2
        ] as L.LatLngExpression, 
        endPoint,
        [
          endPoint[0] - Math.cos(angleRad - Math.PI / 6) * arrowLength * 0.2,
          endPoint[1] - Math.sin(angleRad - Math.PI / 6) * arrowLength * 0.2
        ] as L.LatLngExpression
      ],
      {
        color: arrowColor,
        weight: 2,
        opacity: isVisible ? 1 : 0
      }
    ).addTo(map);

    arrows.push(arrow, arrowHead);
  });

  return arrows
};
