import L from 'leaflet';
import { Box, PollutantParameter } from './MapTypes';
import { getColorForValue, getColorScale, updateRectangleColors } from './utils';
import { NotificationProps } from '../../types/NotificationPropsType';
import { POLLUTANT_RANGES } from './POLLUTANT_RANGES';

export const visualiseSimulation = (
  simulationData: any,
  map: L.Map,
  selectedParameter: string,
  setAvailableParameters: (params: string[]) => void,
  setRectangles: (rectangles: L.Rectangle[]) => void,
  setWindArrows: (arrows: L.Polyline[]) => void,
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

        rectangle.addTo(map);
        return rectangle;
    });

    const windData = {
      direction: environment.windDirection,
      speed: environment.windSpeed,
    };
    
    updateRectangleColors(simulationData, selectedParameter, rectangles);
    setRectangles(rectangles);

    const arrows = drawWindArrows(grid, map, windData, selectedParameter === 'wind');
    setWindArrows(arrows);

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
