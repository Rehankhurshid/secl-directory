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
            console.log(
              `⏳ Waiting for server on port ${port}... (${attempts}/${maxAttempts})`
            );
            setTimeout(check, 2000);
          } else {
            reject(
              new Error(
                `Server on port ${port} not responding after ${maxAttempts} attempts`
              )
            );
          }
        }
      );
    };

    check();
  });
}

function startServer(command, port, name) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Starting ${name} server...`);

    const server = spawn("node", command.split(" ").slice(1), {
      stdio: ["pipe", "pipe", "pipe"],
      detached: false,
    });

    let hasStarted = false;

    server.stdout.on("data", (data) => {
      const output = data.toString();
      console.log(`[${name}] ${output.trim()}`);

      if (
        output.includes("ready") ||
        output.includes("listening") ||
        output.includes("compiled")
      ) {
        if (!hasStarted) {
          hasStarted = true;
          setTimeout(() => resolve(server), 2000);
        }
      }
    });

    server.stderr.on("data", (data) => {
      console.error(`[${name} Error] ${data.toString().trim()}`);
    });

    server.on("error", (error) => {
      console.error(`❌ Failed to start ${name}:`, error);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!hasStarted) {
        reject(new Error(`${name} server failed to start within timeout`));
      }
    }, 30000);
  });
}

async function createNgrokConfig() {
  const configContent = `
version: "2"
authtoken: ${process.env.NGROK_AUTHTOKEN || ""}

tunnels:
  unified:
    proto: http
    addr: 3001
    bind_tls: true
    host_header: localhost:3001
    inspect: true
    
  websocket:
    proto: http
    addr: 3002
    bind_tls: true
    host_header: localhost:3002
    inspect: false
`;

  const configPath = path.join(process.cwd(), ".ngrok-config.yml");
  fs.writeFileSync(configPath, configContent.trim());
  return configPath;
}

async function startNgrokTunnel() {
  return new Promise(async (resolve, reject) => {
    console.log("🌐 Starting unified ngrok tunnel...");

    try {
      const configPath = await createNgrokConfig();

      const ngrok = spawn("ngrok", ["start", "--config", configPath, "--all"], {
        stdio: ["pipe", "pipe", "pipe"],
      });

      let tunnelInfo = { web: null, websocket: null };
      let attempts = 0;
      const maxAttempts = 30;

      // Monitor ngrok output
      ngrok.stdout.on("data", (data) => {
        const output = data.toString();
        if (
          output.includes("started tunnel") ||
          output.includes("Forwarding")
        ) {
          console.log(`[ngrok] ${output.trim()}`);
        }
      });

      ngrok.stderr.on("data", (data) => {
        console.error(`[ngrok Error] ${data.toString().trim()}`);
      });

      // Wait for ngrok to start and fetch tunnel URLs
      const checkTunnels = async () => {
        try {
          const response = await new Promise((resolve, reject) => {
            exec(
              "curl -s http://localhost:4040/api/tunnels",
              (error, stdout) => {
                if (error) reject(error);
                else resolve(stdout);
              }
            );
          });

          const data = JSON.parse(response);

          if (data.tunnels && data.tunnels.length >= 2) {
            data.tunnels.forEach((tunnel) => {
              if (tunnel.config.addr === "http://localhost:3001") {
                tunnelInfo.web = tunnel.public_url;
              } else if (tunnel.config.addr === "http://localhost:3002") {
                tunnelInfo.websocket = tunnel.public_url.replace(
                  "https://",
                  "wss://"
                );
              }
            });

            if (tunnelInfo.web && tunnelInfo.websocket) {
              // Save tunnel URLs
              const urlsConfig = {
                WEB_URL: tunnelInfo.web,
                WEBSOCKET_URL: tunnelInfo.websocket,
                timestamp: new Date().toISOString(),
              };

              fs.writeFileSync(
                ".ngrok-urls.json",
                JSON.stringify(urlsConfig, null, 2)
              );

              console.log("✅ Unified ngrok tunnels established:");
              console.log(`   🌐 Web App: ${tunnelInfo.web}`);
              console.log(`   📡 WebSocket: ${tunnelInfo.websocket}`);

              resolve(tunnelInfo);
              return;
            }
          }

          // Retry if not ready
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkTunnels, 2000);
          } else {
            reject(new Error("Failed to establish tunnels within timeout"));
          }
        } catch (error) {
          attempts++;
          if (attempts < maxAttempts) {
            console.log(
              `⏳ Waiting for ngrok tunnels... (${attempts}/${maxAttempts})`
            );
            setTimeout(checkTunnels, 2000);
          } else {
            reject(error);
          }
        }
      };

      // Start checking after a brief delay
      setTimeout(checkTunnels, 3000);
    } catch (error) {
      reject(error);
    }
  });
}

async function main() {
  try {
    console.log("🔍 Checking prerequisites...");

    // Check if ngrok is installed
    if (!(await checkNgrok())) {
      console.error("❌ ngrok not found. Please install ngrok first.");
      console.log("💡 Install: npm install -g ngrok");
      process.exit(1);
    }

    console.log("✅ ngrok is available");

    // Check if servers are running, start them if needed
    const webRunning = await checkPortInUse(WEB_PORT);
    const wsRunning = await checkPortInUse(WS_PORT);

    const servers = [];

    if (!webRunning) {
      console.log("🚀 Starting Next.js development server...");
      const webServer = await startServer("npm run dev", WEB_PORT, "Next.js");
      servers.push(webServer);
      await waitForServer(WEB_PORT);
    } else {
      console.log("✅ Next.js server already running");
    }

    if (!wsRunning) {
      console.log("🚀 Starting WebSocket server...");
      const wsServer = await startServer(
        "node scripts/websocket-server.js",
        WS_PORT,
        "WebSocket"
      );
      servers.push(wsServer);
      await waitForServer(WS_PORT);
    } else {
      console.log("✅ WebSocket server already running");
    }

    // Start unified ngrok tunnel
    const tunnelInfo = await startNgrokTunnel();

    console.log("\n🎉 All services are running with unified ngrok tunnel!");
    console.log("\n📊 Service Status:");
    console.log(
      `   🖥️  Next.js App: http://localhost:${WEB_PORT} → ${tunnelInfo.web}`
    );
    console.log(
      `   🔌 WebSocket: ws://localhost:${WS_PORT} → ${tunnelInfo.websocket}`
    );
    console.log("\n💡 Share this URL with your team: " + tunnelInfo.web);
    console.log(
      "\n⚠️  Note: This unified tunnel setup reduces ngrok costs compared to separate tunnels"
    );
    console.log("\n🛑 Press Ctrl+C to stop all services");

    // Handle graceful shutdown
    process.on("SIGINT", () => {
      console.log("\n🛑 Shutting down services...");

      // Kill spawned servers
      servers.forEach((server) => {
        if (server && !server.killed) {
          server.kill("SIGTERM");
        }
      });

      // Kill ngrok
      exec("pkill -f ngrok", () => {
        console.log("✅ Services stopped");
        process.exit(0);
      });
    });

    // Keep the process alive
    process.stdin.resume();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
