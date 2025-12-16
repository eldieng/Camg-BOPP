/*
  Warnings:

  - The values [CONSULTATION_1,CONSULTATION_2] on the enum `Station` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Station_new" AS ENUM ('ACCUEIL', 'TEST_VUE', 'CONSULTATION', 'LUNETTES');
ALTER TABLE "queue_entries" ALTER COLUMN "station" TYPE "Station_new" USING ("station"::text::"Station_new");
ALTER TYPE "Station" RENAME TO "Station_old";
ALTER TYPE "Station_new" RENAME TO "Station";
DROP TYPE "Station_old";
COMMIT;

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'LUNETTES';

-- AlterTable
ALTER TABLE "queue_entries" ADD COLUMN     "roomNumber" INTEGER;
