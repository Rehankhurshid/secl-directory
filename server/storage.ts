import { employees, authSessions, otpVerifications, groups, groupMembers, messages, pushSubscriptions, permissions, roles, rolePermissions, userRoles, type Employee, type InsertEmployee, type EmployeeSearch, type AuthSession, type InsertAuthSession, type OtpVerification, type InsertOtpVerification, type Group, type InsertGroup, type GroupMember, type InsertGroupMember, type Message, type InsertMessage, type PushSubscription, type InsertPushSubscription, type UpdateEmployeeRequest, type AdminStats, type Permission, type InsertPermission, type Role, type InsertRole, type RolePermission, type InsertRolePermission, type UserRole, type InsertUserRole } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, ilike, sql, desc, asc, gt, inArray, ne } from "drizzle-orm";

// Fuzzy search helper functions
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function calculateSimilarity(search: string, text: string): number {
  const searchLower = search.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Exact match gets highest score
  if (textLower === searchLower) return 1.0;
  
  // Contains match gets high score
  if (textLower.includes(searchLower)) return 0.8;
  
  // For very short search terms, don't use fuzzy matching
  if (search.length <= 3) {
    return 0.0;
  }
  
  // Fuzzy matching with Levenshtein distance
  const maxLength = Math.max(search.length, text.length);
  const distance = levenshteinDistance(searchLower, textLower);
  const similarity = 1 - (distance / maxLength);
  
  // Apply very strict threshold for fuzzy matching (0.75 to prevent false positives)
  return similarity > 0.75 ? similarity : 0.0;
}

function fuzzyMatch(search: string, employee: Employee): number {
  const searchOriginal = search.trim();
  const searchTerms = searchOriginal.toLowerCase().split(' ').filter(term => term.length > 0);
  let totalScore = 0;
  let matches = 0;
  
  // Define fields with priority weights - focusing only on name and employee ID
  const fieldWeights = [
    { field: employee.name, weight: 3.0 },           // Name gets highest priority
    { field: employee.employeeId, weight: 2.5 }      // Employee ID gets second priority  
  ];
  
  // Special handling for employee ID patterns (numeric or alphanumeric)
  const isEmployeeIdPattern = /^[A-Z]*\d+$/i.test(searchOriginal.replace(/\s+/g, ''));
  
  searchTerms.forEach(term => {
    let bestScore = 0;
    let bestWeight = 1.0;
    
    fieldWeights.forEach(({ field, weight }) => {
      if (field) {
        const fieldLower = field.toLowerCase();
        const fieldOriginal = field;
        let score = 0;
        
        // Special boost for employee ID searches
        if (isEmployeeIdPattern && field === employee.employeeId) {
          if (fieldOriginal === searchOriginal || fieldLower === term) {
            score = 1.0;
          } else if (fieldLower.includes(term)) {
            score = 0.95;
          } else {
            score = calculateSimilarity(term, field);
          }
          weight = weight * 1.5; // Boost employee ID weight for ID searches
        }
        // Name search optimizations
        else if (field === employee.name) {
          const nameWords = fieldLower.split(' ');
          
          // Check for exact match first (highest score)
          if (fieldLower === term || fieldOriginal === searchOriginal) {
            score = 1.0;
          }
          // Check if term matches any word in name exactly
          else if (nameWords.some(word => word === term)) {
            score = 0.95;
          }
          // Check for starts with (high score)
          else if (fieldLower.startsWith(term) || nameWords.some(word => word.startsWith(term))) {
            score = 0.9;
          }
          // Check for contains (medium score)
          else if (fieldLower.includes(term)) {
            score = 0.7;
          }
          // Fall back to fuzzy similarity
          else {
            score = calculateSimilarity(term, field);
          }
        }
        // Regular field matching
        else {
          // Check for exact match first (highest score)
          if (fieldLower === term || fieldOriginal === searchOriginal) {
            score = 1.0;
          }
          // Check for starts with (high score)
          else if (fieldLower.startsWith(term)) {
            score = 0.9;
          }
          // Check for contains (medium score)
          else if (fieldLower.includes(term)) {
            score = 0.7;
          }
          // Fall back to fuzzy similarity
          else {
            score = calculateSimilarity(term, field);
          }
        }
        
        // Apply weight and update best score
        const weightedScore = score * weight;
        if (weightedScore > bestScore) {
          bestScore = weightedScore;
          bestWeight = weight;
        }
      }
    });
    
    if (bestScore > 0.6) { // Only count matches above strict threshold
      totalScore += bestScore;
      matches++;
    }
  });
  
  return matches > 0 ? totalScore / searchTerms.length : 0;
}

export interface IStorage {
  // Employee methods
  getEmployees(filters?: EmployeeSearch): Promise<{ employees: Employee[]; total: number }>;
  getEmployee(id: number): Promise<Employee | undefined>;
  getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  bulkCreateEmployees(employees: InsertEmployee[]): Promise<Employee[]>;
  searchEmployees(query: string): Promise<Employee[]>;
  updateEmployeeProfileImage(employeeId: string, profileImage: string): Promise<Employee | undefined>;
  getEmployeeStats(): Promise<{
    total: number;
    departments: { name: string; count: number }[];
    locations: { name: string; count: number }[];
    grades: { name: string; count: number }[];
    categories: { name: string; count: number }[];
    genders: { name: string; count: number }[];
    bloodGroups: { name: string; count: number }[];
  }>;
  
  // Authentication methods
  createAuthSession(session: InsertAuthSession): Promise<AuthSession>;
  getAuthSessionByToken(token: string): Promise<AuthSession | undefined>;
  deleteAuthSession(token: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;
  
  // OTP verification methods
  createOtpVerification(verification: InsertOtpVerification): Promise<OtpVerification>;
  getOtpVerificationBySessionId(sessionId: string): Promise<OtpVerification | undefined>;
  updateOtpVerification(sessionId: string, verified: boolean): Promise<void>;
  cleanupExpiredOtpVerifications(): Promise<void>;

  // Group messaging methods
  createGroup(group: InsertGroup): Promise<Group>;
  getGroupsByEmployeeId(employeeId: string): Promise<Group[]>;
  getGroupById(groupId: number): Promise<Group | undefined>;
  getGroupMembers(groupId: number): Promise<Employee[]>;
  addGroupMember(groupMember: InsertGroupMember): Promise<GroupMember>;
  addGroupMembers(groupId: number, employeeIds: string[]): Promise<void>;
  isGroupMember(groupId: number, employeeId: string): Promise<boolean>;
  
  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getGroupMessages(groupId: number, limit?: number, offset?: number): Promise<Message[]>;
  markMessageAsRead(messageId: number, employeeId: string): Promise<void>;
  getUnreadMessageCount(employeeId: string): Promise<number>;
  getUnreadMessageCountForGroup(groupId: number, employeeId: string): Promise<number>;
  
  // Push notification methods
  savePushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  getPushSubscriptionsByEmployeeId(employeeId: string): Promise<PushSubscription[]>;
  getAllPushSubscriptions(): Promise<PushSubscription[]>;
  deletePushSubscription(endpoint: string): Promise<void>;

  // Admin methods
  updateEmployee(employeeId: string, updates: UpdateEmployeeRequest): Promise<Employee | undefined>;
  deleteEmployee(employeeId: string): Promise<boolean>;
  getAdminStats(): Promise<AdminStats>;
  getAllEmployeesForAdmin(): Promise<Employee[]>;
  getRecentAuthSessions(limit?: number): Promise<AuthSession[]>;
  bulkUpdateEmployees(updates: { employeeId: string; data: UpdateEmployeeRequest }[]): Promise<Employee[]>;
  
  // Permission methods
  createPermission(permission: InsertPermission): Promise<Permission>;
  getPermissions(): Promise<Permission[]>;
  getPermissionsByCategory(category: string): Promise<Permission[]>;
  deletePermission(permissionId: number): Promise<boolean>;
  
  // Role methods
  createRole(role: InsertRole): Promise<Role>;
  getRoles(): Promise<Role[]>;
  getRoleById(roleId: number): Promise<Role | undefined>;
  updateRole(roleId: number, updates: Partial<InsertRole>): Promise<Role | undefined>;
  deleteRole(roleId: number): Promise<boolean>;
  
  // Role Permission methods
  assignPermissionToRole(roleId: number, permissionId: number): Promise<RolePermission>;
  removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean>;
  getRolePermissions(roleId: number): Promise<Permission[]>;
  updateRolePermissions(roleId: number, permissionIds: number[]): Promise<void>;
  
  // User Role methods
  assignRoleToUser(employeeId: string, roleId: number, assignedBy: string): Promise<UserRole>;
  removeRoleFromUser(employeeId: string, roleId: number): Promise<boolean>;
  getUserRoles(employeeId: string): Promise<Role[]>;
  getUserPermissions(employeeId: string): Promise<Permission[]>;
  hasPermission(employeeId: string, permissionName: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private employees: Map<number, Employee>;
  private currentId: number;

  constructor() {
    this.employees = new Map();
    this.currentId = 1;
  }

  async getEmployees(filters?: EmployeeSearch): Promise<{ employees: Employee[]; total: number }> {
    let filteredEmployees = Array.from(this.employees.values());

    // Apply filters
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredEmployees = filteredEmployees.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm) ||
        emp.designation.toLowerCase().includes(searchTerm) ||
        emp.department.toLowerCase().includes(searchTerm) ||
        emp.employeeId.toLowerCase().includes(searchTerm)
      );
    }

    if (filters?.department) {
      filteredEmployees = filteredEmployees.filter(emp => emp.department === filters.department);
    }

    if (filters?.location) {
      filteredEmployees = filteredEmployees.filter(emp => emp.location === filters.location);
    }

    if (filters?.grade) {
      filteredEmployees = filteredEmployees.filter(emp => emp.grade === filters.grade);
    }

    if (filters?.category) {
      filteredEmployees = filteredEmployees.filter(emp => emp.category === filters.category);
    }

    if (filters?.gender) {
      filteredEmployees = filteredEmployees.filter(emp => emp.gender === filters.gender);
    }

    if (filters?.bloodGroup) {
      filteredEmployees = filteredEmployees.filter(emp => emp.bloodGroup === filters.bloodGroup);
    }

    // Apply sorting
    if (filters?.sortBy) {
      filteredEmployees.sort((a, b) => {
        const aValue = a[filters.sortBy!] || '';
        const bValue = b[filters.sortBy!] || '';
        return aValue.localeCompare(bValue);
      });
    }

    const total = filteredEmployees.length;
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      employees: filteredEmployees.slice(start, end),
      total
    };
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(emp => emp.employeeId === employeeId);
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = this.currentId++;
    const employee: Employee = { 
      ...insertEmployee, 
      id,
      email: insertEmployee.email || null,
      grade: insertEmployee.grade || null,
      dob: insertEmployee.dob || null,
      fatherName: insertEmployee.fatherName || null,
      category: insertEmployee.category || null,
      discipline: insertEmployee.discipline || null,
      bankAccNo: insertEmployee.bankAccNo || null,
      bank: insertEmployee.bank || null,
      deptCode: insertEmployee.deptCode || null,
      subDept: insertEmployee.subDept || null,
      phone1: insertEmployee.phone1 || null,
      phone2: insertEmployee.phone2 || null,
      gender: insertEmployee.gender || null,
      presentAddress: insertEmployee.presentAddress || null,
      permanentAddress: insertEmployee.permanentAddress || null,
      spouseName: insertEmployee.spouseName || null,
      bloodGroup: insertEmployee.bloodGroup || null,
      createdAt: new Date()
    };
    this.employees.set(id, employee);
    return employee;
  }

  async bulkCreateEmployees(insertEmployees: InsertEmployee[]): Promise<Employee[]> {
    const employees: Employee[] = [];
    for (const insertEmployee of insertEmployees) {
      const employee = await this.createEmployee(insertEmployee);
      employees.push(employee);
    }
    return employees;
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.employees.values()).filter(emp => 
      emp.name.toLowerCase().includes(searchTerm) ||
      emp.designation.toLowerCase().includes(searchTerm) ||
      emp.department.toLowerCase().includes(searchTerm) ||
      emp.employeeId.toLowerCase().includes(searchTerm)
    );
  }

  async getEmployeeStats(): Promise<{
    total: number;
    departments: { name: string; count: number }[];
    locations: { name: string; count: number }[];
    grades: { name: string; count: number }[];
    categories: { name: string; count: number }[];
    genders: { name: string; count: number }[];
    bloodGroups: { name: string; count: number }[];
  }> {
    const allEmployees = Array.from(this.employees.values());
    const departments = new Map<string, number>();
    const locations = new Map<string, number>();
    const grades = new Map<string, number>();
    const categories = new Map<string, number>();
    const genders = new Map<string, number>();
    const bloodGroups = new Map<string, number>();

    allEmployees.forEach(emp => {
      departments.set(emp.department, (departments.get(emp.department) || 0) + 1);
      locations.set(emp.location, (locations.get(emp.location) || 0) + 1);
      if (emp.grade) {
        grades.set(emp.grade, (grades.get(emp.grade) || 0) + 1);
      }
      if (emp.category) {
        categories.set(emp.category, (categories.get(emp.category) || 0) + 1);
      }
      if (emp.gender) {
        genders.set(emp.gender, (genders.get(emp.gender) || 0) + 1);
      }
      if (emp.bloodGroup) {
        bloodGroups.set(emp.bloodGroup, (bloodGroups.get(emp.bloodGroup) || 0) + 1);
      }
    });

    return {
      total: allEmployees.length,
      departments: Array.from(departments.entries()).map(([name, count]) => ({ name, count })),
      locations: Array.from(locations.entries()).map(([name, count]) => ({ name, count })),
      grades: Array.from(grades.entries()).map(([name, count]) => ({ name, count })),
      categories: Array.from(categories.entries()).map(([name, count]) => ({ name, count })),
      genders: Array.from(genders.entries()).map(([name, count]) => ({ name, count })),
      bloodGroups: Array.from(bloodGroups.entries()).map(([name, count]) => ({ name, count })),
    };
  }

  // Authentication methods (not implemented for MemStorage)
  async updateEmployeeProfileImage(employeeId: string, profileImage: string): Promise<Employee | undefined> {
    throw new Error("Authentication not supported in MemStorage");
  }

  async createAuthSession(session: InsertAuthSession): Promise<AuthSession> {
    throw new Error("Authentication not supported in MemStorage");
  }

  async getAuthSessionByToken(token: string): Promise<AuthSession | undefined> {
    throw new Error("Authentication not supported in MemStorage");
  }

  async deleteAuthSession(token: string): Promise<void> {
    throw new Error("Authentication not supported in MemStorage");
  }

  async cleanupExpiredSessions(): Promise<void> {
    throw new Error("Authentication not supported in MemStorage");
  }

  async createOtpVerification(verification: InsertOtpVerification): Promise<OtpVerification> {
    throw new Error("Authentication not supported in MemStorage");
  }

  async getOtpVerificationBySessionId(sessionId: string): Promise<OtpVerification | undefined> {
    throw new Error("Authentication not supported in MemStorage");
  }

  async updateOtpVerification(sessionId: string, verified: boolean): Promise<void> {
    throw new Error("Authentication not supported in MemStorage");
  }

  async cleanupExpiredOtpVerifications(): Promise<void> {
    throw new Error("Authentication not supported in MemStorage");
  }

  // Admin methods (stub implementations for memory storage)
  async updateEmployee(employeeId: string, updates: UpdateEmployeeRequest): Promise<Employee | undefined> {
    const employee = await this.getEmployeeByEmployeeId(employeeId);
    if (!employee) return undefined;
    
    const updatedEmployee = { ...employee, ...updates };
    this.employees.set(employee.id, updatedEmployee);
    return updatedEmployee;
  }

  async deleteEmployee(employeeId: string): Promise<boolean> {
    const employee = await this.getEmployeeByEmployeeId(employeeId);
    if (!employee) return false;
    
    this.employees.delete(employee.id);
    return true;
  }

  async getAdminStats(): Promise<AdminStats> {
    const allEmployees = Array.from(this.employees.values());
    const totalEmployees = allEmployees.length;
    const totalAdmins = allEmployees.filter(emp => emp.role === 'admin').length;
    
    return {
      totalEmployees,
      totalAdmins,
      totalGroups: 0,
      totalMessages: 0,
      recentLogins: 0,
      departmentStats: [],
      locationStats: [],
      gradeStats: [],
    };
  }

  async getAllEmployeesForAdmin(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async getRecentAuthSessions(limit = 50): Promise<AuthSession[]> {
    return [];
  }

  async bulkUpdateEmployees(updates: { employeeId: string; data: UpdateEmployeeRequest }[]): Promise<Employee[]> {
    const results: Employee[] = [];
    for (const update of updates) {
      const result = await this.updateEmployee(update.employeeId, update.data);
      if (result) results.push(result);
    }
    return results;
  }
}

export class DatabaseStorage implements IStorage {
  async getEmployees(filters?: EmployeeSearch): Promise<{ employees: Employee[]; total: number }> {
    let conditions: any[] = [];

    // Apply filters (search will be handled separately with fuzzy logic)
    if (filters?.search) {
      // We'll handle fuzzy search after getting filtered results
    }

    if (filters?.department) {
      conditions.push(eq(employees.department, filters.department));
    }

    if (filters?.location) {
      conditions.push(eq(employees.location, filters.location));
    }

    if (filters?.grade) {
      conditions.push(eq(employees.grade, filters.grade));
    }

    if (filters?.category) {
      conditions.push(eq(employees.category, filters.category));
    }

    if (filters?.gender) {
      conditions.push(eq(employees.gender, filters.gender));
    }

    if (filters?.bloodGroup) {
      conditions.push(eq(employees.bloodGroup, filters.bloodGroup));
    }

    // Build where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(whereClause);
    const total = Number(countResult[0].count);

    // Build main query with all clauses
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    // Determine sort order
    let orderBy;
    if (filters?.sortBy === 'name') {
      orderBy = asc(employees.name);
    } else if (filters?.sortBy === 'department') {
      orderBy = asc(employees.department);
    } else if (filters?.sortBy === 'designation') {
      orderBy = asc(employees.designation);
    } else if (filters?.sortBy === 'employeeId') {
      orderBy = asc(employees.employeeId);
    } else {
      orderBy = asc(employees.name);
    }

    // Handle fuzzy search if search term is provided
    if (filters?.search) {
      // Get all employees matching other filters (but not search)
      const allFiltered = whereClause 
        ? await db.select().from(employees).where(whereClause)
        : await db.select().from(employees);
      
      // Apply fuzzy matching
      const searchMatches = allFiltered
        .map(emp => ({ employee: emp, score: fuzzyMatch(filters.search!, emp) }))
        .filter(match => match.score > 0.3) // Only include good matches
        .sort((a, b) => b.score - a.score) // Sort by relevance
        .map(match => match.employee);
      
      // Apply pagination to search results
      const paginatedResults = searchMatches.slice(offset, offset + limit);
      
      return {
        employees: paginatedResults,
        total: searchMatches.length
      };
    }

    // Execute normal query without search
    const result = whereClause 
      ? await db.select().from(employees).where(whereClause).orderBy(orderBy).limit(limit).offset(offset)
      : await db.select().from(employees).orderBy(orderBy).limit(limit).offset(offset);

    return {
      employees: result,
      total
    };
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.employeeId, employeeId));
    return employee;
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const [employee] = await db
      .insert(employees)
      .values(insertEmployee)
      .returning();
    return employee;
  }

  async bulkCreateEmployees(insertEmployees: InsertEmployee[]): Promise<Employee[]> {
    const results: Employee[] = [];
    const batchSize = 100;
    
    for (let i = 0; i < insertEmployees.length; i += batchSize) {
      const batch = insertEmployees.slice(i, i + batchSize);
      const batchResults = await db
        .insert(employees)
        .values(batch)
        .returning();
      results.push(...batchResults);
    }
    
    return results;
  }

  async searchEmployees(query: string): Promise<Employee[]> {
    // Get all employees for fuzzy search
    const allEmployees = await db.select().from(employees);
    
    // Apply fuzzy matching
    const searchMatches = allEmployees
      .map(emp => ({ employee: emp, score: fuzzyMatch(query, emp) }))
      .filter(match => match.score > 0.3) // Only include good matches
      .sort((a, b) => b.score - a.score) // Sort by relevance
      .map(match => match.employee)
      .slice(0, 50); // Limit results
    
    return searchMatches;
  }

  async updateEmployeeProfileImage(employeeId: string, profileImage: string): Promise<Employee | undefined> {
    const [result] = await db
      .update(employees)
      .set({ profileImage })
      .where(eq(employees.employeeId, employeeId))
      .returning();
    return result;
  }

  async getEmployeeStats(): Promise<{
    total: number;
    departments: { name: string; count: number }[];
    locations: { name: string; count: number }[];
    grades: { name: string; count: number }[];
    categories: { name: string; count: number }[];
    genders: { name: string; count: number }[];
    bloodGroups: { name: string; count: number }[];
  }> {
    const [totalResult] = await db.select({ count: sql`count(*)` }).from(employees);
    const total = Number(totalResult.count);

    const departmentStats = await db
      .select({
        name: employees.department,
        count: sql`count(*)`
      })
      .from(employees)
      .groupBy(employees.department)
      .orderBy(desc(sql`count(*)`));

    const locationStats = await db
      .select({
        name: employees.location,
        count: sql`count(*)`
      })
      .from(employees)
      .groupBy(employees.location)
      .orderBy(desc(sql`count(*)`));

    const gradeStats = await db
      .select({
        name: employees.grade,
        count: sql`count(*)`
      })
      .from(employees)
      .where(sql`${employees.grade} IS NOT NULL`)
      .groupBy(employees.grade)
      .orderBy(desc(sql`count(*)`));

    const categoryStats = await db
      .select({
        name: employees.category,
        count: sql`count(*)`
      })
      .from(employees)
      .where(sql`${employees.category} IS NOT NULL`)
      .groupBy(employees.category)
      .orderBy(desc(sql`count(*)`));

    const genderStats = await db
      .select({
        name: employees.gender,
        count: sql`count(*)`
      })
      .from(employees)
      .where(sql`${employees.gender} IS NOT NULL`)
      .groupBy(employees.gender)
      .orderBy(desc(sql`count(*)`));

    const bloodGroupStats = await db
      .select({
        name: employees.bloodGroup,
        count: sql`count(*)`
      })
      .from(employees)
      .where(sql`${employees.bloodGroup} IS NOT NULL`)
      .groupBy(employees.bloodGroup)
      .orderBy(desc(sql`count(*)`));

    return {
      total,
      departments: departmentStats.map(stat => ({ name: stat.name, count: Number(stat.count) })),
      locations: locationStats.map(stat => ({ name: stat.name, count: Number(stat.count) })),
      grades: gradeStats.map(stat => ({ name: stat.name || '', count: Number(stat.count) })),
      categories: categoryStats.map(stat => ({ name: stat.name || '', count: Number(stat.count) })),
      genders: genderStats.map(stat => ({ name: stat.name || '', count: Number(stat.count) })),
      bloodGroups: bloodGroupStats.map(stat => ({ name: stat.name || '', count: Number(stat.count) })),
    };
  }

  // Authentication methods
  async createAuthSession(session: InsertAuthSession): Promise<AuthSession> {
    const [result] = await db
      .insert(authSessions)
      .values(session)
      .returning();
    return result;
  }

  async getAuthSessionByToken(token: string): Promise<AuthSession | undefined> {
    const [result] = await db
      .select()
      .from(authSessions)
      .where(and(
        eq(authSessions.sessionToken, token),
        gt(authSessions.expiresAt, new Date())
      ));
    return result;
  }

  async deleteAuthSession(token: string): Promise<void> {
    await db
      .delete(authSessions)
      .where(eq(authSessions.sessionToken, token));
  }

  async cleanupExpiredSessions(): Promise<void> {
    await db
      .delete(authSessions)
      .where(sql`${authSessions.expiresAt} < NOW()`);
  }

  // OTP verification methods
  async createOtpVerification(verification: InsertOtpVerification): Promise<OtpVerification> {
    const [result] = await db
      .insert(otpVerifications)
      .values(verification)
      .returning();
    return result;
  }

  async getOtpVerificationBySessionId(sessionId: string): Promise<OtpVerification | undefined> {
    const [result] = await db
      .select()
      .from(otpVerifications)
      .where(eq(otpVerifications.sessionId, sessionId));
    return result;
  }

  async updateOtpVerification(sessionId: string, verified: boolean): Promise<void> {
    await db
      .update(otpVerifications)
      .set({ verified })
      .where(eq(otpVerifications.sessionId, sessionId));
  }

  async cleanupExpiredOtpVerifications(): Promise<void> {
    await db
      .delete(otpVerifications)
      .where(sql`${otpVerifications.expiresAt} < NOW()`);
  }

  // Group messaging methods
  async createGroup(group: InsertGroup): Promise<Group> {
    const [result] = await db
      .insert(groups)
      .values(group)
      .returning();
    return result;
  }

  async getGroupsByEmployeeId(employeeId: string): Promise<Group[]> {
    const result = await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        createdBy: groups.createdBy,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt
      })
      .from(groups)
      .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
      .where(eq(groupMembers.employeeId, employeeId))
      .orderBy(desc(groups.updatedAt));
    return result;
  }

  async getGroupById(groupId: number): Promise<Group | undefined> {
    const [result] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId));
    return result;
  }

  async getGroupMembers(groupId: number): Promise<Employee[]> {
    const result = await db
      .select({
        id: employees.id,
        employeeId: employees.employeeId,
        name: employees.name,
        designation: employees.designation,
        department: employees.department,
        email: employees.email,
        location: employees.location,
        areaName: employees.areaName,
        unitName: employees.unitName,
        dob: employees.dob,
        fatherName: employees.fatherName,
        category: employees.category,
        grade: employees.grade,
        discipline: employees.discipline,
        bankAccNo: employees.bankAccNo,
        bank: employees.bank,
        deptCode: employees.deptCode,
        subDept: employees.subDept,
        phone1: employees.phone1,
        phone2: employees.phone2,
        gender: employees.gender,
        presentAddress: employees.presentAddress,
        permanentAddress: employees.permanentAddress,
        spouseName: employees.spouseName,
        bloodGroup: employees.bloodGroup,
        profileImage: employees.profileImage,
        createdAt: employees.createdAt
      })
      .from(employees)
      .innerJoin(groupMembers, eq(employees.employeeId, groupMembers.employeeId))
      .where(eq(groupMembers.groupId, groupId));
    return result;
  }

  async addGroupMember(groupMember: InsertGroupMember): Promise<GroupMember> {
    const [result] = await db
      .insert(groupMembers)
      .values(groupMember)
      .returning();
    return result;
  }

  async addGroupMembers(groupId: number, employeeIds: string[]): Promise<void> {
    // Batch insert for better performance with large groups
    const batchSize = 100;
    const memberData = employeeIds.map(employeeId => ({
      groupId,
      employeeId
    }));
    
    for (let i = 0; i < memberData.length; i += batchSize) {
      const batch = memberData.slice(i, i + batchSize);
      await db
        .insert(groupMembers)
        .values(batch);
    }
  }

  async isGroupMember(groupId: number, employeeId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(groupMembers)
      .where(and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.employeeId, employeeId)
      ));
    return !!result;
  }

  // Message methods
  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db
      .insert(messages)
      .values(message)
      .returning();
    return result;
  }

  async getGroupMessages(groupId: number, limit = 50, offset = 0): Promise<Message[]> {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.groupId, groupId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);
    return result;
  }

  async markMessageAsRead(messageId: number, employeeId: string): Promise<void> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId));
    
    if (message && !message.readBy.includes(employeeId)) {
      await db
        .update(messages)
        .set({ readBy: [...message.readBy, employeeId] })
        .where(eq(messages.id, messageId));
    }
  }

  async getUnreadMessageCount(employeeId: string): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(messages)
      .innerJoin(groupMembers, eq(messages.groupId, groupMembers.groupId))
      .where(and(
        eq(groupMembers.employeeId, employeeId),
        sql`NOT (${employeeId} = ANY(${messages.readBy}))`,
        ne(messages.senderId, employeeId)
      ));
    
    return Number(result[0].count);
  }

  async getUnreadMessageCountForGroup(groupId: number, employeeId: string): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(messages)
      .where(and(
        eq(messages.groupId, groupId),
        sql`NOT (${employeeId} = ANY(${messages.readBy}))`,
        ne(messages.senderId, employeeId)
      ));
    
    return Number(result[0].count);
  }

  // Push notification methods
  async savePushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription> {
    const [result] = await db
      .insert(pushSubscriptions)
      .values(subscription)
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          employeeId: subscription.employeeId,
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      })
      .returning();
    return result;
  }

  async getPushSubscriptionsByEmployeeId(employeeId: string): Promise<PushSubscription[]> {
    return await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.employeeId, employeeId));
  }

  async getAllPushSubscriptions(): Promise<PushSubscription[]> {
    return await db.select().from(pushSubscriptions);
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  // Admin methods
  async updateEmployee(employeeId: string, updates: UpdateEmployeeRequest): Promise<Employee | undefined> {
    const [result] = await db
      .update(employees)
      .set(updates)
      .where(eq(employees.employeeId, employeeId))
      .returning();
    return result;
  }

  async deleteEmployee(employeeId: string): Promise<boolean> {
    const result = await db
      .delete(employees)
      .where(eq(employees.employeeId, employeeId))
      .returning();
    return result.length > 0;
  }

  async getAdminStats(): Promise<AdminStats> {
    try {
      // Optimized: Execute all queries in parallel for better performance
      const [
        countsResult,
        departmentStats,
        locationStats,
        gradeStats
      ] = await Promise.all([
        // Combined count query to reduce database round trips
        db.select({
          totalEmployees: sql<number>`count(*)`,
          totalAdmins: sql<number>`count(*) filter (where role = 'admin')`,
          totalGroups: sql<number>`(select count(*) from ${groups})`,
          totalMessages: sql<number>`(select count(*) from ${messages})`,
          recentLogins: sql<number>`(select count(*) from ${authSessions} where created_at > ${new Date(Date.now() - 24 * 60 * 60 * 1000)})`
        }).from(employees),

        // Department stats
        db.select({
          department: employees.department,
          count: sql<number>`count(*)`
        })
        .from(employees)
        .groupBy(employees.department)
        .orderBy(desc(sql`count(*)`))
        .limit(10), // Limit to top 10 for performance

        // Location stats
        db.select({
          location: employees.location,
          count: sql<number>`count(*)`
        })
        .from(employees)
        .groupBy(employees.location)
        .orderBy(desc(sql`count(*)`))
        .limit(10), // Limit to top 10 for performance

        // Grade stats
        db.select({
          grade: employees.grade,
          count: sql<number>`count(*)`
        })
        .from(employees)
        .where(sql`${employees.grade} IS NOT NULL`)
        .groupBy(employees.grade)
        .orderBy(desc(sql`count(*)`))
        .limit(10) // Limit to top 10 for performance
      ]);

      const counts = countsResult[0];

      return {
        totalEmployees: counts.totalEmployees,
        totalAdmins: counts.totalAdmins,
        totalGroups: counts.totalGroups,
        totalMessages: counts.totalMessages,
        recentLogins: counts.recentLogins,
        departmentStats: departmentStats.map(d => ({ department: d.department, count: d.count })),
        locationStats: locationStats.map(l => ({ location: l.location, count: l.count })),
        gradeStats: gradeStats.map(g => ({ grade: g.grade || 'Unknown', count: g.count })),
      };
    } catch (error) {
      console.error('Error in getAdminStats:', error);
      throw error;
    }
  }

  async getAllEmployeesForAdmin(options?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    department?: string; 
    location?: string; 
    role?: string; 
  }): Promise<{ employees: (Employee & { role: string })[]; total: number }> {
    const { page = 1, limit = 50, search, department, location, role } = options || {};
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];
    
    if (search) {
      whereConditions.push(
        or(
          ilike(employees.name, `%${search}%`),
          ilike(employees.employeeId, `%${search}%`),
          ilike(employees.designation, `%${search}%`),
          ilike(employees.department, `%${search}%`)
        )
      );
    }
    
    if (department) {
      whereConditions.push(eq(employees.department, department));
    }
    
    if (location) {
      whereConditions.push(eq(employees.location, location));
    }
    
    if (role) {
      whereConditions.push(eq(roles.name, role));
    }

    // Execute queries in parallel with role information
    const [employeesResult, countResult] = await Promise.all([
      db.select({
        id: employees.id,
        employeeId: employees.employeeId,
        name: employees.name,
        designation: employees.designation,
        department: employees.department,
        location: employees.location,
        areaName: employees.areaName,
        unitName: employees.unitName,
        email: employees.email,
        phone1: employees.phone1,
        phone2: employees.phone2,
        dob: employees.dob,
        fatherName: employees.fatherName,
        category: employees.category,
        grade: employees.grade,
        discipline: employees.discipline,
        bankAccNo: employees.bankAccNo,
        bank: employees.bank,
        deptCode: employees.deptCode,
        subDept: employees.subDept,
        gender: employees.gender,
        presentAddress: employees.presentAddress,
        permanentAddress: employees.permanentAddress,
        spouseName: employees.spouseName,
        bloodGroup: employees.bloodGroup,
        profileImage: employees.profileImage,
        createdAt: employees.createdAt,
        role: sql<string>`COALESCE(${roles.name}, 'employee')`.as('role')
      })
        .from(employees)
        .leftJoin(userRoles, eq(employees.employeeId, userRoles.employeeId))
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(asc(employees.name))
        .limit(limit)
        .offset(offset),
      
      db.select({ count: sql<number>`count(DISTINCT ${employees.id})` })
        .from(employees)
        .leftJoin(userRoles, eq(employees.employeeId, userRoles.employeeId))
        .leftJoin(roles, eq(userRoles.roleId, roles.id))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    ]);

    return {
      employees: employeesResult,
      total: countResult[0]?.count || 0
    };
  }

  async getRecentAuthSessions(limit = 50): Promise<AuthSession[]> {
    // Fix: Only select fields that exist in the authSessions table
    const result = await db
      .select({
        id: authSessions.id,
        employeeId: authSessions.employeeId,
        sessionToken: authSessions.sessionToken,
        createdAt: authSessions.createdAt,
        expiresAt: authSessions.expiresAt,
        // Include employee data directly
        employeeName: employees.name,
        employeeDepartment: employees.department,
        employeeDesignation: employees.designation,
        employeeRole: employees.role
      })
      .from(authSessions)
      .leftJoin(employees, eq(authSessions.employeeId, employees.employeeId))
      .orderBy(desc(authSessions.createdAt))
      .limit(limit);
    
    return result.map(session => ({
      id: session.id,
      employeeId: session.employeeId,
      sessionToken: session.sessionToken,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      // Add computed fields
      isActive: session.expiresAt > new Date(),
      employee: session.employeeName ? {
        name: session.employeeName,
        department: session.employeeDepartment,
        designation: session.employeeDesignation,
        role: session.employeeRole
      } : null
    }));
  }

  async bulkUpdateEmployees(updates: { employeeId: string; data: UpdateEmployeeRequest }[]): Promise<Employee[]> {
    const results: Employee[] = [];
    
    for (const update of updates) {
      const [result] = await db
        .update(employees)
        .set(update.data)
        .where(eq(employees.employeeId, update.employeeId))
        .returning();
      
      if (result) {
        results.push(result);
      }
    }
    
    return results;
  }

  // Permission methods
  async createPermission(permission: InsertPermission): Promise<Permission> {
    const [result] = await db
      .insert(permissions)
      .values(permission)
      .returning();
    return result;
  }

  async getPermissions(): Promise<Permission[]> {
    const result = await db
      .select()
      .from(permissions)
      .orderBy(asc(permissions.category), asc(permissions.name));
    return result;
  }

  async getPermissionsByCategory(category: string): Promise<Permission[]> {
    const result = await db
      .select()
      .from(permissions)
      .where(eq(permissions.category, category))
      .orderBy(asc(permissions.name));
    return result;
  }

  async deletePermission(permissionId: number): Promise<boolean> {
    const result = await db
      .delete(permissions)
      .where(eq(permissions.id, permissionId));
    return result.rowCount > 0;
  }

  // Role methods
  async createRole(role: InsertRole): Promise<Role> {
    const [result] = await db
      .insert(roles)
      .values(role)
      .returning();
    return result;
  }

  async getRoles(): Promise<Role[]> {
    const result = await db
      .select()
      .from(roles)
      .orderBy(asc(roles.name));
    return result;
  }

  async getRoleById(roleId: number): Promise<Role | undefined> {
    const [result] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId));
    return result;
  }

  async updateRole(roleId: number, updates: Partial<InsertRole>): Promise<Role | undefined> {
    const [result] = await db
      .update(roles)
      .set(updates)
      .where(eq(roles.id, roleId))
      .returning();
    return result;
  }

  async deleteRole(roleId: number): Promise<boolean> {
    // First remove role from all users
    await db
      .delete(userRoles)
      .where(eq(userRoles.roleId, roleId));
    
    // Then remove all permissions from role
    await db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
    
    // Finally delete the role
    const result = await db
      .delete(roles)
      .where(eq(roles.id, roleId));
    return result.rowCount > 0;
  }

  // Role Permission methods
  async assignPermissionToRole(roleId: number, permissionId: number): Promise<RolePermission> {
    const [result] = await db
      .insert(rolePermissions)
      .values({ roleId, permissionId })
      .returning();
    return result;
  }

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<boolean> {
    const result = await db
      .delete(rolePermissions)
      .where(and(
        eq(rolePermissions.roleId, roleId),
        eq(rolePermissions.permissionId, permissionId)
      ));
    return result.rowCount > 0;
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const result = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        description: permissions.description,
        category: permissions.category,
        createdAt: permissions.createdAt,
      })
      .from(permissions)
      .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(rolePermissions.roleId, roleId))
      .orderBy(asc(permissions.category), asc(permissions.name));
    return result;
  }

  async updateRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
    // Remove all existing permissions for this role
    await db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
    
    // Add new permissions
    if (permissionIds.length > 0) {
      const permissionData = permissionIds.map(permissionId => ({
        roleId,
        permissionId
      }));
      
      await db
        .insert(rolePermissions)
        .values(permissionData);
    }
  }

  // User Role methods
  async assignRoleToUser(employeeId: string, roleId: number, assignedBy: string): Promise<UserRole> {
    const [result] = await db
      .insert(userRoles)
      .values({ employeeId, roleId, assignedBy })
      .returning();
    return result;
  }

  async removeRoleFromUser(employeeId: string, roleId: number): Promise<boolean> {
    const result = await db
      .delete(userRoles)
      .where(and(
        eq(userRoles.employeeId, employeeId),
        eq(userRoles.roleId, roleId)
      ));
    return result.rowCount > 0;
  }

  async getUserRoles(employeeId: string): Promise<Role[]> {
    const result = await db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isSystem: roles.isSystem,
        createdAt: roles.createdAt,
      })
      .from(roles)
      .innerJoin(userRoles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.employeeId, employeeId))
      .orderBy(asc(roles.name));
    return result;
  }

  async getUserPermissions(employeeId: string): Promise<Permission[]> {
    const result = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        description: permissions.description,
        category: permissions.category,
        createdAt: permissions.createdAt,
      })
      .from(permissions)
      .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
      .innerJoin(userRoles, eq(rolePermissions.roleId, userRoles.roleId))
      .where(eq(userRoles.employeeId, employeeId))
      .orderBy(asc(permissions.category), asc(permissions.name));
    return result;
  }

  async hasPermission(employeeId: string, permissionName: string): Promise<boolean> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(permissions)
      .innerJoin(rolePermissions, eq(permissions.id, rolePermissions.permissionId))
      .innerJoin(userRoles, eq(rolePermissions.roleId, userRoles.roleId))
      .where(and(
        eq(userRoles.employeeId, employeeId),
        eq(permissions.name, permissionName)
      ));
    
    return Number(result[0].count) > 0;
  }
}

export const storage = new DatabaseStorage();
