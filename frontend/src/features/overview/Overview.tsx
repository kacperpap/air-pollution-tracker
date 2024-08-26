import { useState } from 'react';
import { DocumentIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';


export function Overview() {

    const droneFlights1 = [
        {
            id: 21332,
            title: 'Lorem ipsum dolor sit amet',
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed odio orci, tincidunt nec ipsum id, gravida auctor purus. Nulla justo neque, hendrerit sed malesuada id, tristique sit amet libero. Maecenas at rutrum felis. Morbi venenatis lacinia metus ut consequat. Morbi sapien est, auctor non rutrum ac, eleifend quis quam. Integer cursus nisi justo, vitae eleifend est finibus id. Ut feugiat lectus risus, vel fermentum elit sagittis et. Maecenas congue bibendum metus, nec blandit nisi aliquam non. Vivamus vestibulum tortor mattis enim consequat dignissim. In ac venenatis odio. Sed viverra nec ex ac ornare. Vivamus in massa ante. Mauris molestie at dolor non semper. Etiam ac enim lorem. Nullam maximus ipsum ut tellus scelerisque semper.Maecenas eu augue tellus. Ut eget odio quam. Quisque pretium eros id sodales fermentum. Curabitur tempus luctus magna, et malesuada diam vulputate quis. Nam a efficitur eros. Phasellus commodo blandit augue id condimentum. Integer tortor ipsum, tempus eget sapien eu, dapibus fringilla augue. Vestibulum a lectus quis nulla posuere placerat quis semper erat. Integer molestie velit in eros interdum sagittis. Cras vehicula purus ut elit porta, sed imperdiet nulla tempor. Fusce nec finibus nulla. Sed nulla ex, aliquet vel ante vel, pharetra efficitur massa. Suspendisse elit. ',
            measurements: [
                {
                    name: 'Lorem ipsum',
                    latitude: 0,
                    longtitude: 0,
                    temperature: 0
                },
                {
                    name: 'Lorem ipsum',
                    latitude: 0,
                    longtitude: 0,
                    temperature: 0
                },
                {
                    name: 'Lorem ipsum',
                    latitude: 0,
                    longtitude: 0,
                    temperature: 0
                }
            ]
        },
        {
            id: 2131322,
            title: 'Lorem ipsum dolor sit amet',
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed odio orci, tincidunt nec ipsum id, gravida auctor purus. Nulla justo neque, hendrerit sed malesuada id, tristique sit amet libero. Maecenas at rutrum felis. Morbi venenatis lacinia metus ut consequat. Morbi sapien est, auctor non rutrum ac, eleifend quis quam. Integer cursus nisi justo, vitae eleifend est finibus id. Ut feugiat lectus risus, vel fermentum elit sagittis et. Maecenas congue bibendum metus, nec blandit nisi aliquam non. Vivamus vestibulum tortor mattis enim consequat dignissim. In ac venenatis odio. Sed viverra nec ex ac ornare. Vivamus in massa ante. Mauris molestie at dolor non semper. Etiam ac enim lorem. Nullam maximus ipsum ut tellus scelerisque semper.Maecenas eu augue tellus. Ut eget odio quam. Quisque pretium eros id sodales fermentum. Curabitur tempus luctus magna, et malesuada diam vulputate quis. Nam a efficitur eros. Phasellus commodo blandit augue id condimentum. Integer tortor ipsum, tempus eget sapien eu, dapibus fringilla augue. Vestibulum a lectus quis nulla posuere placerat quis semper erat. Integer molestie velit in eros interdum sagittis. Cras vehicula purus ut elit porta, sed imperdiet nulla tempor. Fusce nec finibus nulla. Sed nulla ex, aliquet vel ante vel, pharetra efficitur massa. Suspendisse elit. ',
            measurements: [
                {
                    name: 'Lorem ipsum',
                    latitude: 0,
                    longtitude: 0,
                    temperature: 0
                },
                {
                    name: 'Lorem ipsum',
                    latitude: 0,
                    longtitude: 0,
                    temperature: 0
                }
            ]
        },
        {
            id: 532322,
            title: 'Lorem ipsum dolor sit amet',
            description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed odio orci, tincidunt nec ipsum id, gravida auctor purus. Nulla justo neque, hendrerit sed malesuada id, tristique sit amet libero. Maecenas at rutrum felis. Morbi venenatis lacinia metus ut consequat. Morbi sapien est, auctor non rutrum ac, eleifend quis quam. Integer cursus nisi justo, vitae eleifend est finibus id. Ut feugiat lectus risus, vel fermentum elit sagittis et. Maecenas congue bibendum metus, nec blandit nisi aliquam non. Vivamus vestibulum tortor mattis enim consequat dignissim. In ac venenatis odio. Sed viverra nec ex ac ornare. Vivamus in massa ante. Mauris molestie at dolor non semper. Etiam ac enim lorem. Nullam maximus ipsum ut tellus scelerisque semper.Maecenas eu augue tellus. Ut eget odio quam. Quisque pretium eros id sodales fermentum. Curabitur tempus luctus magna, et malesuada diam vulputate quis. Nam a efficitur eros. Phasellus commodo blandit augue id condimentum. Integer tortor ipsum, tempus eget sapien eu, dapibus fringilla augue. Vestibulum a lectus quis nulla posuere placerat quis semper erat. Integer molestie velit in eros interdum sagittis. Cras vehicula purus ut elit porta, sed imperdiet nulla tempor. Fusce nec finibus nulla. Sed nulla ex, aliquet vel ante vel, pharetra efficitur massa. Suspendisse elit. ',
            measurements: [
                {
                    name: 'Lorem ipsum',
                    latitude: 0,
                    longtitude: 0,
                    temperature: 0
                },
                {
                    name: 'Lorem ipsum',
                    latitude: 0,
                    longtitude: 0,
                    temperature: 0
                },
                {
                    name: 'Lorem ipsum',
                    latitude: 0,
                    longtitude: 0,
                    temperature: 0
                },
                {
                    name: 'Lorem ipsum',
                    latitude: 0,
                    longtitude: 0,
                    temperature: 0
                },
                {
                    name: 'Lorem ipsum',
                    latitude: 0,
                    longtitude: 0,
                    temperature: 0
                },
                {
                    name: 'Lorem ipsum',
                    latitude: 0,
                    longtitude: 0,
                    temperature: 0
                },
                {
                    name: 'Lorem ipsum',
                    latitude: 0,
                    longtitude: 0,
                    temperature: 0
                }
            ]
        }
    ]

    const droneFlights = [
        {
          id: 21332,
          title: 'Flight 1',
          description: 'Description for Flight 1',
          measurements: [
            { name: 'Point A', latitude: 0, longitude: 0, temperature: 20 },
            { name: 'Point B', latitude: 0, longitude: 0, temperature: 22 },
            { name: 'Point C', latitude: 0, longitude: 0, temperature: 21 },
          ],
        },
        {
          id: 2131322,
          title: 'Flight 2',
          description: 'Description for Flight 2',
          measurements: [
            { name: 'Point A', latitude: 0, longitude: 0, temperature: 19 },
            { name: 'Point B', latitude: 0, longitude: 0, temperature: 21 },
          ],
        },
        {
          id: 532322,
          title: 'Flight 3',
          description: 'Description for Flight 3',
          measurements: [
            { name: 'Point A', latitude: 0, longitude: 0, temperature: 18 },
            { name: 'Point B', latitude: 0, longitude: 0, temperature: 20 },
            { name: 'Point C', latitude: 0, longitude: 0, temperature: 22 },
            { name: 'Point D', latitude: 0, longitude: 0, temperature: 21 },
          ],
        },
      ];

    const [expandedFlight, setExpandedFlight] = useState<number | null>(null);


    const toggleExpand = (flightId: number | null) => {
        setExpandedFlight(expandedFlight === flightId ? null : flightId);
    };

    return (
        <div className="max-w-[96rem] mx-auto p-6 bg-white shadow-md rounded-lg mt-6 mb-50 overflow-y-scroll">
          <ul role="list" className="divide-y divide-gray-100">
            {droneFlights.map((droneFlight) => (
              <li key={droneFlight.id} className="flex flex-col gap-y-4 py-5">
                <div className="flex justify-between items-center gap-x-6">
                  <div className="flex items-center gap-x-4">
                    <DocumentIcon className="h-12 w-12 flex-none rounded-full bg-gray-50" />
                    <div>
                      <p className="text-sm font-semibold leading-6 text-gray-900">{droneFlight.title}</p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">{droneFlight.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-x-4">
                    <p className="text-sm leading-6 text-gray-900">
                      {droneFlight.measurements.length} {droneFlight.measurements.length === 1 ? 'measurement' : 'measurements'}
                    </p>
                    <button onClick={() => toggleExpand(droneFlight.id)} className="flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900">
                      {expandedFlight === droneFlight.id ? 'Collapse' : 'Expand'}
                      {expandedFlight === droneFlight.id ? (
                        <ChevronUpIcon aria-hidden="true" className="h-5 w-5 flex-none text-gray-400" />
                      ) : (
                        <ChevronDownIcon aria-hidden="true" className="h-5 w-5 flex-none text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                {expandedFlight === droneFlight.id && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-800">Measurement Points</h3>
                    <div className="mt-2 max-h-56 overflow-y-auto bg-gray-100 rounded-md shadow-sm p-4">
                      <div className="grid grid-cols-4 gap-4 text-sm font-semibold text-center text-gray-700">
                        <div>Name</div>
                        <div>Latitude</div>
                        <div>Longitude</div>
                        <div>Temperature</div>
                      </div>
                      {droneFlight.measurements.map((measurement, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-4 gap-4 p-2 bg-white border border-gray-300 shadow-sm rounded-md mt-2"
                        >
                          <div className="text-center">{measurement.name}</div>
                          <div className="text-center">{measurement.latitude}</div>
                          <div className="text-center">{measurement.longitude}</div>
                          <div className="text-center">{measurement.temperature}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        Add measurement
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      );
}