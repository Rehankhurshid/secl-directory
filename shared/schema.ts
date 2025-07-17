import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  name: text("name").notNull(),
  designation: text("designation").notNull(),
  department: text("department").notNull(),
  email: text("email"),
  location: text("location").notNull(),
  areaName: text("area_name").notNull(),
  unitName: text("unit_name").notNull(),
  dob: text("dob"),
  fatherName: text("father_name"),
  category: text("category"),
  grade: text("grade"),
  discipline: text("discipline"),
  bankAccNo: text("bank_acc_no"),
  bank: text("bank"),
  deptCode: text("dept_code"),
  subDept: text("sub_dept"),
  phone1: text("phno_1"),
  phone2: text("phno_2"),
  gender: text("gender"),
  presentAddress: text("present_address"),
  permanentAddress: text("permanent_address"),
  spouseName: text("spouse_name"),
  bloodGroup: text("blood_group"),
  profileImage: text("profile_image"),
  role: text("role").notNull().default("employee"), // 'employee' or 'admin'
  createdAt: timestamp("created_at").defaultNow(),
});

// Permissions system tables
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  category: text("category").notNull(), // 'employee', 'admin', 'system', 'messaging'
  createdAt: timestamp("created_at").defaultNow(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  isSystem: boolean("is_system").default(false), // System roles can't be deleted
  createdAt: timestamp("created_at").defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull(),
  permissionId: integer("permission_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  roleId: integer("role_id").notNull(),
  assignedBy: text("assigned_by").notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// Authentication tables
export const authSessions = pgTable("auth_sessions", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const otpVerifications = pgTable("otp_verifications", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  phone: text("phone").notNull(),
  otpCode: text("otp_code").notNull(),
  sessionId: text("session_id").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group messaging tables
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  employeeId: text("employee_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  senderId: text("sender_id").notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"),
  readBy: text("read_by").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Push notification subscriptions
export const pushSubscriptions = pgTable("push_subscriptions", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  endpoint: text("endpoint").notNull().unique(), // FCM token will be stored here
  subscriptionType: text("subscription_type").notNull().default("fcm"), // "fcm" or "webpush"
  p256dh: text("p256dh"), // Optional for backward compatibility
  auth: text("auth"), // Optional for backward compatibility
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const selectEmployeeSchema = createInsertSchema(employees).pick({
  id: true,
  employeeId: true,
  name: true,
  designation: true,
  department: true,
  email: true,
  location: true,
  areaName: true,
  unitName: true,
  dob: true,
  fatherName: true,
  category: true,
  grade: true,
  discipline: true,
  bankAccNo: true,
  bank: true,
  deptCode: true,
  subDept: true,
  phone1: true,
  phone2: true,
  gender: true,
  presentAddress: true,
  permanentAddress: true,
  spouseName: true,
  bloodGroup: true,
});

export const employeeSearchSchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
  grade: z.string().optional(),
  category: z.string().optional(),
  gender: z.string().optional(),
  bloodGroup: z.string().optional(),
  sortBy: z.enum(["name", "department", "designation", "employeeId"]).optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});

// Authentication schemas
export const loginRequestSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
});

export const verifyOtpSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  otpCode: z.string().length(6, "OTP must be 6 digits"),
});

export const updateProfileImageSchema = z.object({
  profileImage: z.string().min(1, "Profile image is required").refine(
    (value) => {
      // Accept both URLs and data URLs
      return value.startsWith('http') || value.startsWith('https') || value.startsWith('data:image/');
    },
    {
      message: "Profile image must be a valid URL or data URL"
    }
  ),
});

// Group messaging schemas
export const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  memberIds: z.array(z.string()).min(1, "At least one member is required"),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message content is required"),
  messageType: z.enum(["text", "image", "file"]).default("text"),
});

export const subscribeNotificationSchema = z.object({
  token: z.string().min(1, "FCM token is required"),
  type: z.enum(["fcm"]).default("fcm"),
});



// Admin schemas
export const updateEmployeeSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  designation: z.string().min(1, "Designation is required").optional(),
  department: z.string().min(1, "Department is required").optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  location: z.string().min(1, "Location is required").optional(),
  areaName: z.string().min(1, "Area name is required").optional(),
  unitName: z.string().min(1, "Unit name is required").optional(),
  dob: z.string().optional().or(z.literal("")).or(z.null()),
  fatherName: z.string().optional().or(z.literal("")).or(z.null()),
  category: z.string().optional().or(z.literal("")).or(z.null()),
  grade: z.string().optional().or(z.literal("")).or(z.null()),
  discipline: z.string().optional().or(z.literal("")).or(z.null()),
  bankAccNo: z.string().optional().or(z.literal("")).or(z.null()),
  bank: z.string().optional().or(z.literal("")).or(z.null()),
  deptCode: z.string().optional().or(z.literal("")).or(z.null()),
  subDept: z.string().optional().or(z.literal("")).or(z.null()),
  phone1: z.string().optional().or(z.literal("")).or(z.null()),
  phone2: z.string().optional().or(z.literal("")).or(z.null()),
  gender: z.enum(["M", "F", "O"]).optional().or(z.null()),
  presentAddress: z.string().optional().or(z.literal("")).or(z.null()),
  permanentAddress: z.string().optional().or(z.literal("")).or(z.null()),
  spouseName: z.string().optional().or(z.literal("")).or(z.null()),
  bloodGroup: z.string().optional().or(z.literal("")).or(z.null()),
  profileImage: z.string().optional().or(z.literal("")).or(z.null()),
  role: z.enum(["employee", "admin"]).optional(),
});

export const adminStatsSchema = z.object({
  totalEmployees: z.number(),
  totalAdmins: z.number(),
  totalGroups: z.number(),
  totalMessages: z.number(),
  recentLogins: z.number(),
  departmentStats: z.array(z.object({
    department: z.string(),
    count: z.number(),
  })),
  locationStats: z.array(z.object({
    location: z.string(),
    count: z.number(),
  })),
  gradeStats: z.array(z.object({
    grade: z.string(),
    count: z.number(),
  })),
});

// Permission schemas
export const createPermissionSchema = z.object({
  name: z.string().min(1, "Permission name is required"),
  description: z.string().optional(),
  category: z.enum(["employee", "admin", "system", "messaging"]),
});

export const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
  isSystem: z.boolean().default(false),
  permissions: z.array(z.number()).optional(),
});

export const assignRoleSchema = z.object({
  roleId: z.number().min(1, "Role ID is required"),
});

export const updateRolePermissionsSchema = z.object({
  roleId: z.number().min(1, "Role ID is required"),
  permissionIds: z.array(z.number()),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type EmployeeSearch = z.infer<typeof employeeSearchSchema>;
export type AuthSession = typeof authSessions.$inferSelect;
export type InsertAuthSession = typeof authSessions.$inferInsert;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = typeof otpVerifications.$inferInsert;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type VerifyOtpRequest = z.infer<typeof verifyOtpSchema>;
export type UpdateProfileImageRequest = z.infer<typeof updateProfileImageSchema>;

// Group messaging types
export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = typeof groupMembers.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
export type CreateGroupRequest = z.infer<typeof createGroupSchema>;
export type SendMessageRequest = z.infer<typeof sendMessageSchema>;
export type SubscribeNotificationRequest = z.infer<typeof subscribeNotificationSchema>;
export type UpdateEmployeeRequest = z.infer<typeof updateEmployeeSchema>;
export type AdminStats = z.infer<typeof adminStatsSchema>;

// Permission system types
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = typeof permissions.$inferInsert;
export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;
export type CreatePermissionRequest = z.infer<typeof createPermissionSchema>;
export type CreateRoleRequest = z.infer<typeof createRoleSchema>;
export type AssignRoleRequest = z.infer<typeof assignRoleSchema>;
export type UpdateRolePermissionsRequest = z.infer<typeof updateRolePermissionsSchema>;

// Permission constants
export const PERMISSIONS = {
  // Employee permissions
  VIEW_EMPLOYEES: "view_employees",
  VIEW_EMPLOYEE_DETAILS: "view_employee_details",
  EDIT_OWN_PROFILE: "edit_own_profile",
  
  // Admin permissions
  EDIT_EMPLOYEES: "edit_employees",
  DELETE_EMPLOYEES: "delete_employees",
  CREATE_EMPLOYEES: "create_employees",
  MANAGE_ROLES: "manage_roles",
  VIEW_ADMIN_DASHBOARD: "view_admin_dashboard",
  VIEW_SESSIONS: "view_sessions",
  MANAGE_SESSIONS: "manage_sessions",
  VIEW_SYSTEM_STATS: "view_system_stats",
  
  // Messaging permissions
  CREATE_GROUPS: "create_groups",
  MANAGE_GROUPS: "manage_groups",
  SEND_MESSAGES: "send_messages",
  VIEW_MESSAGES: "view_messages",
  MANAGE_NOTIFICATIONS: "manage_notifications",
  
  // System permissions
  MANAGE_PERMISSIONS: "manage_permissions",
  SYSTEM_ADMIN: "system_admin",
} as const;

export const ROLES = {
  EMPLOYEE: "employee",
  HR_MANAGER: "hr_manager",
  DEPARTMENT_HEAD: "department_head",
  SYSTEM_ADMIN: "system_admin",
  READ_ONLY: "read_only",
} as const;
