import { z } from 'zod';

// Employee validation schemas
export const createEmployeeSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .max(255, 'Email must be less than 255 characters'),
  
  employeeId: z.string()
    .min(1, 'Employee ID is required')
    .max(50, 'Employee ID must be less than 50 characters')
    .regex(/^[A-Z0-9]+$/, 'Employee ID can only contain uppercase letters and numbers'),
  
  department: z.string()
    .min(1, 'Department is required')
    .max(100, 'Department name too long'),
  
  designation: z.string()
    .min(1, 'Designation is required')
    .max(100, 'Designation too long'),
  
  phoneNumber: z.string()
    .regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Phone number must be in format (XXX) XXX-XXXX')
    .optional(),
  
  location: z.string()
    .max(100, 'Location too long')
    .optional(),
  
  grade: z.string()
    .max(20, 'Grade too long')
    .optional(),
  
  managerId: z.string().uuid('Invalid manager ID').optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export const employeeSearchSchema = z.object({
  query: z.string().max(255).optional(),
  department: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  grade: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  sortBy: z.enum(['name', 'department', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Message validation schemas
export const sendMessageSchema = z.object({
  content: z.string()
    .min(1, 'Message content is required')
    .max(1000, 'Message must be less than 1000 characters'),
  
  conversationId: z.string().uuid('Invalid conversation ID').optional(),
  recipientId: z.string().uuid('Invalid recipient ID').optional(),
  messageType: z.enum(['text', 'file', 'image']).default('text'),
});

export const createConversationSchema = z.object({
  name: z.string()
    .max(255, 'Conversation name too long')
    .optional(),
  
  type: z.enum(['direct', 'group']),
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
  
  participantIds: z.array(z.string().uuid('Invalid participant ID'))
    .min(1, 'At least one participant is required')
    .max(50, 'Too many participants'),
});

// Authentication schemas
export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase(),
  
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password too long'),
});

export const registerSchema = loginSchema.extend({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name too long'),
  
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// File upload schema
export const fileUploadSchema = z.object({
  fileName: z.string()
    .min(1, 'File name is required')
    .max(255, 'File name too long'),
  
  fileSize: z.number()
    .min(1, 'File size must be greater than 0')
    .max(10 * 1024 * 1024, 'File size must be less than 10MB'), // 10MB limit
  
  mimeType: z.string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-\^_]*$/, 'Invalid MIME type'),
});

// Utility schemas
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const emailSchema = z.string().email('Invalid email format').toLowerCase();
export const phoneSchema = z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Invalid phone format');

// API response schemas
export const apiErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
  statusCode: z.number(),
});

export const successResponseSchema = <T>(dataSchema: z.ZodSchema<T>) =>
  z.object({
    data: dataSchema,
    success: z.literal(true),
    message: z.string().optional(),
  });

export const paginatedResponseSchema = <T>(dataSchema: z.ZodSchema<T>) =>
  z.object({
    data: z.array(dataSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      totalCount: z.number(),
      totalPages: z.number(),
      hasNextPage: z.boolean(),
      hasPreviousPage: z.boolean(),
    }),
  });

// Type exports for use in components
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeSearchInput = z.infer<typeof employeeSearchSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>; 