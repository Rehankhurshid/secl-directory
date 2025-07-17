import { pgTable, text, serial, integer, boolean, timestamp, json, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: text("id").primaryKey(),
  employeeId: text("employee_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  designation: text("designation").notNull(),
  department: text("department").notNull(),
  location: text("location").notNull(),
  areaName: text("area_name"),
  unitName: text("unit_name"),
  dateOfBirth: text("date_of_birth"),
  fatherName: text("father_name"),
  phoneNumber: text("phone_number"),
  phoneNumber2: text("phone_number_2"),
  gender: text("gender"),
  presentAddress: text("present_address"),
  permanentAddress: text("permanent_address"),
  bloodGroup: text("blood_group"),
  grade: text("grade"),
  category: text("category"),
  discipline: text("discipline"),
  bankAccNo: text("bank_acc_no"),
  bank: text("bank"),
  aadhaar: text("aadhaar"),
  panNo: text("pan_no"),
  caste: text("caste"),
  religion: text("religion"),
  maritalStatus: text("marital_status"),
  spouseName: text("spouse_name"),
  spouseEmpCode: text("spouse_emp_code"),
  basicSalary: numeric("basic_salary"),
  role: text("role").notNull().default("employee"), // 'employee' or 'admin'
  profileImage: text("profile_image"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationGroups = pgTable("notification_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: text("created_by").notNull(),
  members: text("members").array().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  senderId: text("sender_id").notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const employeesRelations = relations(employees, ({ many }) => ({
  sessions: many(sessions),
  otpCodes: many(otpCodes),
  createdGroups: many(notificationGroups),
  messages: many(messages),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  employee: one(employees, {
    fields: [sessions.employeeId],
    references: [employees.employeeId],
  }),
}));

export const otpCodesRelations = relations(otpCodes, ({ one }) => ({
  employee: one(employees, {
    fields: [otpCodes.employeeId],
    references: [employees.employeeId],
  }),
}));

export const notificationGroupsRelations = relations(notificationGroups, ({ one, many }) => ({
  creator: one(employees, {
    fields: [notificationGroups.createdBy],
    references: [employees.employeeId],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  group: one(notificationGroups, {
    fields: [messages.groupId],
    references: [notificationGroups.id],
  }),
  sender: one(employees, {
    fields: [messages.senderId],
    references: [employees.employeeId],
  }),
}));

// Zod schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertOtpCodeSchema = createInsertSchema(otpCodes).omit({
  id: true,
  createdAt: true,
  isUsed: true,
});

export const insertNotificationGroupSchema = createInsertSchema(notificationGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isActive: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtpCode = z.infer<typeof insertOtpCodeSchema>;
export type NotificationGroup = typeof notificationGroups.$inferSelect;
export type InsertNotificationGroup = z.infer<typeof insertNotificationGroupSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
