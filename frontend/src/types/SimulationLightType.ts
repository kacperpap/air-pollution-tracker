import { SimulationStatus } from './SimulationStatusType';

export type SimulationLightType = {
    id: number;
    userId: number;
    droneFlightId: number;
    status: SimulationStatus;
    parameters: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    droneFlight?: {
        title: string;
    } | undefined;
}