const { spawn } = require("child_process");
const { displayNetworkInfo, getNetworkIP } = require("./get-network-ip");

// Display network configuration
const networkIP = displayNetworkInfo();

// Start WebSocket server
console.log("🚀 Starting WebSocket server on all interfaces...");
const wsServer = spawn("node", ["scripts/websocket-server.js"], {
  stdio: "pipe",
  env: {
    ...process.env,
    NETWORK_IP: networkIP,
    HOST: "0.0.0.0",
    PORT: "3002",
  },
});

wsServer.stdout.on("data", (data) => {
  process.stdout.write(`[WebSocket] ${data}`);
});

wsServer.stderr.on("data", (data) => {
  process.stderr.write(`[WebSocket Error] ${data}`);
});

// Wait a moment for WebSocket server to start
setTimeout(() => {
  console.log("🚀 Starting Next.js server...");

  // Start Next.js server
  const nextServer = spawn("npm", ["run", "dev"], {
    stdio: "pipe",
    env: {
      ...process.env,
      NEXT_PUBLIC_WEBSOCKET_URL: `ws://${networkIP}:3002`,
      NEXT_PUBLIC_API_URL: `http://${networkIP}:3000`,
      HOST: "0.0.0.0",
    },
  });

  nextServer.stdout.on("data", (data) => {
    process.stdout.write(`[Next.js] ${data}`);
  });

  nextServer.stderr.on("data", (data) => {
    process.stderr.write(`[Next.js Error] ${data}`);
  });

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down servers...");

    nextServer.kill("SIGINT");
    wsServer.kill("SIGINT");

    setTimeout(() => {
      process.exit(0);
    }, 2000);
  });

  nextServer.on("close", (code) => {
    console.log(`Next.js server exited with code ${code}`);
    wsServer.kill("SIGINT");
  });

  wsServer.on("close", (code) => {
    console.log(`WebSocket server exited with code ${code}`);
    nextServer.kill("SIGINT");
  });
}, 2000);
