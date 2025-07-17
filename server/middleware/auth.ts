import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { AuthSession } from "@shared/schema";

// Extend Express Request interface to include auth info
declare global {
  namespace Express {
    interface Request {
      user?: {
        employeeId: string;
        session: AuthSession;
        employee?: import("@shared/schema").Employee;
        permissions?: import("@shared/schema").Permission[];
      };
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log("Auth middleware: No valid token provided", { authHeader });
      return res.status(401).json({ error: "No valid token provided" });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    console.log("Auth middleware: Token received", { tokenLength: token.length, tokenStart: token.substring(0, 10) });
    
    const session = await storage.getAuthSessionByToken(token);

    if (!session) {
      console.log("Auth middleware: Session not found for token");
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    // Check if session is expired
    if (new Date() > new Date(session.expiresAt)) {
      console.log("Auth middleware: Session expired", { expiresAt: session.expiresAt });
      return res.status(401).json({ error: "Session expired" });
    }

    // Get employee details for role checking
    const employee = await storage.getEmployeeByEmployeeId(session.employeeId);
    if (!employee) {
      console.log("Auth middleware: Employee not found", { employeeId: session.employeeId });
      return res.status(401).json({ error: "Employee not found" });
    }

    // Get user permissions
    const permissions = await storage.getUserPermissions(session.employeeId);

    // Add user info to request
    req.user = {
      employeeId: session.employeeId,
      session: session,
      employee: employee,
      permissions: permissions,
    };

    console.log("Auth middleware: Success", { employeeId: session.employeeId, role: employee.role });
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Optional auth middleware - doesn't fail if no auth provided
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = await storage.getAuthSessionByToken(token);

      if (session) {
        const employee = await storage.getEmployeeByEmployeeId(session.employeeId);
        if (employee) {
          // Get user permissions
          const permissions = await storage.getUserPermissions(session.employeeId);
          
          req.user = {
            employeeId: session.employeeId,
            session: session,
            employee: employee,
            permissions: permissions,
          };
        }
      }
    }

    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    next(); // Continue anyway for optional auth
  }
}

// Admin middleware - requires authentication and admin role
export async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user || !req.user.employee) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (req.user.employee.role !== 'admin') {
      return res.status(403).json({ error: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

// Permission checking middleware factory
export function requirePermission(permissionName: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.employeeId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const hasPermission = await storage.hasPermission(req.user.employeeId, permissionName);
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: "Permission denied", 
          required: permissionName 
        });
      }

      next();
    } catch (error) {
      console.error("Permission middleware error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

// Check if user has any of the provided permissions
export function requireAnyPermission(permissionNames: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.employeeId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const hasAnyPermission = await Promise.all(
        permissionNames.map(permission => storage.hasPermission(req.user!.employeeId, permission))
      );

      if (!hasAnyPermission.some(Boolean)) {
        return res.status(403).json({ 
          error: "Permission denied", 
          required: permissionNames.join(" OR ") 
        });
      }

      next();
    } catch (error) {
      console.error("Permission middleware error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}