import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useParams } from 'react-router-dom';
import { NotificationProps } from '../../types/NotificationPropsType';
import { Notification } from "../../components/Notification";
import { getDroneFlightById } from '../drone/api/getDroneFlightById';
import { DroneMeasurementType } from '../../types/DroneMeasurementType';

export default function Map() {
  
  const { flightId } = useParams();

  const [notification, setNotification] = useState<NotificationProps>({
    message: "",
    description: "",
    type: "",
  });

  useEffect(() => {
    const map = L.map('map', {
      zoomAnimation: true,
      markerZoomAnimation: true,
    }).setView([50.0534, 20.0037], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    if (flightId) {
      const fetchFlightData = async () => {
        try {
          const flight = await getDroneFlightById(Number(flightId));
          const flightData = {
            ...flight,
            date: flight.date ? new Date(flight.date) : undefined
          };

          const validPoints = flightData.measurements.filter((point: DroneMeasurementType) => point.latitude !== null && point.longitude !== null);


          if (validPoints.length > 0) {
            const bounds = L.latLngBounds(validPoints.map((point: DroneMeasurementType) => [point.latitude, point.longitude] as [number, number]));

            map.fitBounds(bounds);

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
                })
              }).addTo(map);

            const expandedTooltipContent = `
              <div class="bg-white p-4 rounded-lg shadow-lg">
                <h3 class="text-lg font-bold mb-2">${point.name}</h3>
                <ul class="text-sm">
                  <li>Name: ${point.name ?? 'N/A'}</li>
                  <li>Temp: ${point.temperature ?? 'N/A'}ºC</li>
                  <li>Humidity: ${point.temperature ?? 'N/A'}%</li>
                  <li>Pressure: ${point.temperature ?? 'N/A'}hPa</li>
                  <li>Wind Direction: ${point.temperature ?? 'N/A'}°</li>
                  <li>Wind Speed: ${point.temperature ?? 'N/A'}m/s</li>
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
            });
          }
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

    return () => {
      map.off();
      map.remove();
    };
  }, [flightId]);

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
    </>
  );
}
