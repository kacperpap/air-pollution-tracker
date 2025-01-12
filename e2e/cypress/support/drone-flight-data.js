import { v4 as uuidv4 } from 'uuid';

export const generateTestFlight = (username) => {
 const unique = uuidv4();
 
 return {
   title: `Test Flight ${unique}`,
   description: `Test for test user ${username}`,
   //date: default
   measurement: {
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
   }
 };
};