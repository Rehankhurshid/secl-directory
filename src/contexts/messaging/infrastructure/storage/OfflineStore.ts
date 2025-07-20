import Dexie, { Table } from "dexie";

export interface StoredMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  status: "pending" | "sent" | "delivered" | "read" | "failed";
  createdAt: number;
  syncStatus: "synced" | "pending" | "failed";
  localId?: string;
}

export interface QueuedAction {
  id: string;
  type: "send_message" | "update_status" | "delete_message" | "edit_message";
  payload: any;
  createdAt: number;
  attempts: number;
  lastAttempt?: number;
}

export class OfflineStore extends Dexie {
  messages!: Table<StoredMessage>;
  pendingQueue!: Table<QueuedAction>;

  constructor() {
    super("MessagingOfflineDB");
    
    this.version(2).stores({
      messages: "id, conversationId, [conversationId+createdAt], [conversationId+syncStatus], syncStatus, status",
      pendingQueue: "id, type, createdAt",
    });
  }

  async queueMessage(message: Omit<StoredMessage, "syncStatus">): Promise<void> {
    // Store message locally
    await this.messages.add({
      ...message,
      syncStatus: "pending",
    });

    // Queue action for sync
    await this.pendingQueue.add({
      id: this.generateActionId(),
      type: "send_message",
      payload: message,
      createdAt: Date.now(),
      attempts: 0,
    });
  }

  async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    before?: number
  ): Promise<StoredMessage[]> {
    let query = this.messages
      .where("[conversationId+createdAt]")
      .between(
        [conversationId, 0],
        [conversationId, before || Date.now()]
      );
      
    const messages = await query
      .reverse()
      .limit(limit)
      .toArray();
      
    // Return in chronological order
    return messages.reverse();
  }

  async getPendingActions(): Promise<QueuedAction[]> {
    return await this.pendingQueue
      .where("attempts")
      .below(3) // Max 3 attempts
      .toArray();
  }

  async markActionSynced(actionId: string): Promise<void> {
    await this.pendingQueue.delete(actionId);
  }

  async incrementActionAttempts(actionId: string): Promise<void> {
    const action = await this.pendingQueue.get(actionId);
    if (action) {
      await this.pendingQueue.update(actionId, {
        attempts: action.attempts + 1,
        lastAttempt: Date.now(),
      });
    }
  }

  async updateMessageStatus(messageId: string, status: StoredMessage["status"]): Promise<void> {
    await this.messages.update(messageId, { status });
  }

  async updateMessageSyncStatus(messageId: string, syncStatus: StoredMessage["syncStatus"]): Promise<void> {
    await this.messages.update(messageId, { syncStatus });
  }

  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}