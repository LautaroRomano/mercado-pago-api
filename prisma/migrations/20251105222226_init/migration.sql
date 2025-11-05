/*
  Warnings:

  - You are about to drop the column `ClientName` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `clientName` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "ClientName",
ADD COLUMN     "clientName" TEXT NOT NULL;
