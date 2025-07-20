# Complete Messaging Interface Redesign Request

I need a complete redesign of a messaging interface for an employee directory application. The current implementation has these components, but needs a modern, beautiful redesign with better UX.

## Current Components Structure:

### 1. MessagingDashboard (Conversation List Sidebar)
- Shows list of conversation groups
- Has search functionality
- Shows connection status
- Displays unread counts and last message preview
- Create new group button

### 2. ChatInterface (Main Chat Area)
- Chat header with group info
- Message list with date separators
- Message bubbles with timestamps and read receipts
- Typing indicators
- Message input with auto-resize

### 3. CreateGroupDialog
- Form to create new groups
- Group name and description inputs
- Employee selection with drawer
- Member list display

## Design Requirements:

1. **Modern Visual Design**
   - Use gradients, shadows, and modern color schemes
   - Smooth animations and transitions (using framer-motion)
   - Glass-morphism effects where appropriate
   - Beautiful hover states and micro-interactions

2. **Enhanced UX Features**
   - Swipe actions on mobile
   - Message reactions and quick replies
   - Voice message support
   - File/image sharing with previews
   - Message search within conversations
   - Pin important messages
   - Archive conversations
   - Notification settings per group

3. **Responsive Design**
   - Mobile-first approach
   - Slide-out sidebar on mobile
   - Bottom sheet patterns for mobile actions
   - Touch-friendly interface

4. **Performance**
   - Virtual scrolling for long message lists
   - Lazy loading for conversations
   - Optimistic UI updates
   - Skeleton loaders during data fetching

5. **Accessibility**
   - ARIA labels and roles
   - Keyboard navigation
   - Screen reader support
   - High contrast mode support

## Technical Stack:
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui components
- framer-motion for animations
- Socket.IO for real-time features

## Component Interfaces:

```typescript
interface Group {
  id: number
  name: string
  memberCount: number
  lastMessage?: string
  lastMessageTime?: Date
  unreadCount: number
}

interface Message {
  id: string
  text: string
  timestamp: string
  sender: {
    id: string
    name: string
  }
  status?: 'sending' | 'sent' | 'delivered' | 'read'
}

interface Employee {
  id: string
  empCode: string
  name: string
  designation?: string
  department?: string
  profileImage?: string
}
```

Please provide a complete, production-ready messaging interface with all components redesigned. Include proper TypeScript types, error handling, loading states, and empty states. Make it visually stunning with attention to detail in animations, transitions, and micro-interactions.

Focus on creating a WhatsApp/Telegram-like experience but tailored for professional workplace communication.