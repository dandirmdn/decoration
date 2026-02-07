-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "fraud_status" TEXT,
ADD COLUMN     "payment_type" TEXT,
ADD COLUMN     "transactionStatus" TEXT;
