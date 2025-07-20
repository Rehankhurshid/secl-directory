import { pgTable, serial, varchar, timestamp, boolean, text, integer, date, decimal, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Main employees table
export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  
  // Basic Info
  empCode: varchar('emp_code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  fatherName: varchar('father_name', { length: 255 }),
  dob: date('dob'),
  gender: varchar('gender', { length: 1 }), // M/F
  
  // Contact Information
  emailId: varchar('email_id', { length: 255 }),
  phoneNumber1: varchar('phone_1', { length: 20 }),
  phoneNumber2: varchar('phone_2', { length: 20 }),
  permanentAddress: text('permanent_address'),
  presentAddress: text('present_address'),
  
  // Employment Details
  designation: varchar('designation', { length: 100 }),
  category: varchar('category', { length: 50 }), // DAILY RATED, MONTHLY RATED
  grade: varchar('grade', { length: 20 }),
  discipline: varchar('discipline', { length: 50 }),
  dateOfAppointment: date('dt_appt'),
  areaJoiningDate: date('area_joining_date'),
  gradeJoiningDate: date('grade_joining_date'),
  incrementDate: date('incr_date'),
  expectedExitDate: date('expected_exit_date'),
  companyPostingDate: date('company_posting_date'),
  
  // Organizational Structure
  areaName: varchar('area_name', { length: 100 }),
  unitCode: varchar('unit_code', { length: 10 }),
  unitName: varchar('unit_name', { length: 100 }),
  deptCode: varchar('dept_code', { length: 10 }),
  department: varchar('dept', { length: 100 }),
  subDepartment: varchar('sub_dept', { length: 100 }),
  
  // Personal Information
  bloodGroup: varchar('blood_group', { length: 5 }),
  casteCode: varchar('caste_code', { length: 10 }),
  religionCode: varchar('religion_code', { length: 10 }),
  maritalStatusCode: varchar('marital_status_code', { length: 10 }),
  spouseName: varchar('spouse_name', { length: 255 }),
  spouseEmpCode: varchar('spouse_emp_code', { length: 50 }),
  
  // Financial Information (encrypted/hashed in production)
  bankAccountNo: varchar('bank_acc_no', { length: 50 }),
  bankName: varchar('bank', { length: 100 }),
  basicSalary: decimal('basic_salary', { precision: 10, scale: 2 }),
  hra: decimal('hra', { precision: 10, scale: 2 }),
  ncwaBasic: decimal('ncwa_basic', { precision: 10, scale: 2 }),
  
  // Identity Documents (encrypted in production)
  aadhaarNo: varchar('aadhaar_no', { length: 20 }),
  panNo: varchar('pan_no', { length: 15 }),
  
  // System Fields
  isActive: boolean('is_active').default(true),
  payFlag: varchar('pay_flag', { length: 1 }).default('Y'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  // Indexes for performance
  empCodeIdx: index('emp_code_idx').on(table.empCode),
  nameIdx: index('name_idx').on(table.name),
  departmentIdx: index('department_idx').on(table.department),
  designationIdx: index('designation_idx').on(table.designation),
  areaIdx: index('area_idx').on(table.areaName),
  emailIdx: index('email_idx').on(table.emailId),
  // Full-text search index (will be added via SQL)
  searchIdx: index('search_idx').on(table.name, table.empCode, table.designation),
}));

// Departments reference table
export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  deptCode: varchar('dept_code', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  parentDeptId: integer('parent_dept_id'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Areas/Units reference table
export const areas = pgTable('areas', {
  id: serial('id').primaryKey(),
  unitCode: varchar('unit_code', { length: 10 }).notNull().unique(),
  areaName: varchar('area_name', { length: 100 }).notNull(),
  unitName: varchar('unit_name', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Designations reference table
export const designations = pgTable('designations', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 100 }).notNull().unique(),
  grade: varchar('grade', { length: 20 }),
  category: varchar('category', { length: 50 }),
  discipline: varchar('discipline', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Employee audit log for tracking changes
export const employeeAuditLog = pgTable('employee_audit_log', {
  id: serial('id').primaryKey(),
  employeeId: integer('employee_id').notNull().references(() => employees.id),
  action: varchar('action', { length: 20 }).notNull(), // INSERT, UPDATE, DELETE
  changedFields: text('changed_fields'), // JSON string of changed fields
  oldValues: text('old_values'), // JSON string of old values
  newValues: text('new_values'), // JSON string of new values
  changedBy: varchar('changed_by', { length: 50 }),
  changedAt: timestamp('changed_at').defaultNow(),
});

// Relations
export const employeesRelations = relations(employees, ({ one }) => ({
  department: one(departments, {
    fields: [employees.deptCode],
    references: [departments.deptCode]
  }),
  area: one(areas, {
    fields: [employees.unitCode],
    references: [areas.unitCode]
  }),
  designation: one(designations, {
    fields: [employees.designation],
    references: [designations.title]
  }),
}));

export const departmentsRelations = relations(departments, ({ many, one }) => ({
  employees: many(employees),
  parentDepartment: one(departments, {
    fields: [departments.parentDeptId],
    references: [departments.id],
    relationName: 'parentDept'
  }),
  childDepartments: many(departments, {
    relationName: 'parentDept'
  }),
}));

export const areasRelations = relations(areas, ({ many }) => ({
  employees: many(employees),
}));

export const designationsRelations = relations(designations, ({ many }) => ({
  employees: many(employees),
}));

// TypeScript types
export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

export type Department = typeof departments.$inferSelect;
export type NewDepartment = typeof departments.$inferInsert;

export type Area = typeof areas.$inferSelect;
export type NewArea = typeof areas.$inferInsert;

export type Designation = typeof designations.$inferSelect;
export type NewDesignation = typeof designations.$inferInsert;

export type EmployeeAuditLog = typeof employeeAuditLog.$inferSelect;
export type NewEmployeeAuditLog = typeof employeeAuditLog.$inferInsert;

// Search result type for directory listing
export type EmployeeSearchResult = {
  id: number;
  empCode: string;
  name: string;
  designation: string;
  department: string;
  areaName: string;
  emailId: string | null;
  phoneNumber1: string | null;
  isActive: boolean;
};

// Detailed employee profile type (excludes sensitive financial data)
export type EmployeeProfile = Omit<Employee, 'bankAccountNo' | 'basicSalary' | 'hra' | 'ncwaBasic' | 'aadhaarNo' | 'panNo'>;

// Authentication tables

// OTP Verifications table
export const otp_verifications = pgTable('otp_verifications', {
  id: serial('id').primaryKey(),
  employee_id: varchar('employee_id', { length: 50 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  otp_code: varchar('otp_code', { length: 6 }).notNull(),
  session_id: varchar('session_id', { length: 32 }).notNull().unique(),
  expires_at: timestamp('expires_at').notNull(),
  verified: boolean('verified').default(false),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => ({
  sessionIdIdx: index('session_id_idx').on(table.session_id),
  employeeIdIdx: index('employee_id_idx').on(table.employee_id),
}));

// Authentication Sessions table
export const auth_sessions = pgTable('auth_sessions', {
  id: serial('id').primaryKey(),
  employee_id: varchar('employee_id', { length: 50 }).notNull(),
  session_token: varchar('session_token', { length: 64 }).notNull().unique(),
  device_info: text('device_info'), // JSON string of device info
  expires_at: timestamp('expires_at').notNull(),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => ({
  sessionTokenIdx: index('session_token_idx').on(table.session_token),
  employeeIdIdx: index('auth_employee_id_idx').on(table.employee_id),
  expiresAtIdx: index('expires_at_idx').on(table.expires_at),
}));

// Biometric Credentials table (for future implementation)
export const biometric_credentials = pgTable('biometric_credentials', {
  id: serial('id').primaryKey(),
  employee_id: varchar('employee_id', { length: 50 }).notNull(),
  credential_id: varchar('credential_id', { length: 255 }).notNull().unique(),
  public_key: text('public_key').notNull(),
  device_name: varchar('device_name', { length: 100 }),
  created_at: timestamp('created_at').defaultNow(),
}, (table) => ({
  employeeIdIdx: index('bio_employee_id_idx').on(table.employee_id),
  credentialIdIdx: index('credential_id_idx').on(table.credential_id),
}));

// TypeScript types for authentication
export type OtpVerification = typeof otp_verifications.$inferSelect;
export type NewOtpVerification = typeof otp_verifications.$inferInsert;

export type AuthSession = typeof auth_sessions.$inferSelect;
export type NewAuthSession = typeof auth_sessions.$inferInsert;

export type BiometricCredential = typeof biometric_credentials.$inferSelect;
export type NewBiometricCredential = typeof biometric_credentials.$inferInsert;

// Messaging tables

// Groups table for chat rooms
export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  createdBy: varchar('created_by', { length: 50 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  createdByIdx: index('groups_created_by_idx').on(table.createdBy),
}));

// Group members table
export const groupMembers = pgTable('group_members', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  employeeId: varchar('employee_id', { length: 50 }).notNull(),
  role: varchar('role', { length: 50 }).default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  groupIdIdx: index('group_members_group_id_idx').on(table.groupId),
  employeeIdIdx: index('group_members_employee_id_idx').on(table.employeeId),
}));

// Messages table (enhanced for Phase 2)
export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  groupId: integer('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  senderId: varchar('sender_id', { length: 50 }).notNull(),
  content: text('content').notNull(),
  messageType: varchar('message_type', { length: 50 }).default('text'),
  status: varchar('status', { length: 20 }).default('sent'),
  replyToId: integer('reply_to_id').references(() => messages.id, { onDelete: 'set null' }),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  editCount: integer('edit_count').default(0),
  hasAttachments: boolean('has_attachments').default(false),
  metadata: text('metadata').default('{}'), // JSON string
  readBy: text('read_by').array().default([]), // Legacy field for backward compatibility
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  groupIdIdx: index('messages_group_id_idx').on(table.groupId),
  createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
  groupIdCreatedAtIdx: index('messages_group_id_created_at_idx').on(table.groupId, table.createdAt),
  statusIdx: index('messages_status_idx').on(table.status),
  replyToIdIdx: index('messages_reply_to_id_idx').on(table.replyToId),
  editedAtIdx: index('messages_edited_at_idx').on(table.editedAt),
  deletedAtIdx: index('messages_deleted_at_idx').on(table.deletedAt),
}));

// Push subscriptions table (for PWA notifications)
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: serial('id').primaryKey(),
  employee_id: varchar('employee_id', { length: 50 }).notNull(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  platform: varchar('platform', { length: 20 }).default('web'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  employeeIdIdx: index('push_subscriptions_employee_id_idx').on(table.employee_id),
}));

// TypeScript types for messaging
export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;

export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;

// Relations for messaging
export const groupsRelations = relations(groups, ({ many }) => ({
  members: many(groupMembers),
  messages: many(messages),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  group: one(groups, {
    fields: [messages.groupId],
    references: [groups.id],
  }),
})); 