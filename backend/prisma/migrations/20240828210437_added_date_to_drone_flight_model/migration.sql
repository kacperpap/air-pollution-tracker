/*
  Warnings:

  - You are about to drop the column `longtitude` on the `DroneMeasurement` table. All the data in the column will be lost.
  - Added the required column `longitude` to the `DroneMeasurement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DroneFlight" ADD COLUMN     "date" TIMESTAMP(6);

-- AlterTable
ALTER TABLE "DroneMeasurement" DROP COLUMN "longtitude",
ADD COLUMN     "longitude" DOUBLE PRECISION NOT NULL;
