const WebSocket = require('ws');
const http = require('http');

// Production configuration
const PORT = process.env.PORT || 3002;
const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production' 
  ? [
      'https://secl-directory.vercel.app',
      'https://secl.co.in',
      'https://www.secl.co.in'
    ]
  : ['http://localhost:3000'];

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
  // Enable CORS for health checks
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy',
      connections: wss.clients.size,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  verifyClient: (info) => {
    const origin = info.origin || info.req.headers.origin;
    
    // Allow if no origin (e.g., mobile apps)
    if (!origin) return true;
    
    // Check against allowed origins
    const isAllowed = ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
    
    if (!isAllowed) {
      console.log(`Rejected connection from origin: ${origin}`);
    }
    
    return isAllowed;
  }
});

// Store connected clients with metadata
const clients = new Map();

wss.on('connection', (ws, req) => {
  const clientId = generateClientId();
  const clientInfo = {
    id: clientId,
    ws: ws,
    userId: null,
    groupIds: [],
    connectedAt: new Date()
  };
  
  clients.set(clientId, clientInfo);
  console.log(`Client connected: ${clientId}`);
  
  // Send connection confirmation
  ws.send(JSON.stringify({
    type: 'connection',
    clientId: clientId,
    message: 'Connected to SECL WebSocket server'
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(clientId, data);
    } catch (error) {
      console.error('Invalid message format:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });
  
  ws.on('close', () => {
    console.log(`Client disconnected: ${clientId}`);
    clients.delete(clientId);
  });
  
  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
  });
  
  // Ping to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);
});

function handleMessage(clientId, data) {
  const client = clients.get(clientId);
  if (!client) return;
  
  switch (data.type) {
    case 'auth':
      // Store user info
      client.userId = data.userId;
      client.groupIds = data.groupIds || [];
      console.log(`Client ${clientId} authenticated as user ${data.userId}`);
      break;
      
    case 'join':
      // Join a group
      if (data.groupId && !client.groupIds.includes(data.groupId)) {
        client.groupIds.push(data.groupId);
        console.log(`Client ${clientId} joined group ${data.groupId}`);
      }
      break;
      
    case 'leave':
      // Leave a group
      client.groupIds = client.groupIds.filter(id => id !== data.groupId);
      console.log(`Client ${clientId} left group ${data.groupId}`);
      break;
      
    case 'message':
      // Broadcast message to group members
      broadcastToGroup(data.groupId, {
        type: 'message',
        groupId: data.groupId,
        message: data.message,
        userId: client.userId,
        timestamp: new Date().toISOString()
      }, clientId);
      break;
      
    case 'typing':
      // Broadcast typing indicator
      broadcastToGroup(data.groupId, {
        type: 'typing',
        groupId: data.groupId,
        userId: client.userId,
        isTyping: data.isTyping
      }, clientId);
      break;
      
    case 'ping':
      // Respond to ping
      client.ws.send(JSON.stringify({ type: 'pong' }));
      break;
      
    default:
      console.log(`Unknown message type: ${data.type}`);
  }
}

function broadcastToGroup(groupId, message, excludeClientId = null) {
  let count = 0;
  
  clients.forEach((client, clientId) => {
    if (client.groupIds.includes(groupId) && 
        clientId !== excludeClientId && 
        client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
      count++;
    }
  });
  
  console.log(`Broadcasted to ${count} clients in group ${groupId}`);
}

function generateClientId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  
  // Close all connections
  clients.forEach((client) => {
    client.ws.close(1000, 'Server shutting down');
  });
  
  // Close servers
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});