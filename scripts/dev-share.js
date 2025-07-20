#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const qrcode = require('qrcode-terminal');
const os = require('os');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();
const port = process.env.PORT || 3000;
const url = `http://${localIp}:${port}`;

console.log('\n🚀 Starting development server...\n');
console.log(`📱 Local:    http://localhost:${port}`);
console.log(`🌐 Network:  ${url}\n`);
console.log('📷 Scan QR code with your phone:\n');

qrcode.generate(url, { small: true });

console.log('\n📋 Access from any device on your network using the URL above\n');

const next = spawn('next', ['dev', '--hostname', '0.0.0.0', '-p', port], {
  stdio: 'inherit',
  shell: true
});

next.on('close', (code) => {
  process.exit(code);
});