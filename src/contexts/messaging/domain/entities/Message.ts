export class Message {
  constructor(
    public readonly id: string,
    public readonly conversationId: string,
    public readonly senderId: string,
    public readonly content: string,
    public readonly type: MessageType,
    public readonly status: MessageStatus,
    public readonly createdAt: Date,
    public readonly editedAt?: Date,
    public readonly deletedAt?: Date,
    public readonly replyTo?: string,
    public readonly reactions?: MessageReaction[],
    public readonly readBy?: ReadReceipt[]
  ) {}

  canBeEditedBy(userId: string): boolean {
    const EDIT_TIME_LIMIT = 15 * 60 * 1000; // 15 minutes
    const timeSinceCreation = Date.now() - this.createdAt.getTime();
    return this.senderId === userId && timeSinceCreation < EDIT_TIME_LIMIT && !this.deletedAt;
  }

  canBeDeletedBy(userId: string): boolean {
    return this.senderId === userId && !this.deletedAt;
  }

  markAsDelivered(): Message {
    return new Message(
      this.id,
      this.conversationId,
      this.senderId,
      this.content,
      this.type,
      MessageStatus.DELIVERED,
      this.createdAt,
      this.editedAt,
      this.deletedAt,
      this.replyTo,
      this.reactions,
      this.readBy
    );
  }

  markAsRead(userId: string): Message {
    const existingReadBy = this.readBy || [];
    const readReceipt: ReadReceipt = {
      userId,
      readAt: new Date()
    };

    return new Message(
      this.id,
      this.conversationId,
      this.senderId,
      this.content,
      this.type,
      MessageStatus.READ,
      this.createdAt,
      this.editedAt,
      this.deletedAt,
      this.replyTo,
      this.reactions,
      [...existingReadBy, readReceipt]
    );
  }

  addReaction(userId: string, emoji: string): Message {
    const existingReactions = this.reactions || [];
    const existingReaction = existingReactions.find(r => r.emoji === emoji);

    if (existingReaction) {
      // Add user to existing reaction
      if (!existingReaction.userIds.includes(userId)) {
        existingReaction.userIds.push(userId);
        existingReaction.count = existingReaction.userIds.length;
      }
    } else {
      // Create new reaction
      existingReactions.push({
        emoji,
        userIds: [userId],
        count: 1
      });
    }

    return new Message(
      this.id,
      this.conversationId,
      this.senderId,
      this.content,
      this.type,
      this.status,
      this.createdAt,
      this.editedAt,
      this.deletedAt,
      this.replyTo,
      existingReactions,
      this.readBy
    );
  }

  isOwnMessage(userId: string): boolean {
    return this.senderId === userId;
  }
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  LOCATION = 'location',
  CONTACT = 'contact'
}

export interface MessageReaction {
  emoji: string;
  userIds: string[];
  count: number;
}

export interface ReadReceipt {
  userId: string;
  readAt: Date;
}