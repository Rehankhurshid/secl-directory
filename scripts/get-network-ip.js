const { networkInterfaces } = require("os");

function getNetworkIP() {
  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal addresses
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }

  return "localhost"; // fallback
}

function displayNetworkInfo() {
  const networkIP = getNetworkIP();

  console.log("\n🌐 Network Configuration:");
  console.log("========================");
  console.log(`📱 Desktop Access: http://localhost:3000`);
  console.log(`📱 Mobile Access:  http://${networkIP}:3000`);
  console.log(`🔌 WebSocket Desktop: ws://localhost:3002`);
  console.log(`🔌 WebSocket Mobile:  ws://${networkIP}:3002`);
  console.log(`\n💡 Connect your mobile device to: http://${networkIP}:3000`);
  console.log("========================\n");

  return networkIP;
}

module.exports = { getNetworkIP, displayNetworkInfo };
