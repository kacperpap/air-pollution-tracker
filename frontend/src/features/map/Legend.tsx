import { PollutantParameter, Range } from "./MapTypes";
import { POLLUTANT_RANGES } from "./POLLUTANT_RANGES";
import { getColorScale } from "./utils";

interface LegendProps {
  parameter: string;
}

export const Legend: React.FC<LegendProps> = ({ parameter }) => {
  if (!parameter || !POLLUTANT_RANGES[parameter as PollutantParameter]) return null;

  const ranges = POLLUTANT_RANGES[parameter as PollutantParameter];
  const colorScale = getColorScale(parameter);
  if (!colorScale) return null;

  const createGradient = (min: number, max: number) => {
    const steps = 20;
    const values = Array.from({ length: steps }, (_, i) => 
      min + (max - min) * (i / (steps - 1))
    );
    
    return `linear-gradient(to right, ${
      values.map(v => colorScale(v)).join(', ')
    })`;
  };

  const getUnit = (parameter: string) => {
    switch (parameter) {
      case 'temperature': return '°C';
      case 'pressure': return 'hPa';
      case 'wind': return 'm/s';
      default: return 'μg/m³';
    }
  };

  return (
    <div className="absolute top-10 right-10 bg-white p-4 rounded-lg shadow-md z-20">
      <h3 className="font-semibold mb-2 text-gray-800">Legend: {parameter} ({getUnit(parameter)})</h3>
      <div className="space-y-2">
        {ranges.map((range: Range, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-6 h-6 rounded"
              style={{
                backgroundColor: createGradient(range.min, range.max)
              }}
            />
            <span className="text-sm">
              {range.min === -Infinity ? '-∞' : range.min} - {range.max === Infinity ? '∞' : range.max} 
              <span className="ml-2 text-gray-600">({range.label})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};





