import { useState, useEffect } from 'react'
import { Group, Message, Employee, ChatData } from './types'

// Mock data generation functions
const generateEmployees = (count: number): Employee[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `emp-${i + 1}`,
    empCode: `E${1001 + i}`,
    name: `Employee ${i + 1}`,
    designation: 'Software Engineer',
    department: 'Technology',
    profileImage: `https://i.pravatar.cc/150?u=emp${i + 1}`,
  }))
}

const generateGroups = (count: number): Group[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `group-${i + 1}`,
    name: i === 0 ? 'Project Phoenix' : i === 1 ? 'Design Team' : `Group ${i + 1}`,
    avatar: `https://i.pravatar.cc/150?u=group${i + 1}`,
    memberCount: Math.floor(Math.random() * 20) + 3,
    lastMessage: 'Sounds good, let\'s sync up tomorrow.',
    lastMessageTime: '3:45 PM',
    unreadCount: i < 3 ? Math.floor(Math.random() * 5) : 0,
    isPinned: i < 2,
  }))
}

const generateMessages = (count: number): Message[] => {
  const users = [
    { id: 'user-1', name: 'You', avatar: 'https://i.pravatar.cc/150?u=you' },
    { id: 'user-2', name: 'Alice', avatar: 'https://i.pravatar.cc/150?u=alice' },
    { id: 'user-3', name: 'Bob', avatar: 'https://i.pravatar.cc/150?u=bob' },
  ];
  return Array.from({ length: count }, (_, i) => {
    const sender = users[Math.floor(Math.random() * users.length)];
    return {
      id: `msg-${i + 1}`,
      text: `This is message number ${i + 1}.`,
      timestamp: `4:${String(59 - i).padStart(2, '0')} PM`,
      sender: sender,
      status: sender.id === 'user-1' ? 'read' : 'sent',
      type: 'text',
    } as Message;
  });
};

export const useMockData = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [chatData, setChatData] = useState<ChatData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      setEmployees(generateEmployees(50))
      setGroups(generateGroups(15))
      setLoading(false)
    }, 1500)
  }, [])

  const fetchChatData = (groupId: string) => {
    setChatLoading(true)
    setChatData(null);
    const group = groups.find(g => g.id === groupId)
    if (group) {
      setTimeout(() => {
        setChatData({
          groupInfo: group,
          messages: generateMessages(30),
        })
        setChatLoading(false)
      }, 1000)
    }
  }

  return { employees, groups, chatData, loading, chatLoading, fetchChatData }
}