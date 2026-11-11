-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MODERATOR';

-- CreateTable
CREATE TABLE "SocialOrderRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "clientReference" UUID NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "customer" JSONB NOT NULL,
    "items" JSONB NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "orderId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialOrderRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderInvoice" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "snapshot" JSONB NOT NULL,
    "reviewedBy" UUID NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sendingAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "messageId" TEXT,

    CONSTRAINT "OrderInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContent" (
    "key" VARCHAR(80) NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialOrderRequest_orderId_key" ON "SocialOrderRequest"("orderId");

-- CreateIndex
CREATE INDEX "SocialOrderRequest_status_createdAt_idx" ON "SocialOrderRequest"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SocialOrderRequest_userId_clientReference_key" ON "SocialOrderRequest"("userId", "clientReference");

-- CreateIndex
CREATE UNIQUE INDEX "OrderInvoice_orderId_key" ON "OrderInvoice"("orderId");

-- AddForeignKey
ALTER TABLE "SocialOrderRequest" ADD CONSTRAINT "SocialOrderRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialOrderRequest" ADD CONSTRAINT "SocialOrderRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderInvoice" ADD CONSTRAINT "OrderInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

