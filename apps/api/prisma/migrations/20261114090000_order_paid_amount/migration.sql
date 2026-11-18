ALTER TABLE "Order" ADD COLUMN "paidAmount" INTEGER NOT NULL DEFAULT 0;
UPDATE "Order" SET "paidAmount" = "totalAmount" WHERE "paymentStatus" = 'PAID';
ALTER TABLE "Order" ADD CONSTRAINT "Order_paidAmount_range" CHECK ("paidAmount" >= 0 AND "paidAmount" <= "totalAmount");
