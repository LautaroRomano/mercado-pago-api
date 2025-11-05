-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "clientEmail" DROP NOT NULL,
ALTER COLUMN "clientName" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Card" (
    "id" SERIAL NOT NULL,
    "cardType" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "cardExpirationDate" TEXT NOT NULL,
    "cardCvv" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Card_cardNumber_key" ON "Card"("cardNumber");
