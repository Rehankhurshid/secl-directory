import { Message, MessageStatus } from '../entities/Message';
import { Conversation } from '../entities/Conversation';
import { Employee, EmployeeStatus } from '../entities/Employee';

export interface MessageRepository {
  // Basic CRUD operations
  create(message: Message): Promise<Message>;
  findById(id: string): Promise<Message | null>;
  findByConversationId(conversationId: string, options?: MessageQueryOptions): Promise<Message[]>;
  update(message: Message): Promise<Message>;
  delete(id: string): Promise<boolean>;

  // Status management
  updateStatus(messageId: string, status: MessageStatus): Promise<boolean>;
  markAsRead(messageId: string, userId: string): Promise<boolean>;
  markAsDelivered(messageId: string): Promise<boolean>;

  // Search and filtering
  search(query: string, conversationId?: string): Promise<Message[]>;
  findUnreadMessages(userId: string, conversationId?: string): Promise<Message[]>;

  // Reactions
  addReaction(messageId: string, userId: string, emoji: string): Promise<boolean>;
  removeReaction(messageId: string, userId: string, emoji: string): Promise<boolean>;

  // Bulk operations
  markMultipleAsRead(messageIds: string[], userId: string): Promise<boolean>;
  deleteMultiple(messageIds: string[]): Promise<boolean>;

  // Real-time subscriptions
  subscribeToConversation(conversationId: string, callback: (message: Message) => void): () => void;
  subscribeToMessageUpdates(messageId: string, callback: (message: Message) => void): () => void;
}

export interface MessageQueryOptions {
  limit?: number;
  offset?: number;
  before?: Date;
  after?: Date;
  messageTypes?: string[];
  includedDeleted?: boolean;
  sortOrder?: 'asc' | 'desc';
}

export interface ConversationRepository {
  // Basic CRUD operations
  create(conversation: Conversation): Promise<Conversation>;
  findById(id: string): Promise<Conversation | null>;
  findByUserId(userId: string): Promise<Conversation[]>;
  update(conversation: Conversation): Promise<Conversation>;
  delete(id: string): Promise<boolean>;

  // Member management
  addMember(conversationId: string, employeeId: string, addedBy: string): Promise<boolean>;
  removeMember(conversationId: string, employeeId: string): Promise<boolean>;
  updateMemberRole(conversationId: string, employeeId: string, role: string): Promise<boolean>;

  // Search and filtering
  search(query: string, userId: string): Promise<Conversation[]>;
  findByDepartment(department: string): Promise<Conversation[]>;

  // Real-time subscriptions
  subscribeToUserConversations(userId: string, callback: (conversation: Conversation) => void): () => void;
}

export interface EmployeeRepository {
  findById(empCode: string): Promise<Employee | null>;
  findByDepartment(department: string): Promise<Employee[]>;
  findByLocation(location: string): Promise<Employee[]>;
  search(query: string): Promise<Employee[]>;
  findAll(options?: EmployeeQueryOptions): Promise<Employee[]>;
  updateStatus(empCode: string, status: EmployeeStatus): Promise<boolean>;
  updateLastSeen(empCode: string): Promise<boolean>;
}

export interface EmployeeQueryOptions {
  departments?: string[];
  locations?: string[];
  grades?: string[];
  isActive?: boolean;
  limit?: number;
  offset?: number;
} 