-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" UUID NOT NULL,
    "eventName" VARCHAR(100) NOT NULL,
    "sessionId" VARCHAR(128) NOT NULL,
    "userId" UUID,
    "productId" UUID,
    "categoryId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsInsight" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "summary" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "recommendedAction" TEXT NOT NULL,
    "destination" VARCHAR(200) NOT NULL,
    "source" VARCHAR(50) NOT NULL DEFAULT 'rule-based',
    "confidence" VARCHAR(20) NOT NULL DEFAULT 'high',
    "reportingPeriod" VARCHAR(50) NOT NULL DEFAULT 'last_30_days',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_eventName_createdAt_idx" ON "AnalyticsEvent"("eventName", "createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_productId_idx" ON "AnalyticsEvent"("productId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_categoryId_idx" ON "AnalyticsEvent"("categoryId");

-- CreateIndex
CREATE INDEX "AnalyticsInsight_category_createdAt_idx" ON "AnalyticsInsight"("category", "createdAt");

