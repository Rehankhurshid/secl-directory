const WebSocket = require("ws");
const http = require("http");
const url = require("url");

// Create HTTP server
const server = http.createServer((req, res) => {
  // Prevent duplicate response handling
  if (res.headersSent) return;

  // Add CORS headers for browser compatibility
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle health check
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({ status: "ok", timestamp: new Date().toISOString() })
    );
    return;
  }

  // Default response for other requests
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("WebSocket Server");
});

const wss = new WebSocket.Server({
  server,
  verifyClient: (info) => {
    // Basic verification - could add authentication here
    return true;
  },
});

console.log("🚀 WebSocket server starting on port 3002");

// Store connected clients
const clients = new Map();

// Message throttling to reduce spam
const messageThrottle = new Map(); // userId -> { lastMessage: timestamp, count: number }
const THROTTLE_WINDOW = 1000; // 1 second
const MAX_MESSAGES_PER_WINDOW = 10;

// Typing indicator throttling - optimized for better UX
const typingThrottle = new Map(); // userId-conversationId -> { timeout, lastSent }
const TYPING_DEBOUNCE = 300; // Reduced to 300ms for better responsiveness

wss.on("connection", (ws, request) => {
  const queryParams = url.parse(request.url, true).query;
  const userId = queryParams.userId || "anonymous";

  console.log(`🔗 User ${userId} connected`);

  // Store client with user ID and connection metadata
  clients.set(userId, {
    ws,
    userId,
    lastSeen: new Date(),
    lastPing: new Date(),
    connectionTime: new Date(),
  });

  // Send initial presence data (only to new user, reduce broadcast)
  const onlineUsers = Array.from(clients.keys()).filter((id) => id !== userId);
  if (onlineUsers.length > 0) {
    try {
      ws.send(
        JSON.stringify({
          type: "presence_list",
          payload: { onlineUsers },
          timestamp: new Date(),
        })
      );
    } catch (error) {
      console.error(
        `❌ Failed to send presence list to ${userId}:`,
        error.message
      );
    }
  }

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());

      // Handle ping/pong for heartbeat (don't log to reduce noise)
      if (message.type === "ping") {
        const client = clients.get(userId);
        if (client) {
          client.lastPing = new Date();
          try {
            ws.send(
              JSON.stringify({
                type: "pong",
                timestamp: new Date().toISOString(),
              })
            );
          } catch (error) {
            console.error(
              `❌ Failed to send pong to ${userId}:`,
              error.message
            );
          }
        }
        return;
      }

      // Enhanced message throttling
      const now = Date.now();
      const userThrottle = messageThrottle.get(userId) || {
        lastMessage: 0,
        count: 0,
      };

      if (now - userThrottle.lastMessage > THROTTLE_WINDOW) {
        // Reset count for new window
        userThrottle.count = 1;
        userThrottle.lastMessage = now;
      } else {
        userThrottle.count++;
      }

      messageThrottle.set(userId, userThrottle);

      if (userThrottle.count > MAX_MESSAGES_PER_WINDOW) {
        console.log(`🚫 Rate limit exceeded for ${userId}, dropping message`);
        return;
      }

      // Enhanced typing indicator handling with debouncing
      if (message.type === "typing") {
        const conversationId = message.payload?.conversationId;
        const isTyping = message.payload?.isTyping;
        const throttleKey = `${userId}-${conversationId}`;

        if (isTyping) {
          console.log(`⌨️ ${userId} started typing in ${conversationId}`);

          const existingTimeout = typingThrottle.get(throttleKey)?.timeout;
          if (existingTimeout) {
            clearTimeout(existingTimeout);
          }

          // Set auto-stop timeout (in case client doesn't send stop event)
          const autoStopTimeout = setTimeout(() => {
            console.log(
              `⌨️ ${userId} auto-stopped typing in ${conversationId}`
            );
            broadcastMessage(
              {
                ...message,
                payload: { ...message.payload, isTyping: false },
              },
              userId
            );
          }, 3000); // Auto-stop after 3 seconds

          typingThrottle.set(throttleKey, {
            timeout: autoStopTimeout,
            lastSent: now,
          });
        } else {
          console.log(`⌨️ ${userId} stopped typing in ${conversationId}`);

          const existingTimeout = typingThrottle.get(throttleKey)?.timeout;
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            typingThrottle.delete(throttleKey);
          }
        }

        // Broadcast typing status immediately
        broadcastMessage(message, userId);
        return;
      }

      // Log other message types for debugging
      console.log(`📨 Message from ${userId}:`, message);

      // Broadcast regular messages to relevant clients
      if (message.type === "message") {
        console.log(
          `💬 Broadcasting message to conversation ${message.payload?.conversationId}`
        );
        broadcastMessage(message, userId);
      } else {
        // Handle other message types
        broadcastMessage(message, userId);
      }
    } catch (error) {
      console.error(
        `❌ Error processing message from ${userId}:`,
        error.message
      );
    }
  });

  ws.on("close", () => {
    console.log(`🔌 User ${userId} disconnected`);
    clients.delete(userId);

    // Clean up typing indicators for this user
    for (const [key, value] of typingThrottle.entries()) {
      if (key.startsWith(`${userId}-`)) {
        clearTimeout(value.timeout);
        typingThrottle.delete(key);
      }
    }

    // Broadcast updated presence to remaining clients
    broadcastPresence();
  });

  ws.on("error", (error) => {
    console.error(`❌ WebSocket error for ${userId}:`, error.message);
    clients.delete(userId);
  });
});

// Enhanced broadcast function with better error handling
function broadcastMessage(message, senderId) {
  const conversationId = message.payload?.conversationId;
  let sentCount = 0;

  clients.forEach((client, userId) => {
    // Don't send back to sender for most message types
    if (userId === senderId && message.type === "message") {
      return;
    }

    // For conversation messages, could add filtering logic here
    // For now, send to all connected clients

    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(message));
        sentCount++;
      } catch (error) {
        console.error(`❌ Failed to send message to ${userId}:`, error.message);
        // Remove broken connection
        clients.delete(userId);
      }
    }
  });

  // Only log if actually sent to reduce noise
  if (sentCount > 0 && message.type !== "typing") {
    console.log(`📡 Broadcasted ${message.type} to ${sentCount} clients`);
  }
}

// Broadcast presence updates to all clients
function broadcastPresence() {
  const onlineUsers = Array.from(clients.keys());
  const presenceMessage = {
    type: "presence",
    payload: { onlineUsers },
    timestamp: new Date(),
  };

  clients.forEach((client, userId) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(presenceMessage));
      } catch (error) {
        console.error(
          `❌ Failed to send presence to ${userId}:`,
          error.message
        );
        clients.delete(userId);
      }
    }
  });

  // Only log if there are multiple clients
  if (clients.size > 1) {
    console.log(`📡 Broadcasted presence to ${clients.size} clients`);
  }
}

// Cleanup inactive connections every 5 minutes to save resources
setInterval(
  () => {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes

    clients.forEach((client, userId) => {
      if (now - client.lastPing > staleThreshold) {
        console.log(`🧹 Cleaning up stale connection for ${userId}`);
        try {
          client.ws.close();
        } catch (error) {
          // Connection might already be closed
        }
        clients.delete(userId);
      }
    });
  },
  5 * 60 * 1000
); // Run every 5 minutes

// Start the server
const PORT = process.env.PORT || process.env.WEBSOCKET_PORT || 3002;
server.listen(PORT, "0.0.0.0", () => {
  console.log("✨ WebSocket server ready for real-time messaging!");
  console.log(`🎯 WebSocket server listening on http://0.0.0.0:${PORT}`);
  console.log(`💡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log("🔧 To use on mobile devices:");
  console.log("1. Connect mobile to same WiFi network");
  console.log("2. Open http://localhost:3000 on mobile browser");
  console.log("3. WebSocket will automatically connect");
});
