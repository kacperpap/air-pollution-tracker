/*
  Warnings:

  - Added the required column `pressure` to the `DroneMeasurement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `windDirection` to the `DroneMeasurement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `windSpeed` to the `DroneMeasurement` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PollutionType" AS ENUM ('CO', 'O3', 'SO2', 'NO2');

-- AlterTable
ALTER TABLE "DroneMeasurement" ADD COLUMN     "pressure" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "windDirection" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "windSpeed" DOUBLE PRECISION NOT NULL;

-- CreateTable
CREATE TABLE "PollutionMeasurement" (
    "id" SERIAL NOT NULL,
    "type" "PollutionType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "measurementId" INTEGER NOT NULL,

    CONSTRAINT "PollutionMeasurement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PollutionMeasurement" ADD CONSTRAINT "PollutionMeasurement_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "DroneMeasurement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
