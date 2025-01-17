import { useState, useRef } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import * as XLSX from 'xlsx';
import { DroneFlightFormType } from "../../types/DroneFlightFormType"
import { DroneMeasurementType } from "../../types/DroneMeasurementType"

interface ImportFlightDataProps {
  onImport: (data: DroneFlightFormType) => void;
  onError: (message: string) => void;
}

const ImportFlightData: React.FC<ImportFlightDataProps> = ({ onImport, onError }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseXLSX = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      const metadataSheet = workbook.Sheets['Metadata'];
      if (!metadataSheet) throw new Error('Metadata sheet not found');
      
      const metadata = XLSX.utils.sheet_to_json<any>(metadataSheet, { header: 1 });
      if (metadata.length < 3) throw new Error('Invalid metadata format');
      
      const measurementsSheet = workbook.Sheets['Measurements'];
      if (!measurementsSheet) throw new Error('Measurements sheet not found');
      
      const measurementsData = XLSX.utils.sheet_to_json<any>(measurementsSheet);
      
      const measurements: DroneMeasurementType[] = measurementsData.map(row => ({
        name: row['Name'] || '',
        latitude: row['Latitude'] !== undefined ? Number(row['Latitude']) : null,
        longitude: row['Longitude'] !== undefined ? Number(row['Longitude']) : null,
        temperature: row['Temperature (°C)'] !== undefined ? Number(row['Temperature (°C)']) : null,
        pressure: row['Pressure (Pa)'] !== undefined ? Number(row['Pressure (Pa)']) : null,
        windSpeed: row['Wind Speed (m/s)'] !== undefined ? Number(row['Wind Speed (m/s)']) : null,
        windDirection: row['Wind Direction (°)'] !== undefined ? Number(row['Wind Direction (°)']) : null,
        pollutionMeasurements: [
          { type: 'CO', value: row['CO (μg/m3)'] !== undefined ? Number(row['CO (μg/m3)']) : null },
          { type: 'O3', value: row['O3 (μg/m3)'] !== undefined ? Number(row['O3 (μg/m3)']) : null },
          { type: 'SO2', value: row['SO2 (μg/m3)'] !== undefined ? Number(row['SO2 (μg/m3)']) : null },
          { type: 'NO2', value: row['NO2 (μg/m3)'] !== undefined ? Number(row['NO2 (μg/m3)']) : null }
        ]
      }));

      const formData: DroneFlightFormType = {
        title: metadata[2][1] || '',
        description: metadata[2][2] || '',
        date: metadata[2][3] ? new Date(metadata[2][3]) : new Date(),
        measurements
      };

      return formData;
    } catch (error) {
      throw new Error(`Failed to parse XLSX file: ${error}`);
    }
  };

  const parseTXT = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim());
    
      let currentSection = '';
      let metadata = {
        headers: [] as string[],
        values: [] as string[]
      };
      let measurements: DroneMeasurementType[] = [];
      let headers: string[] = [];
  
      for (let line of lines) {
        if (!line) continue;
    
        if (line.endsWith(';')) {
          line = line.slice(0, -1);
        }
  
        if (line.toLowerCase() === 'metadata') {
          currentSection = 'metadata';
          continue;
        } else if (line.toLowerCase() === 'measurements') {
          currentSection = 'measurements';
          continue;
        }
  
        const values = line.split(';').filter(val => val !== '');
  
        if (currentSection === 'metadata') {
          if (metadata.headers.length === 0) {
            metadata.headers = values;
          } else if (values.length > 0) {
            metadata.values = values;
          }
        } else if (currentSection === 'measurements') {
          if (headers.length === 0) {
            headers = values;
          } else if (values.length > 0) {
            const measurement: DroneMeasurementType = {
              name: values[0] || '',
              latitude: values[1] ? Number(values[1]) : null,
              longitude: values[2] ? Number(values[2]) : null,
              temperature: values[3] ? Number(values[3]) : null,
              pressure: values[4] ? Number(values[4]) : null,
              windSpeed: values[5] ? Number(values[5]) : null,
              windDirection: values[6] ? Number(values[6]) : null,
              pollutionMeasurements: [
                { type: 'CO', value: values[7] ? Number(values[7]) : null },
                { type: 'O3', value: values[8] ? Number(values[8]) : null },
                { type: 'SO2', value: values[9] ? Number(values[9]) : null },
                { type: 'NO2', value: values[10] ? Number(values[10]) : null }
              ]
            };
            measurements.push(measurement);
          }
        }
      }
    
      if (metadata.headers.length === 0) {
        throw new Error('No metadata headers found. Please check the file formatting.');
      }
  
      const lowerCaseHeaders = metadata.headers.map(h => h.toLowerCase());
      const titleIndex = lowerCaseHeaders.findIndex(h => h === 'title');
      const descriptionIndex = lowerCaseHeaders.findIndex(h => h === 'description');
      const dateIndex = lowerCaseHeaders.findIndex(h => h === 'date');
  
      if (titleIndex === -1) {
        throw new Error(
          `Required metadata field (title) not found in headers: ${JSON.stringify(metadata.headers)}`
        );
      }
  
      const formData: DroneFlightFormType = {
        title: metadata.values[titleIndex] || 'Unnamed Flight',
        description: descriptionIndex !== -1 ? metadata.values[descriptionIndex] || '' : '',
        date: dateIndex !== -1 && metadata.values[dateIndex] ? new Date(metadata.values[dateIndex]) : new Date(),
        measurements
      };
  
      if (measurements.length === 0) {
        throw new Error('No measurements found in the file');
      }
  
      return formData;
    } catch (error) {
      throw new Error(`Failed to parse TXT file: ${error}`);
    }
  };
  

  const handleFileSelect = async (file: File) => {
    try {
      let formData: DroneFlightFormType;

      if (file.name.endsWith('.xlsx')) {
        formData = await parseXLSX(file);
      } else if (file.name.endsWith('.txt')) {
        formData = await parseTXT(file);
      } else {
        throw new Error('Unsupported file format');
      }

      onImport(formData);
      setOpenDialog(false);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to import file');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const triggerFileInput = (type: 'xlsx' | 'txt') => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'xlsx' ? '.xlsx' : '.txt';
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpenDialog(true)}
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
      >
        <ArrowUpTrayIcon className="h-5 w-5 inline-block mr-1" />
        Import Data
      </button>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

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
                        Import Flight Data
                      </DialogTitle>
                      <div className="mt-6 flex justify-center gap-4">
                        <button
                          onClick={() => triggerFileInput('txt')}
                          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                        >
                          Import from TXT
                        </button>
                        <button
                          onClick={() => triggerFileInput('xlsx')}
                          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
                        >
                          Import from XLSX
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
    </>
  );
};

export default ImportFlightData;