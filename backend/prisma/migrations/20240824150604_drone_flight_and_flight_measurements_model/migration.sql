/*
  Warnings:

  - You are about to drop the column `createdat` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "createdat",
ADD COLUMN     "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "DroneFlight" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "DroneFlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DroneMeasurement" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "flightId" INTEGER NOT NULL,

    CONSTRAINT "DroneMeasurement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DroneFlight" ADD CONSTRAINT "DroneFlight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DroneMeasurement" ADD CONSTRAINT "DroneMeasurement_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "DroneFlight"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
