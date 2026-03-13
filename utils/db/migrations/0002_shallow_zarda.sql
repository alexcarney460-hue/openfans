ALTER TABLE "ppv_purchases" DROP CONSTRAINT "ppv_purchases_post_id_posts_id_fk";
--> statement-breakpoint
ALTER TABLE "ppv_purchases" ALTER COLUMN "post_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users_table" ALTER COLUMN "display_name" SET DATA TYPE varchar(100);--> statement-breakpoint
ALTER TABLE "users_table" ALTER COLUMN "bio" SET DATA TYPE varchar(2000);--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ppv_purchases" ADD CONSTRAINT "ppv_purchases_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_sender_id_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_receiver_id_idx" ON "messages" USING btree ("receiver_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "posts_creator_id_idx" ON "posts" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ppv_purchases_buyer_id_idx" ON "ppv_purchases" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ppv_purchases_post_id_idx" ON "ppv_purchases" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_subscriber_id_idx" ON "subscriptions" USING btree ("subscriber_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_creator_id_idx" ON "subscriptions" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tips_creator_id_idx" ON "tips" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tips_payment_tx_idx" ON "tips" USING btree ("payment_tx");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_transactions_user_id_idx" ON "wallet_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_transactions_wallet_id_idx" ON "wallet_transactions" USING btree ("wallet_id");--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_payment_tx_unique" UNIQUE("payment_tx");--> statement-breakpoint
ALTER TABLE "ppv_purchases" ADD CONSTRAINT "ppv_purchases_payment_tx_unique" UNIQUE("payment_tx");--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_payment_tx_unique" UNIQUE("payment_tx");--> statement-breakpoint
ALTER TABLE "tips" ADD CONSTRAINT "tips_payment_tx_unique" UNIQUE("payment_tx");