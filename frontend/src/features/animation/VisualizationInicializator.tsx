import L, { Marker } from 'leaflet';
import { Box, PollutantParameter } from './MapTypes';
import { generateTooltipContent, getColorForValue, updateRectangleColors } from './utils';
import { NotificationProps } from '../../types/NotificationPropsType';
import { DroneMeasurementType } from '../../types/DroneMeasurementType';
import { EnvironmentType, GridType, PollutantDataType } from '../../types/SimulationResponseType';
import { DroneFlightType } from '../../types/DroneFlightType';

interface WindData {
  direction: number[];
  speed: number[];
}

interface VisualisationParams {
  environment: EnvironmentType;
  grid: GridType;
  step: PollutantDataType
  flightData: DroneFlightType;
  map: L.Map;
  selectedParameter: string;
  setRectangles: (rectangles: L.Rectangle[]) => void;
  setWindArrows: (arrows: L.Polyline[]) => void;
  setMarkers: (markers: Marker[]) => void;
  setNotification: (notification: NotificationProps) => void;
}

const getParameterValues = (
  step: PollutantDataType, 
  environment: EnvironmentType,
  selectedParameter: string
): number[] => {

  return step[selectedParameter as keyof PollutantDataType] || environment[selectedParameter as keyof EnvironmentType];
};

const getWindValues = (
  grid: GridType,
  environment: EnvironmentType,
): [number, number][] => {

  return grid.boxes.map((_, index) => {
    const windSpeed = environment.windSpeed[index] ?? 0;
    const windDirection = environment.windDirection[index] ?? 0;
    return [windSpeed, windDirection] as [number, number]
  })
};


const createMapRectangles = (
  grid: { boxes: Box[] },
  selectedParameter: string,
  pollutantValues: number[] | [number, number][],
  map: L.Map
): L.Rectangle[] => {
  return grid.boxes.map((box: Box, index: number) => {
    const bounds: L.LatLngBoundsLiteral = [
      [box.lat_min, box.lon_min],
      [box.lat_max, box.lon_max]
    ];

    const value =
      selectedParameter === 'wind'
        ? (pollutantValues[index] as [number, number])
        : (pollutantValues[index] as number);

    const color =
      selectedParameter === 'wind'
        ? (value && Array.isArray(value)
          ? getColorForValue(value[0], selectedParameter as PollutantParameter)
          : '#000000')
        : (value !== undefined
          ? getColorForValue(value as number, selectedParameter as PollutantParameter)
          : '#000000');

    const rectangle = L.rectangle(bounds, {
      color: color,
      fillColor: color,
      fillOpacity: 0.5,
      weight: 1,
    });

    const tooltipContent = generateTooltipContent(selectedParameter, value);

    rectangle.bindTooltip(tooltipContent, {
      permanent: false,
      direction: 'center',
      className: 'box-tooltip',
    });

    rectangle.addTo(map);
    return rectangle;
  });
};

export const iniciateVisulaization = async ({
  environment,
  grid,
  step,
  flightData,
  map,
  selectedParameter,
  setRectangles,
  setWindArrows,
  setMarkers,
  setNotification
}: VisualisationParams) => {

  if (!environment || !map || !grid || !step) {
    setNotification({
      message: 'Error',
      description: 'No simulation data found.',
      type: 'error',
    });
    return;
  }

  if (!flightData) {
    setNotification({
      message: 'Error',
      description: 'No flight measuerements data found.',
      type: 'error',
    });
  }

  const pollutantValues = getParameterValues(step, environment, selectedParameter);

  if (selectedParameter !== 'wind' && !Array.isArray(pollutantValues)) {
    setNotification({
      message: 'Error',
      description: `No data available for ${selectedParameter}.`,
      type: 'error',
    });
    return;
  }

  const rectangles = createMapRectangles(grid, selectedParameter, pollutantValues, map);

  updateRectangleColors(pollutantValues, selectedParameter, rectangles);
  setRectangles(rectangles);

  const windData: WindData = {
    direction: environment.windDirection,
    speed: environment.windSpeed,
  };

  const arrows = drawWindArrows(grid, map, windData, selectedParameter === 'wind');
  setWindArrows(arrows);

  if (flightData) {
    try {
      
      const validPoints = flightData.measurements.filter(
        (point: DroneMeasurementType) =>
          point.latitude !== null && point.longitude !== null
      );

      if (validPoints.length === 0) {
        setNotification({
          message: 'Error',
          description: 'No valid flight data points found.',
          type: 'error',
        });
        return;
      }

      const markers = createFlightMarkers(
        validPoints,
        selectedParameter,
        map
      );

      setMarkers(markers);

      const bounds = L.latLngBounds(
        validPoints.map((point: DroneMeasurementType) =>
          [point.latitude, point.longitude] as [number, number]
        )
      );
      map.fitBounds(bounds, { padding: [25, 25] });

    } catch (error) {
      setNotification({
        message: 'Error',
        description: 'Failed to load flight data.',
        type: 'error',
      });
    }
  }
};

const createFlightMarkers = (
  points: DroneMeasurementType[],
  selectedParameter: string,
  map: L.Map
): L.Marker[] => {
  return points.map((point: DroneMeasurementType) => {
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
      value = pollutant ? pollutant.value : null;  // Poprawione
    }

    tooltipContent += value !== null
      ? generateTooltipContent(selectedParameter, value)
      : `\n${selectedParameter}: No Data`;

    const marker = L.marker(
      [point.latitude as number, point.longitude as number],
      {
        icon: L.icon({
          iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        }),
      }
    );

    marker.bindTooltip(tooltipContent, {
      permanent: false,
      direction: 'top',
      className: 'measurement-tooltip',
    });

    marker.addTo(map);

    return marker;
  });
};

export const drawWindArrows = (
  grid: any,
  map: L.Map,
  windData: WindData,
  isVisible: boolean
) => {
  const arrows: L.Polyline[] = [];

  grid.boxes.forEach((box: Box, index: number) => {
    const azimuth = windData.direction[index];
    const speed = windData.speed[index];

    const center: L.LatLngExpression = [
      (box.lat_min + box.lat_max) / 2,
      (box.lon_min + box.lon_max) / 2
    ];

    const arrowLength = Math.min(
      (box.lat_max - box.lat_min) * 0.4,
      (box.lon_max - box.lon_min) * 0.4
    ) * speed;

    // Konwersja azymutu z geograficznego na matematyczny
    // Azymut geograficzny: 0° = North, rosnący zgodnie z ruchem zegara
    // Kąt matematyczny: 0° = East, rosnący przeciwnie do ruchu zegara
    const angleRad = azimuth * Math.PI / 180;

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

  return arrows;
};