import { pgTable, serial, varchar, timestamp, boolean, text, integer, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Employee table - Core employee directory data
export const employees = pgTable('employees', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().unique(), // Company ID like "EMP001"
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  department: varchar('department', { length: 100 }).notNull(),
  designation: varchar('designation', { length: 100 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }),
  profileImage: text('profile_image'),
  managerId: uuid('manager_id'), // Self-referencing FK
  location: varchar('location', { length: 100 }),
  grade: varchar('grade', { length: 20 }),
  joinDate: timestamp('join_date'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Department table - Department management
export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  managerId: uuid('manager_id'), // FK to employees
  employeeCount: integer('employee_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Conversations table - Chat conversations (direct & group)
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }), // For group conversations
  type: varchar('type', { length: 20 }).notNull(), // 'direct' | 'group'
  description: text('description'), // For group conversations
  createdBy: uuid('created_by').notNull(), // FK to employees
  isArchived: boolean('is_archived').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastMessageAt: timestamp('last_message_at')
});

// Conversation participants - Many-to-many relationship
export const conversationParticipants = pgTable('conversation_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull(), // FK to conversations
  participantId: uuid('participant_id').notNull(), // FK to employees
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  leftAt: timestamp('left_at'), // For tracking when someone left
  role: varchar('role', { length: 20 }).default('member') // 'admin' | 'member'
});

// Messages table - All messages in conversations
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull(), // FK to conversations
  senderId: uuid('sender_id').notNull(), // FK to employees
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 20 }).default('text').notNull(), // 'text' | 'file' | 'image'
  status: varchar('status', { length: 20 }).default('sent').notNull(), // 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  replyToId: uuid('reply_to_id'), // FK to messages (for replies)
  editedAt: timestamp('edited_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Message attachments - File attachments for messages
export const messageAttachments = pgTable('message_attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').notNull(), // FK to messages
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  url: text('url').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull()
});

// Message delivery status - Track message delivery and read status
export const messageDeliveryStatus = pgTable('message_delivery_status', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').notNull(), // FK to messages
  userId: uuid('user_id').notNull(), // FK to employees
  status: varchar('status', { length: 20 }).notNull(), // 'delivered' | 'read'
  timestamp: timestamp('timestamp').defaultNow().notNull()
});

// User sessions - For authentication and online status
export const userSessions = pgTable('user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // FK to employees
  token: varchar('token', { length: 500 }).notNull().unique(),
  refreshToken: varchar('refresh_token', { length: 500 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastActivity: timestamp('last_activity').defaultNow().notNull(),
  deviceInfo: text('device_info'), // Browser/device information
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Offline actions queue - For PWA offline functionality
export const offlineActions = pgTable('offline_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(), // FK to employees
  actionType: varchar('action_type', { length: 50 }).notNull(), // 'send_message' | 'update_profile' | 'mark_read'
  payload: text('payload').notNull(), // JSON payload
  retryCount: integer('retry_count').default(0).notNull(),
  isProcessed: boolean('is_processed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  processedAt: timestamp('processed_at')
});

// Relations for type-safe joins
export const employeesRelations = relations(employees, ({ many, one }) => ({
  // Self-referencing relations
  manager: one(employees, {
    fields: [employees.managerId],
    references: [employees.id],
    relationName: 'manager'
  }),
  directReports: many(employees, { relationName: 'manager' }),
  
  // Department relation
  department: one(departments, {
    fields: [employees.department],
    references: [departments.name]
  }),
  
  // Messaging relations
  sentMessages: many(messages, { relationName: 'sender' }),
  conversationParticipants: many(conversationParticipants, { relationName: 'participant' }),
  createdConversations: many(conversations, { relationName: 'creator' }),
  
  // Session and status relations
  sessions: many(userSessions, { relationName: 'user' }),
  messageDeliveryStatuses: many(messageDeliveryStatus, { relationName: 'user' }),
  offlineActions: many(offlineActions, { relationName: 'user' })
}));

export const departmentsRelations = relations(departments, ({ many, one }) => ({
  employees: many(employees),
  manager: one(employees, {
    fields: [departments.managerId],
    references: [employees.id],
    relationName: 'departmentManager'
  })
}));

export const conversationsRelations = relations(conversations, ({ many, one }) => ({
  creator: one(employees, {
    fields: [conversations.createdBy],
    references: [employees.id],
    relationName: 'creator'
  }),
  participants: many(conversationParticipants, { relationName: 'conversation' }),
  messages: many(messages, { relationName: 'conversation' })
}));

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationParticipants.conversationId],
    references: [conversations.id],
    relationName: 'conversation'
  }),
  participant: one(employees, {
    fields: [conversationParticipants.participantId],
    references: [employees.id],
    relationName: 'participant'
  })
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
    relationName: 'conversation'
  }),
  sender: one(employees, {
    fields: [messages.senderId],
    references: [employees.id],
    relationName: 'sender'
  }),
  replyTo: one(messages, {
    fields: [messages.replyToId],
    references: [messages.id],
    relationName: 'replyTo'
  }),
  replies: many(messages, { relationName: 'replyTo' }),
  attachments: many(messageAttachments, { relationName: 'message' }),
  deliveryStatuses: many(messageDeliveryStatus, { relationName: 'message' })
}));

export const messageAttachmentsRelations = relations(messageAttachments, ({ one }) => ({
  message: one(messages, {
    fields: [messageAttachments.messageId],
    references: [messages.id],
    relationName: 'message'
  })
}));

export const messageDeliveryStatusRelations = relations(messageDeliveryStatus, ({ one }) => ({
  message: one(messages, {
    fields: [messageDeliveryStatus.messageId],
    references: [messages.id],
    relationName: 'message'
  }),
  user: one(employees, {
    fields: [messageDeliveryStatus.userId],
    references: [employees.id],
    relationName: 'user'
  })
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(employees, {
    fields: [userSessions.userId],
    references: [employees.id],
    relationName: 'user'
  })
}));

export const offlineActionsRelations = relations(offlineActions, ({ one }) => ({
  user: one(employees, {
    fields: [offlineActions.userId],
    references: [employees.id],
    relationName: 'user'
  })
}));

// TypeScript types (inferred from schema)
export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type NewConversationParticipant = typeof conversationParticipants.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type MessageAttachment = typeof messageAttachments.$inferSelect;
export type NewMessageAttachment = typeof messageAttachments.$inferInsert;

export type MessageDeliveryStatus = typeof messageDeliveryStatus.$inferSelect;
export type NewMessageDeliveryStatus = typeof messageDeliveryStatus.$inferInsert;

export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;

export type OfflineAction = typeof offlineActions.$inferSelect;
export type NewOfflineAction = typeof offlineActions.$inferInsert; 