CREATE TABLE "BusinessSubscription" (
    "id" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "category" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "frequency" "BillingFrequency" NOT NULL,
    "intervalCount" INTEGER NOT NULL DEFAULT 1,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "nextPaymentDate" TIMESTAMP(3) NOT NULL,
    "renewalDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "reference" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSubscription_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BusinessSubscription_status_nextPaymentDate_idx" ON "BusinessSubscription"("status", "nextPaymentDate");
CREATE INDEX "BusinessSubscription_nextPaymentDate_idx" ON "BusinessSubscription"("nextPaymentDate");
