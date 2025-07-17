import { storage } from "../storage";
import { PERMISSIONS, ROLES } from "@shared/schema";

export class PermissionService {
  private static instance: PermissionService;
  private initialized = false;

  private constructor() {}

  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  async initializePermissions() {
    if (this.initialized) {
      return;
    }

    console.log("[permissions] Initializing default permissions and roles...");

    try {
      // Add timeout for the entire initialization
      await Promise.race([
        this.performInitialization(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Permission initialization timeout')), 15000)
        )
      ]);
    } catch (error) {
      console.error("[permissions] Initialization failed:", error);
      // Don't throw - allow app to continue
    }
  }

  private async performInitialization() {
    try {
      // Define default permissions
      const defaultPermissions = [
        // Employee permissions
        { name: PERMISSIONS.VIEW_EMPLOYEES, description: "Can view employee directory", category: "employee" },
        { name: PERMISSIONS.VIEW_EMPLOYEE_DETAILS, description: "Can view detailed employee information", category: "employee" },
        { name: PERMISSIONS.EDIT_OWN_PROFILE, description: "Can edit own profile", category: "employee" },
        
        // Admin permissions
        { name: PERMISSIONS.EDIT_EMPLOYEES, description: "Can edit employee information", category: "admin" },
        { name: PERMISSIONS.DELETE_EMPLOYEES, description: "Can delete employees", category: "admin" },
        { name: PERMISSIONS.CREATE_EMPLOYEES, description: "Can create new employees", category: "admin" },
        { name: PERMISSIONS.MANAGE_ROLES, description: "Can manage user roles", category: "admin" },
        { name: PERMISSIONS.VIEW_ADMIN_DASHBOARD, description: "Can access admin dashboard", category: "admin" },
        { name: PERMISSIONS.VIEW_SESSIONS, description: "Can view active sessions", category: "admin" },
        { name: PERMISSIONS.MANAGE_SESSIONS, description: "Can manage user sessions", category: "admin" },
        { name: PERMISSIONS.VIEW_SYSTEM_STATS, description: "Can view system statistics", category: "admin" },
        
        // Messaging permissions
        { name: PERMISSIONS.CREATE_GROUPS, description: "Can create message groups", category: "messaging" },
        { name: PERMISSIONS.MANAGE_GROUPS, description: "Can manage message groups", category: "messaging" },
        { name: PERMISSIONS.SEND_MESSAGES, description: "Can send messages", category: "messaging" },
        { name: PERMISSIONS.VIEW_MESSAGES, description: "Can view messages", category: "messaging" },
        { name: PERMISSIONS.MANAGE_NOTIFICATIONS, description: "Can manage notifications", category: "messaging" },
        
        // System permissions
        { name: PERMISSIONS.MANAGE_PERMISSIONS, description: "Can manage system permissions", category: "system" },
        { name: PERMISSIONS.SYSTEM_ADMIN, description: "Full system administrator access", category: "system" },
      ];

      // Create permissions (ignore duplicates)
      const createdPermissions = new Map<string, any>();
      for (const permission of defaultPermissions) {
        try {
          const created = await storage.createPermission(permission);
          createdPermissions.set(permission.name, created);
        } catch (error) {
          // Permission might already exist, try to get it
          const existing = await storage.getPermissions();
          const found = existing.find(p => p.name === permission.name);
          if (found) {
            createdPermissions.set(permission.name, found);
          }
        }
      }

      // Define default roles with their permissions
      const defaultRoles = [
        {
          name: ROLES.EMPLOYEE,
          description: "Basic employee access",
          isSystem: true,
          permissions: [
            PERMISSIONS.VIEW_EMPLOYEES,
            PERMISSIONS.VIEW_EMPLOYEE_DETAILS,
            PERMISSIONS.EDIT_OWN_PROFILE,
            PERMISSIONS.SEND_MESSAGES,
            PERMISSIONS.VIEW_MESSAGES,
          ]
        },
        {
          name: ROLES.HR_MANAGER,
          description: "HR management access",
          isSystem: true,
          permissions: [
            PERMISSIONS.VIEW_EMPLOYEES,
            PERMISSIONS.VIEW_EMPLOYEE_DETAILS,
            PERMISSIONS.EDIT_OWN_PROFILE,
            PERMISSIONS.EDIT_EMPLOYEES,
            PERMISSIONS.CREATE_EMPLOYEES,
            PERMISSIONS.VIEW_ADMIN_DASHBOARD,
            PERMISSIONS.VIEW_SYSTEM_STATS,
            PERMISSIONS.SEND_MESSAGES,
            PERMISSIONS.VIEW_MESSAGES,
            PERMISSIONS.CREATE_GROUPS,
            PERMISSIONS.MANAGE_GROUPS,
          ]
        },
        {
          name: ROLES.DEPARTMENT_HEAD,
          description: "Department head access",
          isSystem: true,
          permissions: [
            PERMISSIONS.VIEW_EMPLOYEES,
            PERMISSIONS.VIEW_EMPLOYEE_DETAILS,
            PERMISSIONS.EDIT_OWN_PROFILE,
            PERMISSIONS.EDIT_EMPLOYEES,
            PERMISSIONS.VIEW_ADMIN_DASHBOARD,
            PERMISSIONS.VIEW_SYSTEM_STATS,
            PERMISSIONS.SEND_MESSAGES,
            PERMISSIONS.VIEW_MESSAGES,
            PERMISSIONS.CREATE_GROUPS,
            PERMISSIONS.MANAGE_GROUPS,
            PERMISSIONS.MANAGE_NOTIFICATIONS,
          ]
        },
        {
          name: ROLES.SYSTEM_ADMIN,
          description: "Full system administrator",
          isSystem: true,
          permissions: Object.values(PERMISSIONS) // All permissions
        },
        {
          name: ROLES.READ_ONLY,
          description: "Read-only access",
          isSystem: true,
          permissions: [
            PERMISSIONS.VIEW_EMPLOYEES,
            PERMISSIONS.VIEW_EMPLOYEE_DETAILS,
            PERMISSIONS.VIEW_MESSAGES,
          ]
        }
      ];

      // Create roles and assign permissions
      for (const roleData of defaultRoles) {
        try {
          const role = await storage.createRole({
            name: roleData.name,
            description: roleData.description,
            isSystem: roleData.isSystem,
          });

          // Assign permissions to role
          const permissionIds = roleData.permissions
            .map(permName => createdPermissions.get(permName)?.id)
            .filter(id => id !== undefined);

          if (permissionIds.length > 0) {
            await storage.updateRolePermissions(role.id, permissionIds);
          }

          console.log(`[permissions] Created role: ${role.name} with ${permissionIds.length} permissions`);
        } catch (error) {
          console.log(`[permissions] Role ${roleData.name} might already exist`);
        }
      }

      // Assign default roles to existing admins
      await this.assignDefaultRolesToAdmins();

      this.initialized = true;
      console.log("[permissions] Permission system initialized successfully");
    } catch (error) {
      console.error("[permissions] Error initializing permissions:", error);
      throw error; // Re-throw for timeout handling
    }
  }

  private async assignDefaultRolesToAdmins() {
    try {
      // Get all admin employees - handle the new pagination format
      const allEmployeesData = await storage.getAllEmployeesForAdmin({ limit: 1000 }); // Get first 1000 employees
      const allEmployees = allEmployeesData.employees;
      const adminEmployees = allEmployees.filter(emp => emp.role === 'admin');

      // Get system admin role
      const roles = await storage.getRoles();
      const systemAdminRole = roles.find(role => role.name === ROLES.SYSTEM_ADMIN);

      if (systemAdminRole) {
        for (const admin of adminEmployees) {
          try {
            // Check if admin already has roles
            const existingRoles = await storage.getUserRoles(admin.employeeId);
            
            if (existingRoles.length === 0) {
              await storage.assignRoleToUser(admin.employeeId, systemAdminRole.id, "SYSTEM");
              console.log(`[permissions] Assigned system admin role to ${admin.employeeId}`);
            }
          } catch (error) {
            console.log(`[permissions] Could not assign role to ${admin.employeeId}`);
          }
        }
      }

      // Get employee role for regular users
      const employeeRole = roles.find(role => role.name === ROLES.EMPLOYEE);
      if (employeeRole) {
        const regularEmployees = allEmployees.filter(emp => emp.role !== 'admin');
        
        for (const employee of regularEmployees.slice(0, 10)) { // Limit to first 10 for performance
          try {
            const existingRoles = await storage.getUserRoles(employee.employeeId);
            
            if (existingRoles.length === 0) {
              await storage.assignRoleToUser(employee.employeeId, employeeRole.id, "SYSTEM");
            }
          } catch (error) {
            // Skip on error
          }
        }
      }
    } catch (error) {
      console.error("[permissions] Error assigning default roles:", error);
    }
  }

  async hasPermission(employeeId: string, permissionName: string): Promise<boolean> {
    return await storage.hasPermission(employeeId, permissionName);
  }

  async getUserPermissions(employeeId: string) {
    return await storage.getUserPermissions(employeeId);
  }

  async getUserRoles(employeeId: string) {
    return await storage.getUserRoles(employeeId);
  }
}

export const permissionService = PermissionService.getInstance();