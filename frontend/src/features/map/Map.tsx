import React, {useEffect} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'


export default function Map() {
    useEffect(() => {
        const map = L.map('map').setView([50.0534, 20.0037], 12);
    
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        return () => {
            map.remove();
        }
      }, []);
    
      return <div id="map" className='absolute inset-0 w-full h-full relative z-10'></div>;    
}
