-- AlterTable
ALTER TABLE "SocialOrderRequest" ADD COLUMN     "ownerNoticeAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "ownerNoticeClaimedAt" TIMESTAMP(3),
ADD COLUMN     "ownerNoticeSentAt" TIMESTAMP(3),
ADD COLUMN     "ownerNoticeState" VARCHAR(20) NOT NULL DEFAULT 'NONE';

