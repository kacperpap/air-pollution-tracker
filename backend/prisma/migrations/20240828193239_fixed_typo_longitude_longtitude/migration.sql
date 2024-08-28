/*
  Warnings:

  - You are about to drop the column `longitude` on the `DroneMeasurement` table. All the data in the column will be lost.
  - Added the required column `longtitude` to the `DroneMeasurement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DroneMeasurement" DROP COLUMN "longitude",
ADD COLUMN     "longtitude" DOUBLE PRECISION NOT NULL;
