ALTER TABLE "BusinessSubscription"
ADD COLUMN "supportEmail" TEXT,
ADD COLUMN "accountNumber" TEXT,
ADD COLUMN "renewalOwnerUserId" TEXT,
ADD COLUMN "autoNotify" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "reminderDaysBefore" INTEGER[] DEFAULT ARRAY[14, 7, 3]::INTEGER[];

CREATE TABLE "BusinessSubscriptionPayment" (
    "id" TEXT NOT NULL,
    "businessSubscriptionId" TEXT NOT NULL,
    "recordedByUserId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "paidAt" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "method" TEXT,
    "reference" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessSubscriptionPayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BusinessSubscriptionPayment_businessSubscriptionId_paidAt_idx" ON "BusinessSubscriptionPayment"("businessSubscriptionId", "paidAt");

ALTER TABLE "BusinessSubscription"
ADD CONSTRAINT "BusinessSubscription_renewalOwnerUserId_fkey"
FOREIGN KEY ("renewalOwnerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "BusinessSubscriptionPayment"
ADD CONSTRAINT "BusinessSubscriptionPayment_businessSubscriptionId_fkey"
FOREIGN KEY ("businessSubscriptionId") REFERENCES "BusinessSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BusinessSubscriptionPayment"
ADD CONSTRAINT "BusinessSubscriptionPayment_recordedByUserId_fkey"
FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
