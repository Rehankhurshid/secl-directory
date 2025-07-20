import { pgTable, serial, varchar, timestamp, boolean, text, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Example: Employee table
export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  employeeId: varchar('employee_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  department: varchar('department', { length: 100 }),
  designation: varchar('designation', { length: 100 }),
  phoneNumber: varchar('phone_number', { length: 20 }),
  profileImage: text('profile_image'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Example: Department table
export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  managerId: varchar('manager_id', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow()
});

// Example: Message table for messaging system
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  conversationId: varchar('conversation_id', { length: 50 }).notNull(),
  senderId: varchar('sender_id', { length: 50 }).notNull(),
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 20 }).default('text'),
  status: varchar('status', { length: 20 }).default('sent'),
  createdAt: timestamp('created_at').defaultNow()
});

// Relations
export const employeesRelations = relations(employees, ({ many, one }) => ({
  sentMessages: many(messages, { relationName: 'sender' }),
  department: one(departments, {
    fields: [employees.department],
    references: [departments.name]
  })
}));

export const departmentsRelations = relations(departments, ({ many, one }) => ({
  employees: many(employees),
  manager: one(employees, {
    fields: [departments.managerId],
    references: [employees.employeeId]
  })
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(employees, {
    fields: [messages.senderId],
    references: [employees.employeeId],
    relationName: 'sender'
  })
}));

// TypeScript types (inferred from schema)
export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert; 