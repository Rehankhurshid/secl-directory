import { Group, Message, Employee } from './types';

// Mock API functions - replace these with your actual API implementations

export const fetchGroups = async (token: string): Promise<Group[]> => {
  const response = await fetch('/api/messaging/groups', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch groups');
  }
  
  const data = await response.json();
  
  // Transform the API response to match our Group interface
  return data.map((group: any) => ({
    ...group,
    lastMessageTime: group.lastMessageTime ? new Date(group.lastMessageTime) : undefined,
  }));
};

export const fetchMessages = async (groupId: number, token: string): Promise<Message[]> => {
  const response = await fetch(`/api/messaging/groups/${groupId}/messages`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  
  const data = await response.json();
  
  // Transform the API response to match our Message interface
  return data.map((msg: any) => ({
    id: msg.id.toString(),
    text: msg.content,
    timestamp: msg.createdAt,
    sender: {
      id: msg.senderId,
      name: msg.senderName || msg.senderId,
    },
    status: msg.status || 'delivered',
  }));
};

export const fetchEmployees = async (token: string): Promise<Employee[]> => {
  // Fetch all employees without limit
  const response = await fetch('/api/employees?limit=50000', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch employees');
  }
  
  const data = await response.json();
  
  // Transform the API response to match our Employee interface
  return data.employees.map((emp: any) => ({
    id: emp.empCode,
    empCode: emp.empCode,
    name: emp.name,
    designation: emp.designation || 'Employee',
    department: emp.department || 'N/A',
    location: emp.location,
    profileImage: emp.profileImage,
    grade: emp.grade,
    category: emp.category,
    gender: emp.gender,
  }));
};