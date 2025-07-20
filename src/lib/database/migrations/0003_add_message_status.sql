-- Add status column to conversation_messages
ALTER TABLE conversation_messages 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent';

-- Update existing messages to have 'sent' status
UPDATE conversation_messages 
SET status = 'sent' 
WHERE status IS NULL;