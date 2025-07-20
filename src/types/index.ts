// Branded types for type safety
export type EmployeeId = string & { __brand: 'EmployeeId' };
export type ConversationId = string & { __brand: 'ConversationId' };
export type MessageId = string & { __brand: 'MessageId' };
export type DepartmentId = string & { __brand: 'DepartmentId' };

// Employee-related types
export interface Employee {
  id: EmployeeId;
  employeeId: string; // Company employee ID (e.g., "EMP001")
  name: string;
  email: string;
  department: string;
  designation: string;
  phoneNumber?: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Additional fields for directory functionality
  manager?: Employee;
  directReports?: Employee[];
  location?: string;
  grade?: string;
  joinDate?: Date;
}

export interface Department {
  id: DepartmentId;
  name: string;
  description?: string;
  managerId?: EmployeeId;
  employeeCount: number;
  createdAt: Date;
}

// Messaging-related types
export interface Message {
  id: MessageId;
  conversationId: ConversationId;
  senderId: EmployeeId;
  content: string;
  messageType: 'text' | 'file' | 'image';
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: Date;
  editedAt?: Date;
  
  // Additional metadata
  replyTo?: MessageId;
  attachments?: FileAttachment[];
}

export interface Conversation {
  id: ConversationId;
  name?: string; // For group conversations
  type: 'direct' | 'group';
  participants: EmployeeId[];
  createdBy: EmployeeId;
  createdAt: Date;
  lastMessageAt?: Date;
  
  // Group conversation specific
  description?: string;
  isArchived: boolean;
}

export interface FileAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedAt: Date;
}

// Search and filtering types
export interface EmployeeSearchFilters {
  query?: string;
  department?: string;
  location?: string;
  grade?: string;
  isActive?: boolean;
}

export interface EmployeeSearchResults {
  employees: Employee[];
  totalCount: number;
  hasNextPage: boolean;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Real-time messaging types
export interface TypingIndicator {
  conversationId: ConversationId;
  userId: EmployeeId;
  isTyping: boolean;
}

export interface MessageDeliveryStatus {
  messageId: MessageId;
  userId: EmployeeId;
  status: 'delivered' | 'read';
  timestamp: Date;
}

// User session and auth types
export interface User {
  id: EmployeeId;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  permissions: string[];
  isOnline: boolean;
  lastSeen?: Date;
}

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

// PWA and offline types
export interface OfflineAction {
  id: string;
  type: 'send_message' | 'update_profile' | 'mark_read';
  payload: any;
  timestamp: Date;
  retryCount: number;
}

export interface AppState {
  isOnline: boolean;
  isInstalled: boolean;
  notificationsEnabled: boolean;
  offlineActions: OfflineAction[];
}

// Form types for validation
export interface CreateEmployeeForm {
  name: string;
  email: string;
  department: string;
  designation: string;
  phoneNumber?: string;
  managerId?: EmployeeId;
}

export interface SendMessageForm {
  conversationId?: ConversationId;
  recipientId?: EmployeeId;
  content: string;
  attachments?: File[];
}

// Component prop types
export interface EmployeeCardProps {
  employee: Employee;
  variant?: 'compact' | 'detailed';
  onSelect?: (employee: Employee) => void;
  className?: string;
}

export interface MessageBubbleProps {
  message: Message;
  sender: Employee;
  isOwn: boolean;
  showAvatar?: boolean;
  onReply?: (message: Message) => void;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type CreateEmployeeData = Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>;
export type UpdateEmployeeData = Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateMessageData = Omit<Message, 'id' | 'createdAt' | 'status'>;
export type UpdateMessageData = Partial<Pick<Message, 'content' | 'editedAt'>>; 