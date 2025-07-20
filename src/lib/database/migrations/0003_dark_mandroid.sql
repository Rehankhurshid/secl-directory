DROP TABLE "conversation_messages";--> statement-breakpoint
DROP TABLE "conversation_participants";--> statement-breakpoint
DROP TABLE "conversations";--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "status" varchar(20) DEFAULT 'sent';--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "reply_to_id" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "edited_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "edit_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "has_attachments" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "metadata" text DEFAULT '{}';--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_id_messages_id_fk" FOREIGN KEY ("reply_to_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_status_idx" ON "messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_reply_to_id_idx" ON "messages" USING btree ("reply_to_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_edited_at_idx" ON "messages" USING btree ("edited_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_deleted_at_idx" ON "messages" USING btree ("deleted_at");