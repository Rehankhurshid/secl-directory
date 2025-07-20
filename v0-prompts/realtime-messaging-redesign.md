# V0 Prompt: Real-Time Messaging Interface Redesign

## Current System Analysis

We have a working real-time messaging system for an employee directory PWA with these features:

- WebSocket-based real-time messaging (working perfectly)
- Message persistence with localStorage
- Typing indicators across multiple users
- Online presence indicators
- Real employee authentication (employee codes like ADMIN001, 90145293)
- Message status tracking (pending → sent → delivered)
- Cross-browser messaging between different employees

## Design Challenge

**Redesign the entire messaging interface with modern, professional styling suitable for corporate employees while maintaining all existing functionality.**

## Requirements

### 🎨 **Visual Design**

- **Corporate Professional**: Clean, modern design suitable for business use
- **Dark Mode Ready**: Seamless dark/light theme support
- **Microinteractions**: Subtle animations for message status, typing, connections
- **Visual Hierarchy**: Clear distinction between conversations, messages, and actions
- **Loading States**: Elegant skeletons and transition states

### 📱 **Layout Structure**

```
┌─────────────────────────────────────────────────────────────┐
│ Header: SECL Directory | Connection Status | Theme | User   │
├─────────────┬───────────────────────────────────────────────┤
│             │ Chat Header: Conversation Name | Members     │
│ Conversation├───────────────────────────────────────────────┤
│ List        │                                               │
│ - General   │        Message Area                         │
│ - Dev Team  │        (Scrollable, auto-scroll to bottom)  │
│ - Direct    │                                               │
│             ├───────────────────────────────────────────────┤
│             │ Typing: "John is typing..."                 │
│             ├───────────────────────────────────────────────┤
│             │ Input: [Message] [📎] [😊] [Send]           │
└─────────────┴───────────────────────────────────────────────┘
```

### 💬 **Conversation List (Left Panel)**

- **Search Bar**: Filter conversations in real-time
- **Conversation Cards**: Each showing:
  - Group/person name with online indicator
  - Last message preview (max 2 lines, truncated)
  - Timestamp (smart formatting: "now", "5m", "2h", "Mon")
  - Unread count badge (only if > 0)
  - Connection status per conversation
- **Create Button**: Floating action button for new groups
- **Loading States**: Skeleton cards while loading
- **Empty State**: Friendly message when no conversations

### 💭 **Message Area (Right Panel)**

- **Message Bubbles**:
  - **Own messages**: Right-aligned, primary color with subtle gradient
  - **Others**: Left-aligned, neutral background
  - **Sender Info**: Name + timestamp for others' messages
  - **Status Icons**: ⏱️ (pending) → 📤 (sent) → ✅ (delivered) → 👁️ (read)
  - **Message Grouping**: Consecutive messages from same sender grouped together
- **Date Separators**: "Today", "Yesterday", "Monday" between message groups
- **Auto-scroll**: Smooth scroll to bottom on new messages
- **Message Actions**: Hover to show timestamp, copy, react (future)

### ⌨️ **Input Area (Bottom)**

- **Smart Input**: Auto-resize textarea (max 4 lines)
- **Send Button**:
  - Disabled when empty
  - Loading spinner when sending
  - Smooth color transitions
- **Typing Indicator**: "John Doe is typing..." with animated dots
- **Character Count**: Subtle indicator approaching limits
- **Attachment Button**: Ready for future file uploads
- **Emoji Button**: Ready for future emoji picker

### 🔌 **Connection Management**

- **Status Indicator**:
  - 🟢 Connected
  - 🟡 Connecting... (with pulse animation)
  - 🔴 Disconnected (with retry button)
- **Reconnection**: Automatic with user feedback
- **Offline Mode**: Clear indication when offline

### 📱 **Mobile Responsive**

- **Mobile View**: Stack conversations and chat (like WhatsApp)
- **Navigation**: Smooth transitions between list and chat
- **Touch Targets**: Minimum 44px for all interactive elements
- **Keyboard Handling**: Proper viewport adjustment
- **Safe Areas**: iOS notch and bottom bar support

## Technical Specifications

### 🛠 **Technology Stack**

- **Framework**: React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State**: React hooks (no external state management)
- **WebSocket**: Existing wsManager integration
- **Storage**: localStorage for persistence

### 🔧 **Component Architecture**

```typescript
// Main layout component
<RealtimeMessagingInterface>
  <MessagingHeader user={employee} connectionStatus={status} />

  <div className="flex h-full">
    <ConversationSidebar
      conversations={conversations}
      selectedId={selectedConversation}
      onSelect={setSelectedConversation}
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
    />

    <ChatArea
      conversationId={selectedConversation}
      messages={messages}
      onSendMessage={sendMessage}
      typingUsers={typingUsers}
      onTyping={sendTypingIndicator}
      connectionStatus={status}
    />
  </div>
</RealtimeMessagingInterface>
```

### 💾 **Data Integration**

```typescript
// Must work with existing data structure
interface Message {
  id: string;
  conversationId: string;
  senderId: string; // Employee codes like "ADMIN001", "90145293"
  content: string;
  type: "text" | "image" | "file";
  status: "pending" | "sent" | "delivered" | "read";
  createdAt: Date;
}

interface Employee {
  empCode: string; // "ADMIN001", "90145293"
  name: string; // "System Admin", "John Doe"
  department?: string;
  designation?: string;
}
```

## Success Criteria

✅ **Visual Polish**: Looks like a modern corporate messaging app (Teams/Slack level)
✅ **Responsive**: Perfect on mobile, tablet, desktop
✅ **Accessible**: ARIA labels, keyboard navigation, color contrast
✅ **Performance**: Smooth animations, no layout shifts
✅ **Professional**: Suitable for 2,800+ employee corporate environment
✅ **Integration Ready**: Drop-in replacement for current components

## Additional Context

- **Company**: SECL (South Eastern Coalfields Limited)
- **Users**: Corporate employees across departments
- **Use Case**: Internal team communication and coordination
- **Current Status**: Basic functionality working, needs design upgrade
- **Theme**: Professional coal mining industry corporate aesthetic

Please create a complete, production-ready React component with beautiful modern styling that we can immediately integrate into our existing SECL messaging system.
