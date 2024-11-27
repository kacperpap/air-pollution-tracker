-- CreateEnum
CREATE TYPE "SimulationStatus" AS ENUM ('pending', 'completed', 'failed', 'timeExceeded');

-- CreateTable
CREATE TABLE "Simulation" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "droneFlightId" INTEGER,
    "status" "SimulationStatus" NOT NULL DEFAULT 'pending',
    "parameters" JSONB NOT NULL,
    "result" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Simulation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Simulation" ADD CONSTRAINT "Simulation_droneFlightId_fkey" FOREIGN KEY ("droneFlightId") REFERENCES "DroneFlight"("id") ON DELETE SET NULL ON UPDATE CASCADE;
