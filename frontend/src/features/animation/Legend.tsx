import { PollutantParameter, Range } from "./MapTypes";
import { POLLUTANT_RANGES } from "./POLLUTANT_RANGES";
import { getColorScale, getUnit } from "./utils";

interface LegendProps {
  parameter: string;
  className?: string
}

export const Legend: React.FC<LegendProps> = ({ parameter, className }) => {
  if (!parameter || !POLLUTANT_RANGES[parameter as PollutantParameter]) return null;

  const ranges = POLLUTANT_RANGES[parameter as PollutantParameter];
  const colorScale = getColorScale(parameter);

  if (!colorScale) return null;

  const createGradient = (min: number, max: number) => {
    const steps = 20;
    const effectiveMin = min === -Infinity ? (max / 10) : min;
    const effectiveMax = max === Infinity ? (min * 10) : max;
    
    const values = Array.from({ length: steps }, (_, i) =>
      effectiveMin + (effectiveMax - effectiveMin) * (i / (steps - 1))
    );
  
    return `linear-gradient(to right, ${values.map(v => colorScale(v)).join(', ')})`;
  };


  return (
    <div className={`bg-white p-4 rounded-lg shadow-md z-20 ${className}`}>
      <h3 className="font-semibold mb-2 text-gray-800">Legend: {parameter} ({getUnit(parameter)})</h3>
      <div className="space-y-2">
        {ranges.map((range: Range, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-6 h-6 rounded"
              style={{
                background: createGradient(range.min, range.max)
              }}
            />
            <span className="text-sm">
              {range.min === -Infinity ? '0' : range.min} - {range.max === Infinity ? '∞' : range.max}
              <span className="ml-2 text-gray-600">({range.label})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};





