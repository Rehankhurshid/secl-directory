# V0 Prompts for Messaging UI Components

## 1. Messaging Dashboard Component

Create a comprehensive messaging dashboard for an employee directory PWA with the following requirements:

**Layout Structure:**
- Split view: Group list on left (1/3 width on desktop, full width on mobile)
- Chat area on right (2/3 width on desktop, full screen on mobile)
- Mobile: Stack vertically with navigation between views
- Header with connection status indicator and create group button

**Group List Features:**
- Group cards with:
  - Group name and member count
  - Last message preview (truncated to 2 lines)
  - Unread message count badge
  - Timestamp of last message
  - Group avatar with fallback initials
- Real-time updates for new messages
- Search/filter groups functionality
- Loading skeletons while fetching

**Connection Status:**
- WebSocket connection indicator (green dot when connected)
- "Connecting..." state
- Offline mode indicator
- Reconnection status

**Responsive Design:**
- Mobile: Full screen group list, tap to open chat
- Tablet: Collapsible sidebar
- Desktop: Always show both panels
- Touch-friendly with 44px minimum touch targets

Use shadcn/ui components (Card, Badge, ScrollArea, Skeleton), TypeScript, and Tailwind CSS.

## 2. WhatsApp-Style Chat Interface

Create a modern chat interface similar to WhatsApp Web with these features:

**Header:**
- Group name and member count
- Back button (mobile only)
- Group info button
- Connection status indicator

**Message Area:**
- Scrollable message list with auto-scroll to bottom
- Message bubbles:
  - Sender messages: right-aligned, primary color
  - Others: left-aligned, muted background
  - Sender name above message (for others)
  - Timestamp below message
  - Read receipts (single/double check marks)
- Date separators between different days
- "New messages" divider for unread messages
- Loading states and skeleton messages

**Message Input:**
- Sticky bottom input area
- Text input with auto-resize
- Send button (disabled when empty)
- Typing indicator support
- Character limit indicator

**Mobile Optimizations:**
- Proper keyboard handling
- Safe area padding for iOS
- Swipe gestures for navigation
- Touch-friendly message selection

Use shadcn/ui (Input, Button, ScrollArea, Avatar), TypeScript, Tailwind CSS, and include proper TypeScript interfaces.

## 3. Create Group Dialog

Design a modal dialog for creating new messaging groups:

**Dialog Structure:**
- Modal overlay with backdrop
- Header: "Create New Group"
- Close button (X)
- Form sections with proper spacing

**Form Fields:**
1. Group Name:
   - Required field
   - 3-50 characters
   - Real-time validation
   - Error messages

2. Description:
   - Optional textarea
   - 0-200 characters
   - Character counter

3. Member Selection:
   - Searchable employee list
   - Checkbox selection
   - Selected members chip display
   - "Select All" / "Clear All" options
   - Member count indicator
   - Minimum 2 members validation

**Member List Item:**
- Employee avatar with fallback
- Name and designation
- Department
- Checkbox aligned right

**Actions:**
- Cancel button (secondary)
- Create Group button (primary, disabled until valid)
- Loading state during creation

**Responsive:**
- Full screen modal on mobile
- Centered modal on desktop
- Scrollable member list
- Virtual scrolling for large lists

Use shadcn/ui (Dialog, Form, Input, Textarea, Checkbox, ScrollArea, Avatar, Badge), React Hook Form, Zod validation, TypeScript.

## 4. Message Status Component

Create a reusable message status indicator:

**States:**
- Sending: Clock icon
- Sent: Single checkmark
- Delivered: Double checkmark
- Read: Double blue checkmark
- Failed: Red exclamation with retry option

**Features:**
- Smooth transitions between states
- Tooltips on hover
- Accessible ARIA labels
- Small size (12-14px icons)

## 5. Connection Status Banner

Create a connection status banner component:

**Online State:**
- Green dot with "Connected" text
- Fade in/out animation
- Auto-hide after 3 seconds

**Offline State:**
- Red/yellow banner
- "You're offline - Messages will be sent when you reconnect"
- WiFi off icon
- Persistent display

**Reconnecting State:**
- Orange dot with pulsing animation
- "Reconnecting..." text
- Retry button after 10 seconds

Use shadcn/ui components, Tailwind CSS animations, and TypeScript.