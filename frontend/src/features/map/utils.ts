import { PollutantParameter, Range } from './MapTypes'
import * as d3 from 'd3'
import { POLLUTANT_RANGES } from './POLLUTANT_RANGES';
import { DroneMeasurementType } from '../../types/DroneMeasurementType';
import { EnvironmentType, PollutantsType, SimulationResponseType } from '../../types/SimulationResponseType';


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
    
    const pollutantValues = simulationData.pollutants.final_step[selectedParameter] || simulationData.environment[selectedParameter];
    
    if (!Array.isArray(pollutantValues)) return;
    
    rectangles.forEach((rectangle, index) => {
      const value = pollutantValues[index];
      if (value !== undefined) {
        const color = getColorForValue(value, selectedParameter);
        rectangle.setStyle({
          color: color,
          fillColor: color
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

export function generateTooltipContent(
  parameter: string,
  point: DroneMeasurementType | SimulationResponseType | number | null
): string {
  let tooltipContent = '';

  if (point && typeof point === 'object') {
    if ('pollutionMeasurements' in point) {
      if (parameter === 'wind') {
        tooltipContent += `<br><strong>Wind Speed:</strong> ${point.windSpeed ?? 'N/A'} m/s`;
        tooltipContent += `<br><strong>Wind Direction:</strong> ${point.windDirection ?? 'N/A'}°`;
      } else if (parameter in point) {
        const unit = getUnit(parameter as keyof DroneMeasurementType);
        const value = point[parameter as keyof DroneMeasurementType];
        tooltipContent += `<br><strong>${parameter}:</strong> ${value ?? 'N/A'} ${unit}`;
      } else {
        const pollutionMeasurement = point.pollutionMeasurements.find((p) => p.type === parameter);
        if (pollutionMeasurement) {
          tooltipContent += `<br><strong>${parameter}:</strong> ${pollutionMeasurement.value ?? 'N/A'} µg/m³`;
        }
      }
    } 
    else if ('environment' in point || 'pollutants' in point) {
      const value = point.environment?.[parameter as keyof EnvironmentType] || point.pollutants?.[parameter as keyof PollutantsType];
      const unit = getUnit(parameter as keyof SimulationResponseType);
      tooltipContent += `<br><strong>${parameter}:</strong> ${value ?? 'N/A'} ${unit}`;
    }
  } 
  else if (typeof point === 'number') {
    tooltipContent = `<strong>${parameter}:</strong> ${point ?? 'N/A'} µg/m³`;
  } 
  else {
    tooltipContent = `<strong>Value:</strong> N/A`;
  }

  return tooltipContent;
}

