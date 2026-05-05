-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('pending', 'sending', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "EmailEventType" AS ENUM ('welcome', 'watchlist_milestone', 'weekly_digest', 'password_reset');

-- CreateTable
CREATE TABLE "email_notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" "EmailEventType" NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'pending',
    "idempotency_key" TEXT NOT NULL,
    "template_data" JSONB NOT NULL,
    "resend_id" TEXT,
    "last_error" TEXT,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_notifications_idempotency_key_key" ON "email_notifications"("idempotency_key");

-- CreateIndex
CREATE INDEX "email_notifications_status_created_at_idx" ON "email_notifications"("status", "created_at");

-- AddForeignKey
ALTER TABLE "email_notifications" ADD CONSTRAINT "email_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
