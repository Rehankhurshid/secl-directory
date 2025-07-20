#!/usr/bin/env node

const { spawn, exec } = require("child_process");
const fs = require("fs");

console.log("🔐 Starting HTTPS Development Environment for PWA Testing");
console.log("====================================================\n");

// Kill any existing processes
console.log("🧹 Cleaning up existing processes...");
exec("npm run kill", (error) => {
  if (error) {
    console.log("⚠️  Kill script completed with warnings (normal)");
  }

  // Kill any existing tunnels
  exec('pkill -f "lt --port"', () => {
    console.log("✅ Cleanup complete\n");
    startServers();
  });
});

function startServers() {
  console.log("🚀 Starting local servers...\n");

  // Start WebSocket server
  const wsServer = spawn("node", ["scripts/websocket-server.js"], {
    stdio: "pipe",
    env: process.env,
  });

  wsServer.stdout.on("data", (data) => {
    process.stdout.write(`[WebSocket] ${data}`);
  });

  wsServer.stderr.on("data", (data) => {
    process.stderr.write(`[WebSocket Error] ${data}`);
  });

  // Start Next.js server after a short delay
  setTimeout(() => {
    const nextServer = spawn("npm", ["run", "dev"], {
      stdio: "pipe",
      env: {
        ...process.env,
        NEXT_PUBLIC_WEBSOCKET_URL: "ws://localhost:3002",
        NEXT_PUBLIC_APP_URL: "https://secl-messaging.loca.lt",
      },
    });

    nextServer.stdout.on("data", (data) => {
      process.stdout.write(`[Next.js] ${data}`);
    });

    nextServer.stderr.on("data", (data) => {
      process.stderr.write(`[Next.js Error] ${data}`);
    });

    // Start tunnels after servers are running
    setTimeout(() => {
      startTunnels();
    }, 3000);

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n🛑 Shutting down HTTPS development environment...");

      // Kill tunnels
      exec('pkill -f "lt --port"');

      nextServer.kill("SIGINT");
      wsServer.kill("SIGINT");

      setTimeout(() => {
        process.exit(0);
      }, 2000);
    });
  }, 2000);
}

function startTunnels() {
  console.log("🌐 Starting HTTPS tunnels...\n");

  // Start tunnel for Next.js app
  const appTunnel = spawn(
    "lt",
    ["--port", "3000", "--subdomain", "secl-messaging"],
    {
      stdio: "pipe",
    }
  );

  appTunnel.stdout.on("data", (data) => {
    const output = data.toString();
    if (output.includes("your url is:")) {
      console.log(`📱 App URL: ${output.trim()}`);
    }
  });

  // Start tunnel for WebSocket server
  const wsTunnel = spawn(
    "lt",
    ["--port", "3002", "--subdomain", "secl-websocket"],
    {
      stdio: "pipe",
    }
  );

  wsTunnel.stdout.on("data", (data) => {
    const output = data.toString();
    if (output.includes("your url is:")) {
      console.log(`🔌 WebSocket URL: ${output.trim()}`);
    }
  });

  // Display usage information after tunnels start
  setTimeout(() => {
    console.log("\n🎉 HTTPS Development Environment Ready!");
    console.log("=====================================\n");
    console.log("📱 Main App: https://secl-messaging.loca.lt");
    console.log("🧪 PWA Debug: https://secl-messaging.loca.lt/debug/pwa");
    console.log(
      "🔔 Test Notifications: https://secl-messaging.loca.lt/debug/pwa"
    );
    console.log(
      "📱 Install Prompt: Should appear automatically after 30 seconds"
    );
    console.log("\n💡 Tips:");
    console.log("• Open on mobile device for best PWA testing");
    console.log("• Grant notification permissions when prompted");
    console.log("• Check browser console for service worker logs");
    console.log(
      "• Use Chrome DevTools → Application tab to inspect PWA features"
    );
    console.log("\n🛑 Press Ctrl+C to stop all servers and tunnels");
  }, 5000);
}
