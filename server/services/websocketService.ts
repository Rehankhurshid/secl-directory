import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';
import { storage } from '../storage';
import { authService } from './authService';
import { pushService } from './push-service';
import { Message } from '@shared/schema';

interface WebSocketConnection {
  ws: WebSocket;
  employeeId: string;
  isAuthenticated: boolean;
}

export class WebSocketService {
  private wss: WebSocketServer;
  private connections: Map<string, WebSocketConnection[]> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));
  }

  private verifyClient(info: { req: IncomingMessage }): boolean {
    // Basic verification - will do more detailed auth in handleConnection
    return true;
  }

  private async handleConnection(ws: WebSocket, request: IncomingMessage) {
    console.log('WebSocket connection established');
    
    let connection: WebSocketConnection = {
      ws,
      employeeId: '',
      isAuthenticated: false
    };

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleMessage(connection, message);
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      this.removeConnection(connection);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.removeConnection(connection);
    });
  }

  private async handleMessage(connection: WebSocketConnection, message: any) {
    const { type, data } = message;

    switch (type) {
      case 'auth':
        await this.handleAuth(connection, data);
        break;
      case 'join_groups':
        await this.handleJoinGroups(connection, data);
        break;
      case 'send_message':
        await this.handleSendMessage(connection, data);
        break;
      case 'mark_read':
        await this.handleMarkRead(connection, data);
        break;
      default:
        connection.ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
  }

  private async handleAuth(connection: WebSocketConnection, data: { sessionToken: string }) {
    try {
      console.log('WebSocket auth attempt with token:', data.sessionToken?.substring(0, 10) + '...');
      const session = await storage.getAuthSessionByToken(data.sessionToken);
      
      if (!session || !authService.isSessionValid(session)) {
        console.log('Invalid session or expired');
        connection.ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid session' }));
        return;
      }

      const employee = await storage.getEmployeeByEmployeeId(session.employeeId);
      if (!employee) {
        console.log('Employee not found:', session.employeeId);
        connection.ws.send(JSON.stringify({ type: 'auth_error', message: 'Employee not found' }));
        return;
      }

      connection.employeeId = session.employeeId;
      connection.isAuthenticated = true;

      // Add to connections map
      if (!this.connections.has(session.employeeId)) {
        this.connections.set(session.employeeId, []);
      }
      this.connections.get(session.employeeId)!.push(connection);

      console.log(`WebSocket authenticated: ${session.employeeId} (${employee.name})`);
      console.log(`Total connections for ${session.employeeId}: ${this.connections.get(session.employeeId)?.length}`);

      connection.ws.send(JSON.stringify({ 
        type: 'auth_success', 
        data: { employeeId: session.employeeId, name: employee.name }
      }));

    } catch (error) {
      console.error('Auth error:', error);
      connection.ws.send(JSON.stringify({ type: 'auth_error', message: 'Authentication failed' }));
    }
  }

  private async handleJoinGroups(connection: WebSocketConnection, data: { groupIds: number[] }) {
    if (!connection.isAuthenticated) {
      connection.ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
      return;
    }

    // Verify user is member of these groups
    const validGroups = [];
    for (const groupId of data.groupIds) {
      const isMember = await storage.isGroupMember(groupId, connection.employeeId);
      if (isMember) {
        validGroups.push(groupId);
      }
    }

    connection.ws.send(JSON.stringify({ 
      type: 'groups_joined', 
      data: { groupIds: validGroups }
    }));
  }

  private async handleSendMessage(connection: WebSocketConnection, data: { groupId: number, content: string }) {
    if (!connection.isAuthenticated) {
      connection.ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
      return;
    }

    try {
      // Verify user is member of the group
      const isMember = await storage.isGroupMember(data.groupId, connection.employeeId);
      if (!isMember) {
        connection.ws.send(JSON.stringify({ type: 'error', message: 'Not a member of this group' }));
        return;
      }

      // Create message
      const message = await storage.createMessage({
        groupId: data.groupId,
        senderId: connection.employeeId,
        content: data.content,
        messageType: 'text'
      });

      // Get sender info
      const sender = await storage.getEmployeeByEmployeeId(connection.employeeId);
      
      // Broadcast to all group members
      await this.broadcastToGroup(data.groupId, {
        type: 'new_message',
        data: {
          ...message,
          sender: {
            employeeId: sender?.employeeId,
            name: sender?.name
          }
        }
      });

      // Send push notifications to group members (excluding sender)
      await pushService.sendGroupMessageNotification(
        data.groupId,
        sender?.name || 'Someone',
        data.content,
        connection.employeeId
      );

    } catch (error) {
      console.error('Send message error:', error);
      connection.ws.send(JSON.stringify({ type: 'error', message: 'Failed to send message' }));
    }
  }

  private async handleMarkRead(connection: WebSocketConnection, data: { messageId: number }) {
    if (!connection.isAuthenticated) {
      connection.ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
      return;
    }

    try {
      await storage.markMessageAsRead(data.messageId, connection.employeeId);
      connection.ws.send(JSON.stringify({ type: 'message_read', data: { messageId: data.messageId } }));
    } catch (error) {
      console.error('Mark read error:', error);
      connection.ws.send(JSON.stringify({ type: 'error', message: 'Failed to mark message as read' }));
    }
  }

  public async broadcastToGroup(groupId: number, message: any) {
    try {
      const members = await storage.getGroupMembers(groupId);
      console.log(`Broadcasting to group ${groupId} with ${members.length} members:`, message.type);
      
      for (const member of members) {
        const connections = this.connections.get(member.employeeId) || [];
        console.log(`Employee ${member.employeeId} has ${connections.length} connections`);
        
        for (const connection of connections) {
          if (connection.ws.readyState === WebSocket.OPEN) {
            console.log(`Sending message to ${member.employeeId}`);
            connection.ws.send(JSON.stringify(message));
          } else {
            console.log(`Connection closed for ${member.employeeId}`);
          }
        }
      }
    } catch (error) {
      console.error('Broadcast error:', error);
    }
  }

  private removeConnection(connection: WebSocketConnection) {
    if (connection.employeeId) {
      const connections = this.connections.get(connection.employeeId) || [];
      const index = connections.indexOf(connection);
      if (index > -1) {
        connections.splice(index, 1);
      }
      
      if (connections.length === 0) {
        this.connections.delete(connection.employeeId);
      }
    }
  }

  public getActiveConnections(): number {
    let total = 0;
    for (const connections of this.connections.values()) {
      total += connections.length;
    }
    return total;
  }

  public isUserOnline(employeeId: string): boolean {
    return this.connections.has(employeeId);
  }
}