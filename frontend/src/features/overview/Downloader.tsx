import { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { DroneFlightType } from '../../types/DroneFlightType';
import * as XLSX from 'xlsx';

interface DownloadFlightDataProps {
  droneFlight: DroneFlightType;
}

const generateTXTContent = (droneFlight: DroneFlightType): string => {
  let content = 'metadata;\n';
  const metadataHeaders = ['id', 'title', 'description', 'date'];
  content += metadataHeaders.join(';') + ';\n';
  content += `${droneFlight.id};${droneFlight.title};${droneFlight.description || ''};${droneFlight.date ? new Date(droneFlight.date).toISOString().substring(0,10) : ''};\n\n`;

  content += 'measurements;\n';
  const measurementHeaders = [
    'name', 'latitude', 'longitude', 'temperature', 'pressure', 
    'windSpeed', 'windDirection', 'CO', 'O3', 'SO2', 'NO2'
  ];
  content += measurementHeaders.join(';') + ';\n';

  // Measurement data
  droneFlight.measurements.forEach(measurement => {
    const co = measurement.pollutionMeasurements.find(p => p.type === 'CO')?.value ?? '';
    const o3 = measurement.pollutionMeasurements.find(p => p.type === 'O3')?.value ?? '';
    const so2 = measurement.pollutionMeasurements.find(p => p.type === 'SO2')?.value ?? '';
    const no2 = measurement.pollutionMeasurements.find(p => p.type === 'NO2')?.value ?? '';
    
    const row = [
      measurement.name,
      measurement.latitude ?? '',
      measurement.longitude ?? '',
      measurement.temperature ?? '',
      measurement.pressure ?? '',
      measurement.windSpeed ?? '',
      measurement.windDirection ?? '',
      co,
      o3,
      so2,
      no2
    ];
    content += row.join(';') + ';\n';
  });
  
  return content;
};

const generateXLSXData = (droneFlight: DroneFlightType) => {
  const metadataData = [
    ['Metadata'],
    ['ID', 'Title', 'Description', 'Date'],
    [
      droneFlight.id,
      droneFlight.title,
      droneFlight.description || '',
      droneFlight.date ? new Date(droneFlight.date).toISOString().substring(0,10) : ''
    ]
  ];

  const measurementsHeader = [
    'Name', 'Latitude', 'Longitude', 'Temperature (°C)', 'Pressure (Pa)',
    'Wind Speed (m/s)', 'Wind Direction (°)', 'CO (μg/m3)', 'O3 (μg/m3)',
    'SO2 (μg/m3)', 'NO2 (μg/m3)'
  ];

  const measurementsData = droneFlight.measurements.map(measurement => {
    const co = measurement.pollutionMeasurements.find(p => p.type === 'CO')?.value ?? null;
    const o3 = measurement.pollutionMeasurements.find(p => p.type === 'O3')?.value ?? null;
    const so2 = measurement.pollutionMeasurements.find(p => p.type === 'SO2')?.value ?? null;
    const no2 = measurement.pollutionMeasurements.find(p => p.type === 'NO2')?.value ?? null;
    
    return [
      measurement.name,
      measurement.latitude,
      measurement.longitude,
      measurement.temperature,
      measurement.pressure,
      measurement.windSpeed,
      measurement.windDirection,
      co,
      o3,
      so2,
      no2
    ];
  });

  return {
    metadata: metadataData,
    measurements: [measurementsHeader, ...measurementsData]
  };
};

const DownloadFlightData: React.FC<DownloadFlightDataProps> = ({ droneFlight }) => {
  const [openDialog, setOpenDialog] = useState(false);

  const downloadTXT = () => {
    const content = generateTXTContent(droneFlight);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flight_${droneFlight.id}_data.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    setOpenDialog(false);
  };

  const downloadXLSX = () => {
    const { metadata, measurements } = generateXLSXData(droneFlight);
    const wb = XLSX.utils.book_new();
    
    const wsMetadata = XLSX.utils.aoa_to_sheet(metadata);
    XLSX.utils.book_append_sheet(wb, wsMetadata, 'Metadata');
    
    const wsMeasurements = XLSX.utils.aoa_to_sheet(measurements);
    XLSX.utils.book_append_sheet(wb, wsMeasurements, 'Measurements');
    
    XLSX.writeFile(wb, `flight_${droneFlight.id}_data.xlsx`);
    setOpenDialog(false);
  };

  return (
    <div className="inline-flex">
      <button
        onClick={() => setOpenDialog(true)}
        className="flex h-12 w-12 flex-none items-center justify-center rounded-lg bg-gray-50 hover:bg-white"
      >
        <ArrowDownTrayIcon aria-hidden="true" className="h-6 w-6 text-gray-600 hover:text-indigo-600" />
      </button>

      {openDialog && (
        <Dialog open={true} onClose={() => setOpenDialog(false)} className="relative z-10">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          />
          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <DialogPanel
                transition
                className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
              >
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <DialogTitle as="h3" className="text-base font-semibold leading-6 text-gray-900">
                        Download Flight Data
                      </DialogTitle>
                      <div className="mt-6 flex justify-center gap-4">
                        <button
                          onClick={downloadTXT}
                          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                        >
                          Download as TXT
                        </button>
                        <button
                          onClick={downloadXLSX}
                          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
                        >
                          Download as XLSX
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button
                    type="button"
                    onClick={() => setOpenDialog(false)}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </DialogPanel>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default DownloadFlightData;