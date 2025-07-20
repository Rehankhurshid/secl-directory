#!/usr/bin/env node

const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const WEB_PORT = 3001;
const WS_PORT = 3002;

function checkNgrok() {
  return new Promise((resolve) => {
    exec("which ngrok", (error) => {
      resolve(!error);
    });
  });
}

function checkPortInUse(port) {
  return new Promise((resolve) => {
    exec(`lsof -ti:${port}`, (error, stdout) => {
      resolve(!!stdout.trim());
    });
  });
}

function waitForServer(port, maxAttempts = 30) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const check = () => {
      exec(
        `curl -s http://localhost:${port}${port === WS_PORT ? "/health" : ""}`,
        (error) => {
          if (!error) {
            resolve(true);
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(check, 1000);
          } else {
            reject(new Error(`Server on port ${port} failed to start`));
          }
        }
      );
    };

    check();
  });
}

function saveNgrokUrls(webUrl, wsUrl) {
  const config = {
    WEB_URL: webUrl,
    WEBSOCKET_URL: wsUrl,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(__dirname, "../.ngrok-urls.json"),
    JSON.stringify(config, null, 2)
  );

  console.log("💾 Saved tunnel URLs to .ngrok-urls.json");
}

async function startDualTunnel() {
  const hasNgrok = await checkNgrok();

  if (!hasNgrok) {
    console.log("❌ ngrok is not installed\n");
    console.log("📦 To install ngrok:");
    console.log("   Mac:     brew install ngrok");
    console.log("   Windows: choco install ngrok");
    console.log("   Linux:   snap install ngrok");
    console.log("   Or download from: https://ngrok.com/download\n");
    process.exit(1);
  }

  console.log("🚀 Starting SECL Messaging App with ngrok tunnels...\n");

  // Check if servers are already running
  const webRunning = await checkPortInUse(WEB_PORT);
  const wsRunning = await checkPortInUse(WS_PORT);

  let webProcess, wsProcess;

  // Start WebSocket server if not running
  if (!wsRunning) {
    console.log("📡 Starting WebSocket server...");
    wsProcess = spawn("node", ["scripts/websocket-server.js"], {
      stdio: "pipe",
      shell: true,
    });

    wsProcess.stdout.on("data", (data) => {
      console.log("WS:", data.toString().trim());
    });

    wsProcess.stderr.on("data", (data) => {
      console.error("WS Error:", data.toString().trim());
    });
  }

  // Start Next.js server if not running
  if (!webRunning) {
    console.log("🌐 Starting Next.js server...");
    webProcess = spawn("npm", ["run", "dev"], {
      stdio: "pipe",
      shell: true,
    });

    webProcess.stdout.on("data", (data) => {
      const output = data.toString();
      if (output.includes("Local:") || output.includes("Ready")) {
        console.log("Web:", output.trim());
      }
    });

    webProcess.stderr.on("data", (data) => {
      console.error("Web Error:", data.toString().trim());
    });
  }

  // Wait for servers to be ready
  try {
    if (!wsRunning) {
      console.log("⏳ Waiting for WebSocket server...");
      await waitForServer(WS_PORT);
      console.log("✅ WebSocket server ready");
    }

    if (!webRunning) {
      console.log("⏳ Waiting for Next.js server...");
      await waitForServer(WEB_PORT);
      console.log("✅ Next.js server ready");
    }
  } catch (error) {
    console.error("❌ Failed to start servers:", error.message);
    process.exit(1);
  }

  console.log("\n🌐 Creating ngrok tunnels...\n");

  // Start ngrok tunnels
  const webTunnel = spawn("ngrok", ["http", WEB_PORT], {
    stdio: "pipe",
    shell: true,
  });

  const wsTunnel = spawn("ngrok", ["http", WS_PORT], {
    stdio: "pipe",
    shell: true,
  });

  let webUrl = null;
  let wsUrl = null;
  let urlsLogged = false;

  // Capture web tunnel output
  webTunnel.stdout.on("data", (data) => {
    const output = data.toString();
    const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app/);
    if (match && !webUrl) {
      webUrl = match[0];
      checkAndLogUrls();
    }
  });

  // Capture WebSocket tunnel output
  wsTunnel.stdout.on("data", (data) => {
    const output = data.toString();
    const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app/);
    if (match && !wsUrl) {
      wsUrl = match[0];
      checkAndLogUrls();
    }
  });

  function checkAndLogUrls() {
    if (webUrl && wsUrl && !urlsLogged) {
      urlsLogged = true;

      console.log("🎉 SECL Messaging App is now publicly accessible!\n");
      console.log("🌐 Web Application:");
      console.log(`   ${webUrl}`);
      console.log("");
      console.log("📡 WebSocket Server:");
      console.log(`   ${wsUrl.replace("https://", "wss://")}`);
      console.log("");
      console.log("📋 Share the web URL to access from anywhere");
      console.log("🔒 Both tunnels are secure (HTTPS/WSS)");
      console.log("📊 View requests at: http://localhost:4040");
      console.log("");
      console.log(
        "⚠️  Note: Update WebSocket connection in your app to use the WSS URL"
      );
      console.log("");
      console.log("Press Ctrl+C to stop all tunnels and servers\n");

      // Save URLs to file for programmatic access
      saveNgrokUrls(webUrl, wsUrl.replace("https://", "wss://"));
    }
  }

  // Handle errors
  webTunnel.stderr.on("data", (data) => {
    console.error("Web tunnel error:", data.toString());
  });

  wsTunnel.stderr.on("data", (data) => {
    console.error("WS tunnel error:", data.toString());
  });

  // Handle process termination
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down tunnels and servers...");

    webTunnel.kill();
    wsTunnel.kill();

    if (webProcess) webProcess.kill();
    if (wsProcess) wsProcess.kill();

    // Clean up URLs file
    try {
      fs.unlinkSync(path.join(__dirname, "../.ngrok-urls.json"));
    } catch (e) {}

    console.log("✅ All processes stopped");
    process.exit();
  });

  // Handle tunnel closures
  webTunnel.on("close", () => {
    console.log("🛑 Web tunnel closed");
  });

  wsTunnel.on("close", () => {
    console.log("🛑 WebSocket tunnel closed");
  });
}

startDualTunnel().catch(console.error);
