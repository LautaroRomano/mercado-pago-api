-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "paymentMethod" DROP NOT NULL,
ALTER COLUMN "paymentMethod" DROP DEFAULT;
