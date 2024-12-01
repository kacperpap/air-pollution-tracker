import { SimulationStatus } from './SimulationStatusType';

export type SimulationType = {
    id: number;
    userId: number;
    droneFlightId?: number | null;
    status: SimulationStatus;
    parameters: Record<string, any>;
    result?: {
        type: string;
        data: number[];
    } | null;
    createdAt: Date;
    updatedAt: Date;
    droneFlight?: {
        title: string;
    } | undefined;
}