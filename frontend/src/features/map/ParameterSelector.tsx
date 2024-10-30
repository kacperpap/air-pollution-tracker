interface ParameterSelectorProps {
    parameters: string[];
    selectedParameter: string;
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}
  
export const ParameterSelector: React.FC<ParameterSelectorProps> = ({ parameters, selectedParameter, onChange }) => {
  if (!parameters || parameters.length === 0) return null;
  
  return (
    <div className="absolute bottom-10 right-10 bg-white p-4 rounded-lg shadow-md z-20">
      <label htmlFor="parameter-select" className="block text-sm font-medium text-gray-700 mb-2">
        Select parameter to display
      </label>
      <select
        id="parameter-select"
        value={selectedParameter}
        onChange={onChange}
        className="block w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {parameters.map((param: string) => (
          <option key={param} value={param}>
            {param}
          </option>
        ))}
      </select>
    </div>
  );
};
  