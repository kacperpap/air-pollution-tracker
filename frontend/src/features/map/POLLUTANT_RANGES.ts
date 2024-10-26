export const POLLUTANT_RANGES = {
    'SO2': [
      { min: -Infinity, max: 20, label: 'Good' },
      { min: 20, max: 80, label: 'Fair' },
      { min: 80, max: 250, label: 'Moderate' },
      { min: 250, max: 350, label: 'Poor' },
      { min: 350, max: Infinity, label: 'Very Poor' }
    ],
    'NO2': [
      { min: -Infinity, max: 40, label: 'Good' },
      { min: 40, max: 70, label: 'Fair' },
      { min: 70, max: 150, label: 'Moderate' },
      { min: 150, max: 200, label: 'Poor' },
      { min: 200, max: Infinity, label: 'Very Poor' }
    ],
    'O3': [
      { min: -Infinity, max: 60, label: 'Good' },
      { min: 60, max: 100, label: 'Fair' },
      { min: 100, max: 140, label: 'Moderate' },
      { min: 140, max: 180, label: 'Poor' },
      { min: 180, max: Infinity, label: 'Very Poor' }
    ],
    'CO': [
      { min: -Infinity, max: 4400, label: 'Good' },
      { min: 4400, max: 9400, label: 'Fair' },
      { min: 9400, max: 12400, label: 'Moderate' },
      { min: 12400, max: 15400, label: 'Poor' },
      { min: 15400, max: Infinity, label: 'Very Poor' }
    ],
    'temperature': [
      { min: -Infinity, max: 0, label: 'Very Cold' },
      { min: 0, max: 10, label: 'Cold' },
      { min: 10, max: 20, label: 'Moderate' },
      { min: 20, max: 30, label: 'Warm' },
      { min: 30, max: Infinity, label: 'Hot' }
    ],
    'pressure': [
      { min: -Infinity, max: 990, label: 'Very Low' },
      { min: 990, max: 1010, label: 'Low' },
      { min: 1010, max: 1030, label: 'Normal' },
      { min: 1030, max: Infinity, label: 'High' }
    ],
    'wind': [
      { min: -Infinity, max: 2, label: 'Calm' },
      { min: 2, max: 5, label: 'Light' },
      { min: 5, max: 10, label: 'Moderate' },
      { min: 10, max: 15, label: 'Strong' },
      { min: 15, max: Infinity, label: 'Very Strong' }
    ]
};