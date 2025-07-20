-- Phase 2 Messaging Features Migration
-- Add support for reactions, replies, status tracking, file attachments, and edit history

-- Add new fields to messages table for Phase 2 features
ALTER TABLE messages 
ADD COLUMN status VARCHAR(20) DEFAULT 'sent',
ADD COLUMN reply_to_id INTEGER,
ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN edit_count INTEGER DEFAULT 0,
ADD COLUMN has_attachments BOOLEAN DEFAULT false,
ADD COLUMN metadata JSONB DEFAULT '{}';

-- Add foreign key for reply functionality
ALTER TABLE messages 
ADD CONSTRAINT fk_messages_reply_to FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Create indexes for new fields
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_reply_to_id ON messages(reply_to_id);
CREATE INDEX idx_messages_edited_at ON messages(edited_at);
CREATE INDEX idx_messages_deleted_at ON messages(deleted_at);

-- Message reactions table
CREATE TABLE message_reactions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Indexes for reactions
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX idx_message_reactions_emoji ON message_reactions(emoji);

-- Message status tracking table (for delivery/read receipts)
CREATE TABLE message_status_tracking (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'delivered', 'read'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id, status)
);

-- Indexes for status tracking
CREATE INDEX idx_message_status_tracking_message_id ON message_status_tracking(message_id);
CREATE INDEX idx_message_status_tracking_user_id ON message_status_tracking(user_id);
CREATE INDEX idx_message_status_tracking_status ON message_status_tracking(status);

-- File attachments table
CREATE TABLE message_attachments (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- for audio/video files
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for attachments
CREATE INDEX idx_message_attachments_message_id ON message_attachments(message_id);
CREATE INDEX idx_message_attachments_file_type ON message_attachments(file_type);

-- Message edit history table
CREATE TABLE message_edit_history (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    previous_content TEXT NOT NULL,
    edited_by VARCHAR(50) NOT NULL,
    edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for edit history
CREATE INDEX idx_message_edit_history_message_id ON message_edit_history(message_id);
CREATE INDEX idx_message_edit_history_edited_at ON message_edit_history(edited_at);

-- Typing indicators table (temporary storage for real-time typing)
CREATE TABLE typing_indicators (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    is_typing BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Index for typing indicators
CREATE INDEX idx_typing_indicators_group_id ON typing_indicators(group_id);
CREATE INDEX idx_typing_indicators_last_updated ON typing_indicators(last_updated);

-- User presence table
CREATE TABLE user_presence (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'offline', -- 'online', 'offline', 'away'
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_info JSONB DEFAULT '{}'
);

-- Index for user presence
CREATE INDEX idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX idx_user_presence_status ON user_presence(status);
CREATE INDEX idx_user_presence_last_seen ON user_presence(last_seen);

-- Add function to automatically update message status aggregates
CREATE OR REPLACE FUNCTION update_message_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the main message status based on group member statuses
    UPDATE messages 
    SET status = CASE 
        WHEN EXISTS (
            SELECT 1 FROM message_status_tracking mst 
            JOIN group_members gm ON gm.employee_id = mst.user_id 
            WHERE mst.message_id = NEW.message_id 
            AND gm.group_id = (SELECT group_id FROM messages WHERE id = NEW.message_id)
            AND mst.status = 'read'
            AND gm.employee_id != (SELECT sender_id FROM messages WHERE id = NEW.message_id)
        ) THEN 'read'
        WHEN EXISTS (
            SELECT 1 FROM message_status_tracking mst 
            JOIN group_members gm ON gm.employee_id = mst.user_id 
            WHERE mst.message_id = NEW.message_id 
            AND gm.group_id = (SELECT group_id FROM messages WHERE id = NEW.message_id)
            AND mst.status = 'delivered'
            AND gm.employee_id != (SELECT sender_id FROM messages WHERE id = NEW.message_id)
        ) THEN 'delivered'
        ELSE 'sent'
    END
    WHERE id = NEW.message_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic status updates
CREATE TRIGGER trigger_update_message_status
    AFTER INSERT OR UPDATE ON message_status_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_message_status();

-- Add function to clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM typing_indicators 
    WHERE last_updated < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE message_reactions IS 'Stores emoji reactions to messages';
COMMENT ON TABLE message_status_tracking IS 'Tracks delivery and read status for each user';
COMMENT ON TABLE message_attachments IS 'Stores file attachments for messages';
COMMENT ON TABLE message_edit_history IS 'Tracks edit history for messages';
COMMENT ON TABLE typing_indicators IS 'Temporary storage for typing indicators';
COMMENT ON TABLE user_presence IS 'Tracks user online/offline status';

COMMENT ON COLUMN messages.status IS 'Overall message status: sent, delivered, read';
COMMENT ON COLUMN messages.reply_to_id IS 'Reference to the message being replied to';
COMMENT ON COLUMN messages.edited_at IS 'Timestamp of last edit';
COMMENT ON COLUMN messages.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN messages.edit_count IS 'Number of times message was edited';
COMMENT ON COLUMN messages.has_attachments IS 'Quick flag for messages with files';
COMMENT ON COLUMN messages.metadata IS 'Additional message metadata (JSON)'; 