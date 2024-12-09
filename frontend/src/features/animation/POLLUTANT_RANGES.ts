export const POLLUTANT_RANGES = {
  'SO2': [
    { min: 0, max: 20, label: 'Very Good' },
    { min: 20, max: 40, label: 'Good' },
    { min: 40, max: 70, label: 'Fair' },
    { min: 70, max: 110, label: 'Moderate' },
    { min: 110, max: 160, label: 'Poor' },
    { min: 160, max: 220, label: 'Bad' },
    { min: 220, max: 300, label: 'Very Bad' },
    { min: 300, max: 350, label: 'Extremely Bad' }
  ],
  'NO2': [
    { min: 0, max: 20, label: 'Very Good' },
    { min: 20, max: 50, label: 'Good' },
    { min: 50, max: 80, label: 'Fair' },
    { min: 80, max: 110, label: 'Moderate' },
    { min: 110, max: 140, label: 'Poor' },
    { min: 140, max: 170, label: 'Bad' },
    { min: 170, max: 200, label: 'Very Bad' },
    { min: 200, max: 230, label: 'Extremely Bad' }
  ],
  'O3': [
    { min: 0, max: 30, label: 'Very Good' },
    { min: 30, max: 60, label: 'Good' },
    { min: 60, max: 90, label: 'Fair' },
    { min: 90, max: 120, label: 'Moderate' },
    { min: 120, max: 150, label: 'Poor' },
    { min: 150, max: 180, label: 'Bad' },
    { min: 180, max: 210, label: 'Very Bad' },
    { min: 210, max: 250, label: 'Extremely Bad' }
  ],
  'CO': [
    { min: 0, max: 2200, label: 'Very Good' },
    { min: 2200, max: 3200, label: 'Good' },
    { min: 3200, max: 4400, label: 'Fair' },
    { min: 4400, max: 7000, label: 'Moderate' },
    { min: 7000, max: 9400, label: 'Poor' },
    { min: 9400, max: 11400, label: 'Bad' },
    { min: 11400, max: 15400, label: 'Very Bad' },
    { min: 15400, max: 20000, label: 'Extremely Bad' }
  ],
  'temperature': [
    { min: -30, max: -10, label: 'Extremely Cold' },
    { min: -10, max: 0, label: 'Very Cold' },
    { min: 0, max: 10, label: 'Cold' },
    { min: 10, max: 15, label: 'Cool' },
    { min: 15, max: 20, label: 'Moderate' },
    { min: 20, max: 25, label: 'Warm' },
    { min: 25, max: 30, label: 'Hot' },
    { min: 30, max: 50, label: 'Extremely Hot' }
  ],
  'pressure': [
    { min: 96000, max: 97500, label: 'Extremely Low' },
    { min: 97500, max: 99000, label: 'Very Low' },
    { min: 99000, max: 101000, label: 'Low' },
    { min: 101000, max: 102000, label: 'Normal' },
    { min: 102000, max: 103000, label: 'High' },
    { min: 103000, max: 105000, label: 'Very High' },
    { min: 105000, max: 107500, label: 'Extremely High' },
    { min: 107500, max: 110000, label: 'Critically High' }
  ],
  'wind': [
    { min: 0, max: 0.5, label: 'Calm' },
    { min: 0.5, max: 1.5, label: 'Very Light' },
    { min: 1.5, max: 3, label: 'Light' },
    { min: 3, max: 5, label: 'Moderate' },
    { min: 5, max: 7, label: 'Strong' },
    { min: 7, max: 10, label: 'Very Strong' },
    { min: 10, max: 15, label: 'Powerful' },
    { min: 15, max: 25, label: 'Extreme' }
  ]
};