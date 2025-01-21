import { v4 as uuidv4 } from 'uuid';

export const generateTestFlight = (username) => {
 const unique = uuidv4();
 
 return {
   title: `Test Flight ${unique}`,
   description: `Test for test user ${username}`,
   //date: default
   measurements: [
    {
      name: 'Point 1',
      latitude: '52.2297',
      longitude: '21.0122',
      temperature: '22.5',
      pressure: '101325', 
      windSpeed: '5.5',
      windDirection: '180',
      pollutants: {
        CO: '500',
        O3: '120',
        SO2: '20',
        NO2: '40'
      }
    },
    {
      name: 'Point 2',
      latitude: '52.2361',
      longitude: '21.0212',
      temperature: '22.3',
      pressure: '101323', 
      windSpeed: '5.7',
      windDirection: '173',
      pollutants: {
        CO: '512',
        O3: '141',
        SO2: '23',
        NO2: '41'
      }
    }
   ]
 };
};