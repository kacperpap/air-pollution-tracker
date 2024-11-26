import { PollutantParameter, Range } from './MapTypes'
import * as d3 from 'd3'
import { POLLUTANT_RANGES } from './POLLUTANT_RANGES';


export const getRangeForParameter = (parameter: string): Range[] => {
  if (parameter in POLLUTANT_RANGES) {
    return POLLUTANT_RANGES[parameter as PollutantParameter];
  }
  return [];
};

export const getColorScale = (parameter: string) => {
  const ranges = getRangeForParameter(parameter);
  if (!ranges.length) return null;

  const colors = [
    '#00ff00', // Good - zielony
    '#ffff00', // Fair - żółty
    '#ffa500', // Moderate - pomarańczowy
    '#ff4500', // Poor - czerwono-pomarańczowy
    '#ff0000'  // Very Poor - czerwony
  ];

  const colorScale = d3.scaleLinear<string>()
    .domain(ranges.map(range => range.min))
    .range(colors.slice(0, ranges.length))
    .interpolate(d3.interpolateRgb.gamma(2.2));

  return colorScale;
};

export const getColorForValue = (value: number, parameter: string): string => {
  const colorScale = getColorScale(parameter);
  if (!colorScale) return '#000000';

  const ranges = getRangeForParameter(parameter);
  const minValue = ranges[0].min;
  const maxValue = ranges[ranges.length - 1].max;

  const clampedValue = Math.max(minValue, Math.min(maxValue, value));
  return colorScale(clampedValue);
};



export const updateRectangleColors = (simulationData: any, selectedParameter: string, rectangles: L.Rectangle[]) => {
    if (!simulationData || !selectedParameter) return;

    rectangles.forEach(rectangle => {
      rectangle.setStyle({
        color: 'transparent',
        fillColor: 'transparent',
        fillOpacity: 0.5
      });
    });
    
    const pollutantValues = simulationData.pollutants.final_step[selectedParameter] || simulationData.environment[selectedParameter];
    
    if (!Array.isArray(pollutantValues)) return;
    
    rectangles.forEach((rectangle, index) => {
      const value = pollutantValues[index];
      if (value !== undefined) {
        const color = getColorForValue(value, selectedParameter);
        rectangle.setStyle({
          color: color,
          fillColor: color,
          fillOpacity: 0.5
        });
      }
    });
};


export const getUnit = (parameter: string) => {
  switch (parameter) {
    case 'temperature': return '°C';
    case 'pressure': return 'Pa';
    case 'wind': return 'm/s';
    default: return 'μg/m³';
  }
};

function formatValue(value: number): string {
  if(value !== undefined){
    if (value % 1 === 0) {
      return value.toFixed(0);
    }
    return value.toFixed(1);
  } else {
    return ""
  }
}

export const generateTooltipContent = (
  parameter: string,
  value: number | [number, number]
): string => {
  if (Array.isArray(value)) {
    if (parameter === 'wind') {
      const [speed, direction] = value;
      return `
        <strong>Wind Speed:</strong> ${speed !== null ? formatValue(speed) : 'No Data'} m/s
        <br><strong>Wind Direction:</strong> ${direction !== null ? formatValue(direction) : 'No Data'}°
      `;
    }
    value = value[0];
  }

  const unit = parameter === 'wind' 
    ? 'm/s' 
    : ['temperature', 'pressure'].includes(parameter)
      ? getUnit(parameter)
      : 'µg/m³';

  return `<strong>${parameter}:</strong> ${value !== null ? formatValue(value) : 'No Data'} ${unit}`;
}


