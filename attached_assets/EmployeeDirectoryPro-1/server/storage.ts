import { 
  employees, 
  sessions, 
  otpCodes, 
  notificationGroups, 
  messages,
  type Employee, 
  type InsertEmployee,
  type Session,
  type InsertSession,
  type OtpCode,
  type InsertOtpCode,
  type NotificationGroup,
  type InsertNotificationGroup,
  type Message,
  type InsertMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, or, like, inArray, gt, lt } from "drizzle-orm";

export interface IStorage {
  // Employee operations
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  searchEmployees(query: string, filters: any, limit: number, offset: number): Promise<{ employees: Employee[], total: number }>;
  getFilterOptions(): Promise<any>;

  // Session operations
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;

  // OTP operations
  createOtpCode(otp: InsertOtpCode): Promise<OtpCode>;
  getValidOtpCode(employeeId: string, code: string): Promise<OtpCode | undefined>;
  markOtpAsUsed(id: number): Promise<void>;
  deleteExpiredOtpCodes(): Promise<void>;

  // Notification group operations
  createNotificationGroup(group: InsertNotificationGroup): Promise<NotificationGroup>;
  getNotificationGroupsByMember(employeeId: string): Promise<NotificationGroup[]>;
  getNotificationGroup(id: number): Promise<NotificationGroup | undefined>;
  updateNotificationGroup(id: number, group: Partial<InsertNotificationGroup>): Promise<NotificationGroup>;
  deleteNotificationGroup(id: number): Promise<void>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByGroup(groupId: number, limit: number, offset: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<void>;
  getUnreadMessageCount(employeeId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // Employee operations
  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee || undefined;
  }

  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.employeeId, employeeId));
    return employee || undefined;
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.email, email));
    return employee || undefined;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee> {
    const [updatedEmployee] = await db
      .update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  async searchEmployees(query: string, filters: any, limit: number, offset: number): Promise<{ employees: Employee[], total: number }> {
    let whereConditions = [];
    
    // Search query
    if (query) {
      whereConditions.push(
        or(
          like(employees.name, `%${query}%`),
          like(employees.email, `%${query}%`),
          like(employees.department, `%${query}%`),
          like(employees.designation, `%${query}%`)
        )
      );
    }

    // Filters
    if (filters.department && filters.department !== 'all') {
      whereConditions.push(eq(employees.department, filters.department));
    }
    if (filters.location && filters.location !== 'all') {
      whereConditions.push(eq(employees.location, filters.location));
    }
    if (filters.category && filters.category !== 'all') {
      whereConditions.push(eq(employees.category, filters.category));
    }
    if (filters.grade && filters.grade !== 'all') {
      whereConditions.push(eq(employees.grade, filters.grade));
    }
    if (filters.gender && filters.gender !== 'all') {
      whereConditions.push(eq(employees.gender, filters.gender));
    }
    if (filters.bloodGroup && filters.bloodGroup !== 'all') {
      whereConditions.push(eq(employees.bloodGroup, filters.bloodGroup));
    }
    
    // Multi-select departments
    if (filters.departments && Array.isArray(filters.departments) && filters.departments.length > 0) {
      whereConditions.push(inArray(employees.department, filters.departments));
    }

    // Always show only active employees
    whereConditions.push(eq(employees.isActive, true));

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [employeeList, totalCount] = await Promise.all([
      db
        .select()
        .from(employees)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(asc(employees.name)),
      db
        .select({ count: employees.id })
        .from(employees)
        .where(whereClause)
        .then(rows => rows.length)
    ]);

    return { employees: employeeList, total: totalCount };
  }

  async getFilterOptions(): Promise<any> {
    const [departments, locations, categories, grades, genders, bloodGroups] = await Promise.all([
      db.selectDistinct({ department: employees.department }).from(employees).where(eq(employees.isActive, true)),
      db.selectDistinct({ location: employees.location }).from(employees).where(eq(employees.isActive, true)),
      db.selectDistinct({ category: employees.category }).from(employees).where(eq(employees.isActive, true)),
      db.selectDistinct({ grade: employees.grade }).from(employees).where(eq(employees.isActive, true)),
      db.selectDistinct({ gender: employees.gender }).from(employees).where(eq(employees.isActive, true)),
      db.selectDistinct({ bloodGroup: employees.bloodGroup }).from(employees).where(eq(employees.isActive, true))
    ]);

    return {
      departments: departments.map(d => d.department),
      locations: locations.map(l => l.location),
      categories: categories.map(c => c.category),
      grades: grades.map(g => g.grade),
      genders: genders.map(g => g.gender),
      bloodGroups: bloodGroups.map(bg => bg.bloodGroup).filter(Boolean)
    };
  }

  // Session operations
  async createSession(session: InsertSession): Promise<Session> {
    const [newSession] = await db.insert(sessions).values(session).returning();
    return newSession;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.sessionToken, token), gt(sessions.expiresAt, new Date())));
    return session || undefined;
  }

  async deleteSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.sessionToken, token));
  }

  async deleteExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
  }

  // OTP operations
  async createOtpCode(otp: InsertOtpCode): Promise<OtpCode> {
    const [newOtp] = await db.insert(otpCodes).values(otp).returning();
    return newOtp;
  }

  async getValidOtpCode(employeeId: string, code: string): Promise<OtpCode | undefined> {
    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.employeeId, employeeId),
          eq(otpCodes.code, code),
          eq(otpCodes.isUsed, false),
          gt(otpCodes.expiresAt, new Date())
        )
      );
    return otp || undefined;
  }

  async markOtpAsUsed(id: number): Promise<void> {
    await db.update(otpCodes).set({ isUsed: true }).where(eq(otpCodes.id, id));
  }

  async deleteExpiredOtpCodes(): Promise<void> {
    await db.delete(otpCodes).where(lt(otpCodes.expiresAt, new Date()));
  }

  // Notification group operations
  async createNotificationGroup(group: InsertNotificationGroup): Promise<NotificationGroup> {
    const [newGroup] = await db.insert(notificationGroups).values(group).returning();
    return newGroup;
  }

  async getNotificationGroupsByMember(employeeId: string): Promise<NotificationGroup[]> {
    const groups = await db
      .select()
      .from(notificationGroups)
      .where(
        and(
          eq(notificationGroups.isActive, true),
          or(
            eq(notificationGroups.createdBy, employeeId),
            like(notificationGroups.members, `%${employeeId}%`)
          )
        )
      )
      .orderBy(desc(notificationGroups.updatedAt));
    
    return groups.filter(group => group.members.includes(employeeId));
  }

  async getNotificationGroup(id: number): Promise<NotificationGroup | undefined> {
    const [group] = await db
      .select()
      .from(notificationGroups)
      .where(eq(notificationGroups.id, id));
    return group || undefined;
  }

  async updateNotificationGroup(id: number, group: Partial<InsertNotificationGroup>): Promise<NotificationGroup> {
    const [updatedGroup] = await db
      .update(notificationGroups)
      .set({ ...group, updatedAt: new Date() })
      .where(eq(notificationGroups.id, id))
      .returning();
    return updatedGroup;
  }

  async deleteNotificationGroup(id: number): Promise<void> {
    await db.delete(notificationGroups).where(eq(notificationGroups.id, id));
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getMessagesByGroup(groupId: number, limit: number, offset: number): Promise<Message[]> {
    const messageList = await db
      .select()
      .from(messages)
      .where(eq(messages.groupId, groupId))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(messages.createdAt));
    
    return messageList.reverse(); // Return in chronological order
  }

  async markMessageAsRead(id: number): Promise<void> {
    await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
  }

  async getUnreadMessageCount(employeeId: string): Promise<number> {
    // Get all groups the employee is part of
    const groups = await this.getNotificationGroupsByMember(employeeId);
    const groupIds = groups.map(g => g.id);
    
    if (groupIds.length === 0) return 0;
    
    const unreadMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          inArray(messages.groupId, groupIds),
          eq(messages.isRead, false)
        )
      );
    
    return unreadMessages.length;
  }
}

export const storage = new DatabaseStorage();
