import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useParams } from 'react-router-dom';
import { NotificationProps } from '../../types/NotificationPropsType';
import { Notification } from "../../components/Notification";
import { getDroneFlightById } from '../drone/api/getDroneFlightById';
import { DroneMeasurementType } from '../../types/DroneMeasurementType';

export default function Map() {
  const flightExample = {
    "userId": 1,
    "title": "Flight over Cracow",
    "description": "Flight over Cracow on 28th September at 12 o'clock",
    "date": "2024-08-29T00:00:00.000Z",
    "measurements": [
      {
        "id": 1,
        "name": "Point 1 - Wawel",
        "latitude": 50.0545,
        "longitude": 19.9353,
        "temperature": 22.5
      },
      {
        "id": 2,
        "name": "Point 2 - Main Square",
        "latitude": 50.0614,
        "longitude": 19.9372,
        "temperature": 23.1
      },
      {
        "id": 3,
        "name": "Point 3 - Kazimierz",
        "latitude": 50.0487,
        "longitude": 19.9445,
        "temperature": 22.8
      },
      {
        "id": 4,
        "name": "Point 4 - Vistula River",
        "latitude": 50.0510,
        "longitude": 19.9366,
        "temperature": 22.3
      },
      {
        "id": 5,
        "name": "Point 5 - Krakow University",
        "latitude": 50.0647,
        "longitude": 19.9248,
        "temperature": 23.4
      },
      {
        "id": 6,
        "name": "Point 6 - St. Mary's Basilica",
        "latitude": 50.0616,
        "longitude": 19.9393,
        "temperature": 23.0
      },
      {
        "id": 7,
        "name": "Point 7 - Planty Park",
        "latitude": 50.0594,
        "longitude": 19.9336,
        "temperature": 22.7
      },
      {
        "id": 8,
        "name": "Point 8 - Krakow Barbican",
        "latitude": 50.0642,
        "longitude": 19.9420,
        "temperature": 22.9
      },
      {
        "id": 9,
        "name": "Point 9 - Floriańska Street",
        "latitude": 50.0636,
        "longitude": 19.9383,
        "temperature": 23.2
      },
      {
        "id": 10,
        "name": "Point 10 - Blonia Park",
        "latitude": 50.0617,
        "longitude": 19.9115,
        "temperature": 23.3
      },
      {
        "id": 11,
        "name": "Point 11 - Nowa Huta",
        "latitude": 50.0700,
        "longitude": 20.0374,
        "temperature": 23.0
      },
      {
        "id": 12,
        "name": "Point 12 - Wieliczka",
        "latitude": 49.9873,
        "longitude": 20.0652,
        "temperature": 22.6
      }
    ]
  }

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

    if (flightId || flightExample) {
      const fetchFlightData = async () => {
        try {
          // const flight = await getDroneFlightById(Number(flightId));
          const flight = flightExample
          const flightData = {
            ...flight,
            date: flight.date ? new Date(flight.date) : undefined
          };

          const validPoints = flightData.measurements.filter((point: DroneMeasurementType) => point.latitude !== null && point.longitude !== null);


          if (validPoints.length > 0) {
            const bounds = L.latLngBounds(validPoints.map((point: DroneMeasurementType) => [point.latitude, point.longitude] as [number, number]));

            map.fitBounds(bounds);

            validPoints.forEach((point: DroneMeasurementType) => {
              const marker = L.marker([point.latitude!, point.longitude!]).addTo(map);



              <div className="leaflet-marker-icon marker-default leaflet-zoom-animated leaflet-clickable" style={{ marginLeft: '-6px', marginTop: '-6px', width: '12px', height: '12px', transform: 'translate3d(1252px, 147px, 0px)', zIndex: 147 }} tabIndex={0}>
                <div>
                  <span className="city-bullet"></span>
                  <div className="city-data">
                    <div className="row city-main-info">
                      <span className="city-weather">33 </span>
                      <span className="city-name weather-very-hot">Ech&nbsp;Chettia</span>
                      </div>
                      <div className="row city-full-info">
                        <table>
                          <thead>
                            <tr>
                              <th colSpan={2} className="city-param weather-very-hot">Ech&nbsp;Chettia</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="city-param-name">country</td>
                              <td className="city-param">DZ</td>
                            </tr>
                            <tr>
                              <td className="city-param-name">temp</td>
                              <td className="city-param">33.46ºC</td>
                            </tr>
                            <tr>
                              <td className="city-param-name">clouds</td>
                              <td className="city-param">0%</td>
                            </tr>
                            <tr>
                              <td className="city-param-name">humidity</td>
                              <td className="city-param">41%</td>
                            </tr>
                            <tr>
                              <td className="city-param-name">pressure</td>
                              <td className="city-param">1010hPa</td>
                            </tr>
                            <tr>
                              <td className="city-param-name">wind direction</td>
                              <td className="city-param">346°</td>
                            </tr>
                            <tr>
                              <td className="city-param-name">wind speed</td>
                              <td className="city-param">5m/s</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>


              const tooltipContent = `
                <div className="city-data">
                  <div className="row city-main-info flex items-center">
                    <span className="city-weather font-bold text-lg">${point.temperature ?? 'N/A'}ºC </span>
                    <span className="city-name font-semibold ml-2">${point.name}</span>
                  </div>
                  <div className="row city-full-info mt-2">
                    <table className="text-left">
                      <tbody>
                        <tr><td className="pr-2 font-semibold">Country</td><td>PL</td></tr>
                        <tr><td className="pr-2 font-semibold">Temp</td><td>${point.temperature ?? 'N/A'}ºC</td></tr>
                        <!-- Możesz dodać dodatkowe dane tutaj -->
                      </tbody>
                    </table>
                  </div>
                </div>
              `;

              marker.bindTooltip(tooltipContent, {
                permanent: false,
                direction: 'top',
                className: 'custom-tooltip p-2 rounded-lg shadow-lg bg-white',
              });

              marker.on('mouseover', function () {
                marker.getElement()!.classList.add('marker-expanded');
              });

              marker.on('mouseout', function () {
                marker.getElement()!.classList.remove('marker-expanded');
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
