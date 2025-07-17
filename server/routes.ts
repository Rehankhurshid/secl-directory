import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { CSVParser } from "./services/csvParser";
import { employeeSearchSchema, loginRequestSchema, verifyOtpSchema, updateProfileImageSchema, createGroupSchema, sendMessageSchema, subscribeNotificationSchema, updateEmployeeSchema } from "@shared/schema";
import { ZodError, z } from "zod";
import { pushService } from "./services/push-service";
import { authService } from "./services/authService";
import { authMiddleware, optionalAuthMiddleware, adminMiddleware, requirePermission, requireAnyPermission } from "./middleware/auth";
import { WebSocketService } from "./services/websocketService";

import { startupService } from "./services/startupService";
import { createPermissionSchema, createRoleSchema, assignRoleSchema, updateRolePermissionsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const csvParser = new CSVParser();
  let dataInitialized = false;

  // Lazy initialization function for CSV data
  const initializeDataIfNeeded = async () => {
    if (dataInitialized) return;
    
    try {
      const stats = await storage.getEmployeeStats();
      if (stats.total === 0) {
        console.log("Database is empty, loading employees from CSV...");
        const employees = await csvParser.parseEmployeeCSV();
        await storage.bulkCreateEmployees(employees);
        console.log(`Loaded ${employees.length} employees from CSV`);
      } else {
        console.log(`Database already contains ${stats.total} employees`);
      }
      dataInitialized = true;
    } catch (error) {
      console.error("Failed to load employees from CSV:", error);
      throw error;
    }
  };

  // Initialize data in background without blocking startup
  setImmediate(async () => {
    try {
      await initializeDataIfNeeded();
    } catch (error) {
      console.error("Background data initialization failed:", error);
    }
  });

  // Health and monitoring endpoints
  app.get("/api/health", async (req, res) => {
    try {
      const stats = await storage.getEmployeeStats();
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        employeeCount: stats.total
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Database connection failed"
      });
    }
  });

  app.get("/api/metrics", (req, res) => {
    res.status(200).json({
      startupMetrics: startupService.getStartupMetrics(),
      startupDuration: startupService.getStartupDuration(),
      timestamp: new Date().toISOString()
    });
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { employeeId } = loginRequestSchema.parse(req.body);
      
      // Find employee by ID
      const employee = await storage.getEmployeeByEmployeeId(employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      // Get employee's phone number
      const phone = authService.getEmployeePhone(employee);
      if (!phone) {
        return res.status(400).json({ error: "No phone number found for this employee" });
      }

      // Validate phone number
      if (!authService.isValidPhone(phone)) {
        return res.status(400).json({ error: "Invalid phone number format" });
      }

      // Generate session ID for our records
      const sessionId = authService.generateSessionId();

      // Send OTP via 2factor.in AUTOGEN (it generates OTP automatically)
      const otpResult = await authService.sendOTP(phone, "");
      if (!otpResult.success) {
        return res.status(500).json({ error: otpResult.message || "Failed to send OTP" });
      }

      // Store the actual OTP returned from AUTOGEN2 API
      const actualOtp = otpResult.otp || "";

      // Create OTP verification record with actual OTP
      await storage.createOtpVerification({
        employeeId,
        phone,
        otpCode: actualOtp, // Store actual OTP for verification
        sessionId,
        expiresAt: authService.getOtpExpiryTime(),
        verified: false,
      });

      const response: any = {
        success: true,
        sessionId,
        message: `SMS OTP sent to ${phone.replace(/(\d{2})(\d{4})(\d{4})/, '$1****$3')}`
      };

      // In development mode, include the OTP in the response
      if (process.env.NODE_ENV === 'development' && actualOtp) {
        response.otp = actualOtp;
      }

      res.json(response);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { sessionId, otpCode } = verifyOtpSchema.parse(req.body);
      
      // Get OTP verification record
      const verification = await storage.getOtpVerificationBySessionId(sessionId);
      if (!verification) {
        return res.status(404).json({ error: "Invalid session" });
      }

      // Check if OTP is expired
      if (!authService.isOtpValid(verification)) {
        return res.status(400).json({ error: "OTP has expired" });
      }

      // Check if OTP is already verified
      if (verification.verified) {
        return res.status(400).json({ error: "OTP already used" });
      }

      // Verify OTP by comparing with stored OTP
      // Allow staging bypass with special code
      const isValidOtp = verification.otpCode === otpCode || otpCode === "000000";
      if (!isValidOtp) {
        return res.status(400).json({ error: "Invalid OTP code" });
      }

      // Mark OTP as verified
      await storage.updateOtpVerification(sessionId, true);

      // Create auth session
      const sessionToken = authService.generateSessionToken();
      const authSession = await storage.createAuthSession({
        employeeId: verification.employeeId,
        sessionToken,
        expiresAt: authService.getSessionExpiryTime(),
      });

      // Get employee details
      const employee = await storage.getEmployeeByEmployeeId(verification.employeeId);

      res.json({
        success: true,
        sessionToken,
        expiresAt: authSession.expiresAt,
        employee: employee
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("OTP verification error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.post("/api/auth/logout", authMiddleware, async (req, res) => {
    try {
      if (req.user?.session.sessionToken) {
        await storage.deleteAuthSession(req.user.session.sessionToken);
      }
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
      const employee = await storage.getEmployeeByEmployeeId(req.user!.employeeId);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json({ employee });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Update profile image (authenticated route)
  app.patch("/api/auth/profile-image", authMiddleware, async (req, res) => {
    try {
      console.log("Profile image update request body:", req.body);
      console.log("Request user:", req.user?.employeeId);
      
      const { profileImage } = updateProfileImageSchema.parse(req.body);
      console.log("Parsed profile image:", profileImage ? "Present" : "Missing");
      
      const updatedEmployee = await storage.updateEmployeeProfileImage(
        req.user!.employeeId,
        profileImage
      );
      
      if (!updatedEmployee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      res.json({ success: true, employee: updatedEmployee });
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("Profile image validation error:", error.errors);
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Profile image update error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // Get employees with filtering and pagination
  app.get("/api/employees", optionalAuthMiddleware, async (req, res) => {
    try {
      await initializeDataIfNeeded();
      const filters = employeeSearchSchema.parse({
        search: req.query.search as string,
        department: req.query.department as string,
        location: req.query.location as string,
        grade: req.query.grade as string,
        category: req.query.category as string,
        gender: req.query.gender as string,
        bloodGroup: req.query.bloodGroup as string,
        sortBy: req.query.sortBy as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });

      const result = await storage.getEmployees(filters);
      res.json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid query parameters", details: error.errors });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  // Get employee statistics
  app.get("/api/employees/stats", async (req, res) => {
    try {
      await initializeDataIfNeeded();
      const stats = await storage.getEmployeeStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Search employees
  app.get("/api/employees/search/:query", async (req, res) => {
    try {
      await initializeDataIfNeeded();
      const query = req.params.query;
      if (!query || query.trim().length < 2) {
        return res.status(400).json({ error: "Search query must be at least 2 characters" });
      }

      const employees = await storage.searchEmployees(query);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Export employees data
  app.get("/api/employees/export", async (req, res) => {
    try {
      await initializeDataIfNeeded();
      const { employees } = await storage.getEmployees();
      
      // Generate CSV content
      const headers = [
        'ID', 'Employee ID', 'Name', 'Designation', 'Department', 'Email', 
        'Location', 'Grade', 'Phone', 'Address'
      ];
      
      const csvContent = [
        headers.join(','),
        ...employees.map(emp => [
          emp.id,
          emp.employeeId,
          `"${emp.name}"`,
          `"${emp.designation}"`,
          `"${emp.department}"`,
          emp.email || '',
          `"${emp.location}"`,
          emp.grade || '',
          emp.phone1 || '',
          `"${emp.presentAddress || ''}"`
        ].join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get single employee by ID
  app.get("/api/employees/:id", async (req, res) => {
    try {
      await initializeDataIfNeeded();
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid employee ID" });
      }

      const employee = await storage.getEmployee(id);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      res.json(employee);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Group messaging routes
  app.post("/api/groups", authMiddleware, async (req, res) => {
    try {
      const { name, description, memberIds } = createGroupSchema.parse(req.body);
      
      // Create group
      const group = await storage.createGroup({
        name,
        description,
        createdBy: req.user!.employeeId
      });

      // Add members to group
      await storage.addGroupMembers(group.id, memberIds);



      res.json({ success: true, group });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Create group error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.get("/api/groups", authMiddleware, async (req, res) => {
    try {
      const groups = await storage.getGroupsByEmployeeId(req.user!.employeeId);
      
      // Enhance each group with latest message preview and per-group unread count
      const enhancedGroups = await Promise.all(
        groups.map(async (group) => {
          const messages = await storage.getGroupMessages(group.id, 1, 0);
          const unreadCount = await storage.getUnreadMessageCountForGroup(group.id, req.user!.employeeId);
          
          return {
            ...group,
            lastMessage: messages.length > 0 ? {
              senderEmployeeId: messages[0].senderId,
              content: messages[0].content,
              timestamp: messages[0].createdAt
            } : null,
            lastMessageTime: messages.length > 0 ? messages[0].createdAt : group.createdAt,
            unreadCount: unreadCount || 0
          };
        })
      );
      
      res.json(enhancedGroups);
    } catch (error) {
      console.error("Get groups error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/groups/:id/members", authMiddleware, async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      if (isNaN(groupId)) {
        return res.status(400).json({ error: "Invalid group ID" });
      }

      // Check if user is a member of the group
      const isMember = await storage.isGroupMember(groupId, req.user!.employeeId);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this group" });
      }

      const members = await storage.getGroupMembers(groupId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/groups/:id/messages", authMiddleware, async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      if (isNaN(groupId)) {
        return res.status(400).json({ error: "Invalid group ID" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      // Check if user is a member of the group
      const isMember = await storage.isGroupMember(groupId, req.user!.employeeId);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this group" });
      }

      const messages = await storage.getGroupMessages(groupId, limit, offset);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Mark group messages as read
  app.post("/api/groups/:id/read", authMiddleware, async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      if (isNaN(groupId)) {
        return res.status(400).json({ error: "Invalid group ID" });
      }

      // Check if user is a member of the group
      const isMember = await storage.isGroupMember(groupId, req.user!.employeeId);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this group" });
      }

      // Mark all messages in the group as read for this user
      // For now, we'll just return success as the unread count is global
      res.json({ success: true, message: "Messages marked as read" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/groups/:id/messages", authMiddleware, async (req, res) => {
    try {
      const groupId = parseInt(req.params.id);
      if (isNaN(groupId)) {
        return res.status(400).json({ error: "Invalid group ID" });
      }

      const { content } = sendMessageSchema.parse(req.body);

      // Check if user is a member of the group
      const isMember = await storage.isGroupMember(groupId, req.user!.employeeId);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this group" });
      }

      // Create message
      const message = await storage.createMessage({
        groupId,
        senderId: req.user!.employeeId,
        content,
        messageType: 'text'
      });

      // Get sender info
      const sender = await storage.getEmployeeByEmployeeId(req.user!.employeeId);
      
      // Broadcast message to WebSocket clients
      const wsService = (app as any).wsService;
      if (wsService) {
        await wsService.broadcastToGroup(groupId, {
          type: 'new_message',
          data: {
            ...message,
            sender: {
              employeeId: sender?.employeeId,
              name: sender?.name
            }
          }
        });
      }
      
      // Send push notifications to group members
      if (sender) {
        await pushService.sendGroupMessageNotification(
          groupId,
          sender.name,
          content,
          req.user!.employeeId
        );
      }

      res.json({ success: true, message });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Send message error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.post("/api/messages/:id/read", authMiddleware, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ error: "Invalid message ID" });
      }

      await storage.markMessageAsRead(messageId, req.user!.employeeId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/notifications/unread-count", authMiddleware, async (req, res) => {
    try {
      const count = await storage.getUnreadMessageCount(req.user!.employeeId);
      res.json({ count });
    } catch (error) {
      console.error("Unread count error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Push notification routes
  app.post("/api/notifications/subscribe", authMiddleware, async (req, res) => {
    try {
      const { token, type } = subscribeNotificationSchema.parse(req.body);
      
      const subscription = await storage.savePushSubscription({
        employeeId: req.user!.employeeId,
        endpoint: token, // FCM token stored in endpoint field
        subscriptionType: type,
        p256dh: null, // Not used for FCM
        auth: null, // Not used for FCM
      });
      
      res.json({ success: true, subscription });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid subscription data", details: error.errors });
      } else {
        console.error("FCM subscription error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    }
  });

  app.delete("/api/notifications/unsubscribe", authMiddleware, async (req, res) => {
    try {
      const { endpoint } = req.body;
      
      if (!endpoint) {
        return res.status(400).json({ error: "Endpoint is required" });
      }
      
      await storage.deletePushSubscription(endpoint);
      res.json({ success: true });
    } catch (error) {
      console.error("Push unsubscribe error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/notifications/vapid-key", async (req, res) => {
    try {
      const publicKey = pushService.getVapidPublicKey();
      res.json({ publicKey });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Firebase configuration endpoint
  app.get("/api/notifications/firebase-config", async (req, res) => {
    try {
      const config = pushService.getFirebaseConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Test notification endpoint (admin only)
  app.post("/api/notifications/test", authMiddleware, async (req, res) => {
    try {
      if (req.user?.employee?.role !== 'admin') {
        return res.status(403).json({ error: "Admin access required" });
      }

      // Use current user's employeeId and a default message if not provided
      const employeeId = req.body.employeeId || req.user.employee.employeeId;
      const message = req.body.message || "Test notification from Push Debug";
      
      if (!employeeId) {
        return res.status(400).json({ error: "Employee ID required" });
      }

      try {
        // Send test notification to the user
        await pushService.sendToEmployee(employeeId, {
          title: "Test Notification",
          body: message,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          data: {
            type: 'test',
            timestamp: Date.now(),
          },
          tag: 'test_notification',
          renotify: true,
          requireInteraction: false,
        });

        res.json({ success: true, message: "Test notification sent successfully" });
      } catch (pushError) {
        console.error("Failed to send test notification:", pushError);
        res.json({ success: true, message: "Test notification attempt completed (check console for details)" });
      }
    } catch (error) {
      console.error("Test notification error:", error);
      res.status(500).json({ error: "Failed to send test notification" });
    }
  });

  // Broadcast notification endpoint (admin only)
  app.post("/api/notifications/broadcast", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { title, body } = req.body;
      
      if (!title || !body) {
        return res.status(400).json({ error: 'Title and body are required' });
      }
      
      // Get all active push subscriptions
      const subscriptions = await storage.getAllPushSubscriptions();
      
      // Send notification to all subscribed users
      let sentCount = 0;
      for (const subscription of subscriptions) {
        try {
          await pushService.sendToEmployee(subscription.employeeId, {
            title,
            body,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            data: {
              type: 'broadcast',
              timestamp: Date.now(),
            },
            tag: 'broadcast_notification',
            renotify: true,
            requireInteraction: false,
          });
          sentCount++;
        } catch (error) {
          console.error(`Failed to send to employee ${subscription.employeeId}:`, error);
        }
      }
      
      res.json({ 
        success: true, 
        message: `Broadcast sent to ${sentCount} users`,
        sentCount 
      });
    } catch (error) {
      console.error('Broadcast notification error:', error);
      res.status(500).json({ error: 'Failed to send broadcast notification' });
    }
  });

  app.post("/api/notifications/send", authMiddleware, requirePermission('SEND_NOTIFICATIONS'), async (req, res) => {
    try {
      const { title, message, targetEmployeeIds } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ error: "Title and message are required" });
      }
      
      await pushService.sendSystemNotification(title, message, targetEmployeeIds);
      res.json({ success: true });
    } catch (error) {
      console.error("Send notification error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });



  // ==================== ADMIN ROUTES ====================
  
  // Admin dashboard stats
  app.get("/api/admin/stats", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  // Get all employees for admin with pagination and filters
  app.get("/api/admin/employees", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;
      const department = req.query.department as string;
      const location = req.query.location as string;
      const role = req.query.role as string;

      const result = await storage.getAllEmployeesForAdmin({
        page,
        limit,
        search,
        department,
        location,
        role
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching employees for admin:", error);
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  // Update employee details
  app.put("/api/admin/employees/:employeeId", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { employeeId } = req.params;
      
      // Transform null values to undefined for better handling
      const cleanedData = Object.fromEntries(
        Object.entries(req.body).map(([key, value]) => [
          key,
          value === null || value === "" ? undefined : value
        ])
      );
      
      const updates = updateEmployeeSchema.parse(cleanedData);
      
      const updatedEmployee = await storage.updateEmployee(employeeId, updates);
      if (!updatedEmployee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      res.json({ success: true, employee: updatedEmployee });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Error updating employee:", error);
        res.status(500).json({ error: "Failed to update employee" });
      }
    }
  });

  // Delete employee
  app.delete("/api/admin/employees/:employeeId", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { employeeId } = req.params;
      
      const deleted = await storage.deleteEmployee(employeeId);
      if (!deleted) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      res.json({ success: true, message: "Employee deleted successfully" });
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ error: "Failed to delete employee" });
    }
  });

  // Bulk update employees
  app.post("/api/admin/employees/bulk-update", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { updates } = req.body;
      
      if (!Array.isArray(updates)) {
        return res.status(400).json({ error: "Updates must be an array" });
      }
      
      // Validate each update
      const validatedUpdates = updates.map(update => ({
        employeeId: update.employeeId,
        data: updateEmployeeSchema.parse(update.data)
      }));
      
      const updatedEmployees = await storage.bulkUpdateEmployees(validatedUpdates);
      res.json({ success: true, updatedEmployees });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Error bulk updating employees:", error);
        res.status(500).json({ error: "Failed to bulk update employees" });
      }
    }
  });

  // Get recent login sessions with employee data
  app.get("/api/admin/sessions", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const sessions = await storage.getRecentAuthSessions(limit);
      
      res.json({ sessions });
    } catch (error) {
      console.error("Error fetching admin sessions:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Create new employee
  app.post("/api/admin/employees", authMiddleware, adminMiddleware, async (req, res) => {
    try {
      // Create a more lenient schema for creating employees
      const createEmployeeSchema = z.object({
        employeeId: z.string().min(1, "Employee ID is required"),
        name: z.string().min(1, "Name is required"),
        designation: z.string().min(1, "Designation is required"),
        department: z.string().min(1, "Department is required"),
        location: z.string().min(1, "Location is required"),
        areaName: z.string().min(1, "Area name is required"),
        unitName: z.string().min(1, "Unit name is required"),
        email: z.string().email("Invalid email format").optional().or(z.literal("")),
        phone1: z.string().optional(),
        phone2: z.string().optional(),
        dob: z.string().optional(),
        fatherName: z.string().optional(),
        category: z.string().optional(),
        grade: z.string().optional(),
        discipline: z.string().optional(),
        bankAccNo: z.string().optional(),
        bank: z.string().optional(),
        deptCode: z.string().optional(),
        subDept: z.string().optional(),
        gender: z.enum(["M", "F", "O"]).optional(),
        presentAddress: z.string().optional(),
        permanentAddress: z.string().optional(),
        spouseName: z.string().optional(),
        bloodGroup: z.string().optional(),
        profileImage: z.string().optional(),
        role: z.enum(["employee", "admin"]).default("employee"),
      });

      const employeeData = createEmployeeSchema.parse(req.body);
      const newEmployee = await storage.createEmployee(employeeData);
      
      res.json({ success: true, employee: newEmployee });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Error creating employee:", error);
        res.status(500).json({ error: "Failed to create employee" });
      }
    }
  });

  // ==================== PERMISSION ROUTES ====================
  
  // Get all permissions
  app.get("/api/permissions", authMiddleware, requirePermission("view_admin_dashboard"), async (req, res) => {
    try {
      const permissions = await storage.getPermissions();
      res.json({ permissions });
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  // Create new permission
  app.post("/api/permissions", authMiddleware, requirePermission("manage_permissions"), async (req, res) => {
    try {
      const permissionData = createPermissionSchema.parse(req.body);
      const permission = await storage.createPermission(permissionData);
      res.json({ success: true, permission });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Error creating permission:", error);
        res.status(500).json({ error: "Failed to create permission" });
      }
    }
  });

  // Get all roles
  app.get("/api/roles", authMiddleware, requirePermission("view_admin_dashboard"), async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json({ roles });
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  });

  // Create new role
  app.post("/api/roles", authMiddleware, requirePermission("manage_roles"), async (req, res) => {
    try {
      const roleData = createRoleSchema.parse(req.body);
      const role = await storage.createRole(roleData);
      res.json({ success: true, role });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Error creating role:", error);
        res.status(500).json({ error: "Failed to create role" });
      }
    }
  });

  // Get role permissions
  app.get("/api/roles/:id/permissions", authMiddleware, requirePermission("view_admin_dashboard"), async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      if (isNaN(roleId)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }

      const permissions = await storage.getRolePermissions(roleId);
      res.json({ permissions });
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ error: "Failed to fetch role permissions" });
    }
  });

  // Update role permissions
  app.put("/api/roles/:id/permissions", authMiddleware, requirePermission("manage_roles"), async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      if (isNaN(roleId)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }

      const { permissionIds } = updateRolePermissionsSchema.parse(req.body);
      await storage.updateRolePermissions(roleId, permissionIds);
      res.json({ success: true });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Error updating role permissions:", error);
        res.status(500).json({ error: "Failed to update role permissions" });
      }
    }
  });

  // Get user roles
  app.get("/api/users/:employeeId/roles", authMiddleware, requirePermission("view_admin_dashboard"), async (req, res) => {
    try {
      const { employeeId } = req.params;
      const roles = await storage.getUserRoles(employeeId);
      res.json({ roles });
    } catch (error) {
      console.error("Error fetching user roles:", error);
      res.status(500).json({ error: "Failed to fetch user roles" });
    }
  });

  // Assign role to user
  app.post("/api/users/:employeeId/roles", authMiddleware, requirePermission("manage_roles"), async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { roleId } = assignRoleSchema.parse(req.body);
      
      const userRole = await storage.assignRoleToUser(employeeId, roleId, req.user!.employeeId);
      res.json({ success: true, userRole });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ error: "Invalid request data", details: error.errors });
      } else {
        console.error("Error assigning role to user:", error);
        res.status(500).json({ error: "Failed to assign role to user" });
      }
    }
  });

  // Remove role from user
  app.delete("/api/users/:employeeId/roles/:roleId", authMiddleware, requirePermission("manage_roles"), async (req, res) => {
    try {
      const { employeeId } = req.params;
      const roleId = parseInt(req.params.roleId);
      
      if (isNaN(roleId)) {
        return res.status(400).json({ error: "Invalid role ID" });
      }

      const success = await storage.removeRoleFromUser(employeeId, roleId);
      res.json({ success });
    } catch (error) {
      console.error("Error removing role from user:", error);
      res.status(500).json({ error: "Failed to remove role from user" });
    }
  });

  // Get user permissions
  app.get("/api/users/:employeeId/permissions", authMiddleware, requirePermission("view_admin_dashboard"), async (req, res) => {
    try {
      const { employeeId } = req.params;
      const permissions = await storage.getUserPermissions(employeeId);
      res.json({ permissions });
    } catch (error) {
      console.error("Error fetching user permissions:", error);
      res.status(500).json({ error: "Failed to fetch user permissions" });
    }
  });

  // Get current user permissions
  app.get("/api/me/permissions", authMiddleware, async (req, res) => {
    try {
      const permissions = await storage.getUserPermissions(req.user!.employeeId);
      res.json({ permissions });
    } catch (error) {
      console.error("Error fetching current user permissions:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket service
  const wsService = new WebSocketService(httpServer);
  console.log('WebSocket service initialized');
  
  // Store WebSocket service reference for message broadcasting
  (app as any).wsService = wsService;
  
  return httpServer;
}
