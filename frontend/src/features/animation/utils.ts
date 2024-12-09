import { PollutantParameter, Range } from './MapTypes'
import * as d3 from 'd3'
import { POLLUTANT_RANGES } from './POLLUTANT_RANGES';

const COLOR_PALETTE = [
  '#00ff00',   // Bardzo dobry (jasny zielony)
  '#90EE90',   // Dobry (jasnozielony)
  '#ffff00',   // Zadowalający (żółty)
  '#FFA500',   // Umiarkowany (pomarańczowy)
  '#FF4500',   // Słaby (czerwono-pomarańczowy)
  '#FF0000',   // Zły (czerwony)
  '#8B0000',   // Bardzo zły (ciemnoczerwony)
  '#4B0082'    // Ekstremalnie zły (fioletowy)
];

export const getRangeForParameter = (parameter: string): Range[] => {
  if (parameter in POLLUTANT_RANGES) {
    return POLLUTANT_RANGES[parameter as PollutantParameter];
  }
  return [];
};

export const getColorScale = (parameter: string) => {
  const ranges = getRangeForParameter(parameter);
  if (!ranges.length) return null;

  const fullDomain = ranges.flatMap(range => [range.min, range.max]);
  const uniqueDomain = Array.from(new Set(fullDomain)).sort((a, b) => a - b);

  const safeColorScale = (value: number) => {
    if (value === -Infinity) return COLOR_PALETTE[0];
    if (value === Infinity) return COLOR_PALETTE[COLOR_PALETTE.length - 1];
    
    const colorScale = d3.scaleLinear<string>()
      .domain(uniqueDomain)
      .range(COLOR_PALETTE)
      .interpolate(d3.interpolateHcl);
    
    return colorScale(value);
  };

  return safeColorScale;
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


export const updateRectangleColors = (data: number[], selectedParameter: string, rectangles: L.Rectangle[]) => {
  if (!data) return;

  rectangles.forEach(rectangle => {
    rectangle.setStyle({
      color: 'transparent',
      fillColor: 'transparent',
      fillOpacity: 0.5
    });
  });

  rectangles.forEach((rectangle, index) => {
    const value = data[index];
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
  if (value !== undefined) {
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


