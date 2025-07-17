import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { insertEmployeeSchema, insertNotificationGroupSchema, insertMessageSchema, type Employee } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Extend Request type to include user property
interface AuthenticatedRequest extends Request {
  user: Employee;
}

// Create upload directory if it doesn't exist
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

// Generate random OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate session token
function generateSessionToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Session middleware
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionToken = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.sessionToken;
  
  if (!sessionToken) {
    return res.status(401).json({ message: "No session token provided" });
  }

  const session = await storage.getSessionByToken(sessionToken);
  if (!session) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }

  const employee = await storage.getEmployeeByEmployeeId(session.employeeId);
  if (!employee) {
    return res.status(401).json({ message: "Employee not found" });
  }

  (req as AuthenticatedRequest).user = employee;
  next();
}

// Admin middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as AuthenticatedRequest).user;
  if (user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<string, WebSocket>();

  wss.on('connection', (ws: WebSocket, req) => {
    let employeeId: string | null = null;

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'authenticate') {
          const session = await storage.getSessionByToken(data.token);
          if (session) {
            employeeId = session.employeeId;
            clients.set(employeeId, ws);
            ws.send(JSON.stringify({ type: 'authenticated', employeeId }));
          } else {
            ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token' }));
          }
        } else if (data.type === 'join_groups' && employeeId) {
          const groups = await storage.getNotificationGroupsByMember(employeeId);
          ws.send(JSON.stringify({ type: 'groups_joined', groups }));
        } else if (data.type === 'send_message' && employeeId) {
          const message = await storage.createMessage({
            groupId: data.groupId,
            senderId: employeeId,
            content: data.content
          });
          
          // Send to all group members
          const group = await storage.getNotificationGroup(data.groupId);
          if (group) {
            const messageWithSender = {
              ...message,
              senderName: (await storage.getEmployeeByEmployeeId(employeeId))?.name
            };
            
            group.members.forEach(memberId => {
              const memberWs = clients.get(memberId);
              if (memberWs && memberWs.readyState === WebSocket.OPEN) {
                memberWs.send(JSON.stringify({
                  type: 'new_message',
                  message: messageWithSender,
                  groupId: data.groupId
                }));
              }
            });
          }
        }
      } catch (error) {
        console.error('WebSocket error:', error);
      }
    });

    ws.on('close', () => {
      if (employeeId) {
        clients.delete(employeeId);
      }
    });
  });

  // Clean up expired sessions and OTP codes periodically
  setInterval(async () => {
    await storage.deleteExpiredSessions();
    await storage.deleteExpiredOtpCodes();
  }, 5 * 60 * 1000); // Every 5 minutes

  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    const filePath = path.join(uploadDir, req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "File not found" });
    }
  });

  // Authentication endpoints
  app.post('/api/auth/generate-otp', async (req, res) => {
    try {
      const { employeeId } = req.body;
      
      if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is required" });
      }

      const employee = await storage.getEmployeeByEmployeeId(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await storage.createOtpCode({
        employeeId,
        code: otpCode,
        expiresAt
      });

      // Send OTP via SMS if service is initialized
      if (process.env.FAST2SMS_API_KEY) {
        const { getSMSService } = await import('./services/sms');
        const smsService = getSMSService();
        if (smsService && employee.phoneNumber) {
          await smsService.sendOTP(employee.phoneNumber, otpCode);
        }
      }
      
      // Always log OTP in development
      console.log(`OTP for ${employeeId}: ${otpCode}`);
      
      res.json({ 
        message: "OTP sent successfully",
        phone: employee.phoneNumber ? employee.phoneNumber.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") : "***-***-****", // Mask phone number
        ...(process.env.NODE_ENV === 'development' && { devOtp: otpCode }) // Include OTP in development mode
      });
    } catch (error) {
      console.error('Generate OTP error:', error);
      res.status(500).json({ message: "Failed to generate OTP" });
    }
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { employeeId, otpCode } = req.body;
      
      if (!employeeId || !otpCode) {
        return res.status(400).json({ message: "Employee ID and OTP code are required" });
      }

      const validOtp = await storage.getValidOtpCode(employeeId, otpCode);
      if (!validOtp) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      const employee = await storage.getEmployeeByEmployeeId(employeeId);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Mark OTP as used
      await storage.markOtpAsUsed(validOtp.id);

      // Create session
      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await storage.createSession({
        employeeId,
        sessionToken,
        expiresAt
      });

      res.json({
        message: "Authentication successful",
        sessionToken,
        employee: {
          id: employee.id,
          employeeId: employee.employeeId,
          name: employee.name,
          email: employee.email,
          designation: employee.designation,
          department: employee.department,
          role: employee.role,
          profileImage: employee.profileImage
        }
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  app.get('/api/auth/me', requireAuth, async (req, res) => {
    const user = (req as AuthenticatedRequest).user;
    res.json({
      employee: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        designation: user.designation,
        department: user.department,
        role: user.role,
        profileImage: user.profileImage
      }
    });
  });

  app.post('/api/auth/logout', requireAuth, async (req, res) => {
    try {
      const sessionToken = req.headers.authorization?.replace("Bearer ", "") || req.cookies?.sessionToken;
      if (sessionToken) {
        await storage.deleteSession(sessionToken);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: "Failed to logout" });
    }
  });

  // Employee endpoints
  app.get('/api/employees', requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string || '';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const filters = {
        department: req.query.department as string,
        location: req.query.location as string,
        category: req.query.category as string,
        grade: req.query.grade as string,
        gender: req.query.gender as string,
        bloodGroup: req.query.bloodGroup as string,
      };

      const result = await storage.searchEmployees(query, filters, limit, offset);
      
      res.json({
        employees: result.employees,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      });
    } catch (error) {
      console.error('Get employees error:', error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get('/api/employees/filter-options', requireAuth, async (req, res) => {
    try {
      const options = await storage.getFilterOptions();
      res.json(options);
    } catch (error) {
      console.error('Get filter options error:', error);
      res.status(500).json({ message: "Failed to fetch filter options" });
    }
  });

  app.get('/api/employees/:id', requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json({ employee });
    } catch (error) {
      console.error('Get employee error:', error);
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post('/api/employees', requireAuth, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json({ employee });
    } catch (error) {
      console.error('Create employee error:', error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put('/api/employees/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(req.params.id, validatedData);
      res.json({ employee });
    } catch (error) {
      console.error('Update employee error:', error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete('/api/employees/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteEmployee(req.params.id);
      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      console.error('Delete employee error:', error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  app.post('/api/employees/:id/profile-image', requireAuth, upload.single('image'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Check if user is updating their own profile or is admin
      const user = (req as AuthenticatedRequest).user;
      if (user.id !== req.params.id && user.role !== 'admin') {
        return res.status(403).json({ message: "Can only update your own profile image" });
      }

      const fileName = `${Date.now()}-${req.file.originalname}`;
      const filePath = path.join(uploadDir, fileName);
      
      // Move file to final location
      fs.renameSync(req.file.path, filePath);

      // Update employee profile image
      const employee = await storage.updateEmployee(req.params.id, { profileImage: fileName });
      
      res.json({ 
        employee,
        profileImage: `/uploads/${fileName}`
      });
    } catch (error) {
      console.error('Upload profile image error:', error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  // Notification group endpoints
  app.get('/api/notification/groups', requireAuth, async (req, res) => {
    try {
      const groups = await storage.getNotificationGroupsByMember((req as AuthenticatedRequest).user.employeeId);
      res.json({ groups });
    } catch (error) {
      console.error('Get notification groups error:', error);
      res.status(500).json({ message: "Failed to fetch notification groups" });
    }
  });

  app.post('/api/notification/groups', requireAuth, async (req, res) => {
    try {
      const validatedData = insertNotificationGroupSchema.parse({
        ...req.body,
        createdBy: (req as AuthenticatedRequest).user.employeeId
      });
      
      const group = await storage.createNotificationGroup(validatedData);
      res.status(201).json({ group });
    } catch (error) {
      console.error('Create notification group error:', error);
      res.status(500).json({ message: "Failed to create notification group" });
    }
  });

  app.get('/api/notification/messages/:groupId', requireAuth, async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      // Check if user is member of the group
      const group = await storage.getNotificationGroup(groupId);
      if (!group || !group.members.includes((req as AuthenticatedRequest).user.employeeId)) {
        return res.status(403).json({ message: "Access denied to this group" });
      }

      const messages = await storage.getMessagesByGroup(groupId, limit, offset);
      
      // Get sender details for each message
      const messagesWithSenders = await Promise.all(
        messages.map(async (message) => {
          const sender = await storage.getEmployeeByEmployeeId(message.senderId);
          return {
            ...message,
            senderName: sender?.name || 'Unknown',
            senderProfileImage: sender?.profileImage
          };
        })
      );

      res.json({ messages: messagesWithSenders });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/notification/messages', requireAuth, async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        senderId: (req as AuthenticatedRequest).user.employeeId
      });

      // Check if user is member of the group
      const group = await storage.getNotificationGroup(validatedData.groupId);
      if (!group || !group.members.includes((req as AuthenticatedRequest).user.employeeId)) {
        return res.status(403).json({ message: "Access denied to this group" });
      }

      const message = await storage.createMessage(validatedData);
      res.status(201).json({ message });
    } catch (error) {
      console.error('Create message error:', error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  app.get('/api/notification/unread-count', requireAuth, async (req, res) => {
    try {
      const count = await storage.getUnreadMessageCount((req as AuthenticatedRequest).user.employeeId);
      res.json({ count });
    } catch (error) {
      console.error('Get unread count error:', error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  return httpServer;
}
