import L from 'leaflet';
import 'leaflet-spline'
import { getDroneFlightById } from '../drone/api/getDroneFlightById';
import { DroneMeasurementType } from '../../types/DroneMeasurementType';
import { NotificationProps } from '../../types/NotificationPropsType';
import { FlightMap } from './Map';


const createSplinePath = (points: [number, number][]): L.Polyline => {
  return L.spline(points, {
    color: '#48484A',
    weight: 3,
    opacity: 0.7,
    smoothing: 0.2
  });
};

const updateLineWeight = (polyline: L.Polyline, map: L.Map) => {
  const currentZoom = map.getZoom();
  const baseWeight = 3;
  const scaleFactor = Math.max(1, currentZoom / 10);

  polyline.setStyle({
    weight: baseWeight * scaleFactor
  });
};

export const loadFlightData = async (
  flightId: number,
  map: L.Map,
  setNotification: (notification: NotificationProps) => void,
  updateState: (newState: Partial<FlightMap>) => void
) => {
  try {
    const flight = await getDroneFlightById(flightId);

    if (!flight || !flight.measurements || !Array.isArray(flight.measurements) || flight.measurements.length === 0) {
      console.error('Invalid flight data or no measurements');
      setNotification({
        message: 'No Data',
        description: 'No flight measurements found',
        type: 'error',
      });
      return;
    }

    const validPoints = flight.measurements
      .filter((point: DroneMeasurementType): point is DroneMeasurementType =>
        point.latitude != null &&
        point.longitude != null
      );

    if (validPoints.length === 0) {
      setNotification({
        message: 'No Valid Points',
        description: 'No valid geographical points found',
        type: 'error',
      });
      return;
    }

    const bounds = L.latLngBounds(
      validPoints.map((point: DroneMeasurementType) => [point.latitude!, point.longitude!] as [number, number])
    );
    map.fitBounds(bounds);

    const markers: L.Marker[] = [];

    const routePoints: [number, number][] = validPoints
      .map((point: DroneMeasurementType) =>
        point.latitude != null && point.longitude != null
          ? [point.latitude, point.longitude] as [number, number]
          : null
      )
      .filter((point: [number, number]): point is [number, number] => point !== null);

    validPoints.forEach((point: DroneMeasurementType) => {
      const marker = L.marker([point.latitude!, point.longitude!], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `
            <div class="custom-box flex">
              <div class="inline-block whitespace-nowrap text-xs font-semibold text-white px-2 py-1 bg-[#48484A]">
                ${point.temperature ?? 'N/A'}ºC
              </div>
              <div class="inline-block whitespace-nowrap text-xs font-semibold text-white px-2 py-1 bg-[#F56048]">
                ${point.name}
              </div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [10, 10],
        }),
      }).addTo(map);

      const expandedTooltipContent = `
        <div class="bg-white p-4 rounded-lg shadow-lg">
          <h3 class="text-lg font-bold mb-2">${point.name}</h3>
          <ul class="text-sm">
            <li>Name: ${point.name ?? 'N/A'}</li>
            <li>Temp: ${point.temperature ?? 'N/A'}ºC</li>
            <li>Pressure: ${point.pressure ?? 'N/A'} hPa</li>
            <li>Wind Direction: ${point.windDirection ?? 'N/A'}°</li>
            <li>Wind Speed: ${point.windSpeed ?? 'N/A'} m/s</li>
          </ul>
        </div>
      `;

      marker.bindTooltip(expandedTooltipContent, {
        permanent: false,
        direction: 'bottom',
        className: 'expanded-tooltip',
      });

      marker.on('click', function () {
        marker.toggleTooltip();
      });

      markers.push(marker);
    });

    updateState({
      flightData: validPoints,
      markers: markers
    });

    if (routePoints.length > 1) {
      try {
        const routePolyline = createSplinePath(routePoints);
        routePolyline.addTo(map);

        map.on('zoomend', () => {
          updateLineWeight(routePolyline, map);
        });
      } catch (error) {
        console.error('Error creating route polyline:', error);
        setNotification({
          message: 'Route Error',
          description: 'Could not create flight route',
          type: 'error',
        });
      }
    }
  } catch (error) {
    setNotification({
      message: 'Error',
      description: `Failed to fetch flight data: ${error instanceof Error ? error.message : String(error)}`,
      type: 'error',
    });
    console.log('Full error:', error)
  }
};