import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { db } from '@/lib/db'
import { messages as messagesTable, groupMembers, groups, employees } from '@/lib/database/schema'
import { eq, and, desc } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { PushNotificationSender } from '@/lib/push-notification-sender'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

interface SocketData {
  userId: string
  empCode: string
}

let io: SocketIOServer | null = null

export function initializeSocketServer(httpServer: HTTPServer) {
  if (io) return io

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true
    }
  })

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Authentication error'))
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any
      socket.data = {
        userId: decoded.sub,
        empCode: decoded.sub
      } as SocketData

      next()
    } catch (error) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {
    console.log('User connected:', socket.data.empCode)

    // Join user's groups
    socket.on('join-groups', async () => {
      try {
        const userGroups = await db
          .select({ groupId: groupMembers.groupId })
          .from(groupMembers)
          .where(eq(groupMembers.employeeId, socket.data.empCode))

        for (const { groupId } of userGroups) {
          socket.join(`group-${groupId}`)
        }

        socket.emit('groups-joined', userGroups.map(g => g.groupId))
      } catch (error) {
        console.error('Error joining groups:', error)
        socket.emit('error', { message: 'Failed to join groups' })
      }
    })

    // Handle sending messages
    socket.on('send-message', async (data: { groupId: number; content: string }) => {
      try {
        const { groupId, content } = data

        // Verify user is member of the group
        const membership = await db
          .select()
          .from(groupMembers)
          .where(
            and(
              eq(groupMembers.groupId, groupId),
              eq(groupMembers.employeeId, socket.data.empCode)
            )
          )
          .limit(1)

        if (membership.length === 0) {
          socket.emit('error', { message: 'Not authorized to send message to this group' })
          return
        }

        // Insert message
        const [newMessage] = await db
          .insert(messagesTable)
          .values({
            groupId,
            senderId: socket.data.empCode,
            content,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning()

        // Get sender details
        const [sender] = await db
          .select({ name: employees.name })
          .from(employees)
          .where(eq(employees.empCode, socket.data.empCode))
          .limit(1)

        const senderName = sender?.name || socket.data.empCode

        // Emit to all group members
        io?.to(`group-${groupId}`).emit('new-message', {
          id: newMessage.id.toString(),
          groupId: newMessage.groupId,
          content: newMessage.content,
          senderId: newMessage.senderId,
          senderName: senderName,
          createdAt: newMessage.createdAt,
          status: 'delivered'
        })

        // Update last message in group
        await db
          .update(groups)
          .set({ updatedAt: new Date() })
          .where(eq(groups.id, groupId))

        // Get group details
        const [group] = await db
          .select({ name: groups.name })
          .from(groups)
          .where(eq(groups.id, groupId))
          .limit(1)

        // Send push notifications to group members
        if (group) {
          await PushNotificationSender.sendMessageNotification(
            groupId,
            group.name,
            senderName,
            socket.data.empCode,
            content
          )
        }

      } catch (error) {
        console.error('Error sending message:', error)
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Handle typing indicators
    socket.on('typing-start', ({ groupId }: { groupId: number }) => {
      socket.to(`group-${groupId}`).emit('user-typing', {
        userId: socket.data.empCode,
        groupId
      })
    })

    socket.on('typing-stop', ({ groupId }: { groupId: number }) => {
      socket.to(`group-${groupId}`).emit('user-stop-typing', {
        userId: socket.data.empCode,
        groupId
      })
    })

    // Handle message read status
    socket.on('mark-messages-read', async ({ groupId }: { groupId: number }) => {
      try {
        // Update messages as read
        await db
          .update(messagesTable)
          .set({ isRead: true })
          .where(
            and(
              eq(messagesTable.groupId, groupId),
              eq(messagesTable.isRead, false)
            )
          )

        // Notify sender about read status
        socket.to(`group-${groupId}`).emit('messages-read', {
          groupId,
          readBy: socket.data.empCode
        })
      } catch (error) {
        console.error('Error marking messages as read:', error)
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.data.empCode)
    })
  })

  return io
}

export function getIO(): SocketIOServer | null {
  return io
}