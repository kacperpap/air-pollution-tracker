export const pollutantTypes = ['CO', 'O3', 'SO2', 'NO2'] as const;

export type PollutantType = typeof pollutantTypes[number];
