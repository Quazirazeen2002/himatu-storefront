-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" UUID NOT NULL,
    "transactionRef" VARCHAR(64) NOT NULL,
    "orderId" UUID,
    "userId" UUID,
    "provider" VARCHAR(32) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'COD',
    "providerTransactionId" VARCHAR(128),
    "providerSessionId" VARCHAR(128),
    "providerReference" VARCHAR(128),
    "amount" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BDT',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "verificationStatus" VARCHAR(32) NOT NULL DEFAULT 'UNVERIFIED',
    "paymentDetails" JSONB,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "eventType" VARCHAR(64) NOT NULL,
    "provider" VARCHAR(32) NOT NULL,
    "providerEventRef" VARCHAR(128),
    "status" VARCHAR(32) NOT NULL,
    "verificationResult" VARCHAR(64),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" UUID NOT NULL,
    "refundRef" VARCHAR(64) NOT NULL,
    "transactionId" UUID NOT NULL,
    "orderId" UUID,
    "amount" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BDT',
    "reason" VARCHAR(500) NOT NULL,
    "providerRefundRef" VARCHAR(128),
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "initiatedBy" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintingRequest" (
    "id" UUID NOT NULL,
    "requestNumber" VARCHAR(50) NOT NULL,
    "userId" UUID,
    "customerName" VARCHAR(120) NOT NULL,
    "customerEmail" VARCHAR(254) NOT NULL,
    "customerPhone" VARCHAR(20) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "animeName" VARCHAR(150) NOT NULL,
    "characterName" VARCHAR(150) NOT NULL,
    "description" TEXT NOT NULL,
    "posePreference" VARCHAR(200),
    "sizePreference" VARCHAR(100),
    "materialPreference" VARCHAR(100),
    "finishPreference" VARCHAR(100),
    "colorPreference" VARCHAR(200),
    "budgetEstimate" INTEGER,
    "deadlineDate" TIMESTAMP(3),
    "customizationDetails" JSONB,
    "status" VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintingReferenceImage" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileType" VARCHAR(100) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "description" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrintingReferenceImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintingQuotation" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "quotationNumber" VARCHAR(50) NOT NULL,
    "baseCost" INTEGER NOT NULL DEFAULT 0,
    "materialCost" INTEGER NOT NULL DEFAULT 0,
    "printingCost" INTEGER NOT NULL DEFAULT 0,
    "finishingCost" INTEGER NOT NULL DEFAULT 0,
    "paintingCost" INTEGER NOT NULL DEFAULT 0,
    "customizationCost" INTEGER NOT NULL DEFAULT 0,
    "shippingCost" INTEGER NOT NULL DEFAULT 0,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BDT',
    "depositPercent" INTEGER NOT NULL DEFAULT 50,
    "depositAmount" INTEGER NOT NULL,
    "productionDays" INTEGER NOT NULL DEFAULT 14,
    "termsAndNotes" TEXT,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdBy" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderId" UUID,

    CONSTRAINT "PrintingQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrintingProduction" (
    "id" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "orderId" UUID,
    "stage" VARCHAR(50) NOT NULL DEFAULT '3D_MODELING',
    "targetCompletionDate" TIMESTAMP(3),
    "actualCompletionDate" TIMESTAMP(3),
    "assignedTechnician" VARCHAR(120),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrintingProduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionUpdate" (
    "id" UUID NOT NULL,
    "productionId" UUID NOT NULL,
    "stage" VARCHAR(50) NOT NULL,
    "customerMessage" TEXT NOT NULL,
    "internalNote" TEXT,
    "progressImageUrl" TEXT,
    "createdBy" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_transactionRef_key" ON "PaymentTransaction"("transactionRef");

-- CreateIndex
CREATE INDEX "PaymentTransaction_orderId_idx" ON "PaymentTransaction"("orderId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_userId_idx" ON "PaymentTransaction"("userId");

-- CreateIndex
CREATE INDEX "PaymentTransaction_provider_status_idx" ON "PaymentTransaction"("provider", "status");

-- CreateIndex
CREATE INDEX "PaymentTransaction_providerTransactionId_idx" ON "PaymentTransaction"("providerTransactionId");

-- CreateIndex
CREATE INDEX "PaymentEvent_transactionId_idx" ON "PaymentEvent"("transactionId");

-- CreateIndex
CREATE INDEX "PaymentEvent_eventType_idx" ON "PaymentEvent"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_refundRef_key" ON "Refund"("refundRef");

-- CreateIndex
CREATE INDEX "Refund_transactionId_idx" ON "Refund"("transactionId");

-- CreateIndex
CREATE INDEX "Refund_orderId_idx" ON "Refund"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PrintingRequest_requestNumber_key" ON "PrintingRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "PrintingRequest_userId_createdAt_idx" ON "PrintingRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PrintingRequest_status_idx" ON "PrintingRequest"("status");

-- CreateIndex
CREATE INDEX "PrintingReferenceImage_requestId_idx" ON "PrintingReferenceImage"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "PrintingQuotation_quotationNumber_key" ON "PrintingQuotation"("quotationNumber");

-- CreateIndex
CREATE INDEX "PrintingQuotation_requestId_idx" ON "PrintingQuotation"("requestId");

-- CreateIndex
CREATE INDEX "PrintingQuotation_status_idx" ON "PrintingQuotation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PrintingProduction_requestId_key" ON "PrintingProduction"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "PrintingProduction_orderId_key" ON "PrintingProduction"("orderId");

-- CreateIndex
CREATE INDEX "PrintingProduction_stage_idx" ON "PrintingProduction"("stage");

-- CreateIndex
CREATE INDEX "ProductionUpdate_productionId_idx" ON "ProductionUpdate"("productionId");

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "PaymentTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "PaymentTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingRequest" ADD CONSTRAINT "PrintingRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingReferenceImage" ADD CONSTRAINT "PrintingReferenceImage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PrintingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingQuotation" ADD CONSTRAINT "PrintingQuotation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PrintingRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingProduction" ADD CONSTRAINT "PrintingProduction_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "PrintingRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrintingProduction" ADD CONSTRAINT "PrintingProduction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionUpdate" ADD CONSTRAINT "ProductionUpdate_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "PrintingProduction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

