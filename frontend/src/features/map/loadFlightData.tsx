import L from 'leaflet';
import { getDroneFlightById } from '../drone/api/getDroneFlightById';
import { DroneMeasurementType } from '../../types/DroneMeasurementType';
import { NotificationProps } from '../../types/NotificationPropsType';

export const loadFlightData = async (
  flightId: number,
  map: L.Map,
  setNotification: (notification: NotificationProps) => void
) => {
  try {
    const flight = await getDroneFlightById(flightId);
    const validPoints = flight.measurements.filter(
      (point: DroneMeasurementType) => point.latitude !== null && point.longitude !== null
    );

    if (validPoints.length > 0) {
      const bounds = L.latLngBounds(
        validPoints.map((point: DroneMeasurementType) => [point.latitude, point.longitude] as [number, number])
      );
      map.fitBounds(bounds);

      //TRY TO ADD SPLINE LINE BETWEEN MEASUREMENT POINTS

      // if (!map.getPanes().overlayPane.querySelector('svg')) {
      //   L.svg().addTo(map);
      // }

      // const svg = d3.select(map.getPanes().overlayPane).select("svg");
      
      // svg.selectAll(".flight-path").remove();

      // const g = svg.append("g")
      //   .attr("class", "leaflet-zoom-hide flight-path");
      
      // const path = g.append("path")
      //   .attr("class", "drone-path")
      //   .attr("fill", "none")
      //   .attr("stroke", "black")
      //   .attr("stroke-width", 2);

      // const points = g.selectAll("circle")
      //   .data(validPoints)
      //   .enter()
      //   .append("circle")
      //   .attr("r", 3)
      //   .attr("fill", "blue")
      //   .attr("class", "path-point");

      // const updatePath = () => {
      //   const lineGenerator = d3.line<[number, number]>()
      //     .x(d => d[0])
      //     .y(d => d[1])
      //     .curve(d3.curveMonotoneX); 
  
      //   const coordinates = validPoints.map((point: { latitude: number; longitude: number; }) => {
      //     const pos = map.latLngToLayerPoint([point.latitude!, point.longitude!]);
      //     return [pos.x, pos.y] as [number, number];
      //   });
  
      //   const pathData = lineGenerator(coordinates);
      //   if (pathData) {
      //     path.attr("d", pathData);
      //   }
  
      //   points.attr("cx", (d, i) => coordinates[i][0])
      //         .attr("cy", (d, i) => coordinates[i][1]);
      // };
  
      // const reset = () => {
      //   const bounds = map.getBounds();
      //   const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
      //   const bottomRight = map.latLngToLayerPoint(bounds.getSouthEast());
  
      //   svg
      //     .attr("width", bottomRight.x - topLeft.x)
      //     .attr("height", bottomRight.y - topLeft.y)
      //     .style("left", `${topLeft.x}px`)
      //     .style("top", `${topLeft.y}px`);
  
      //   g.attr("transform", `translate(${-topLeft.x},${-topLeft.y})`);
          
      //   updatePath();
      // };
  
      // map.on('zoom', reset);
      // map.on('moveend', reset);
      // map.on('movestart', () => {
      //   svg.style('display', 'none');
      // });
      // map.on('moveend', () => {
      //   svg.style('display', 'block');
      //   reset();
      // });
  
      // reset();

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
      });
    }
  } catch (error) {
    setNotification({
      message: 'Error',
      description: `Failed to fetch flight data: ${error}`,
      type: 'error',
    });
  }
};
