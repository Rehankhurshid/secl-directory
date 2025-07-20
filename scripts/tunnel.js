#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const localtunnel = require('localtunnel');
const https = require('https');

const port = process.env.PORT || 3000;
const subdomain = 'secl-dev'; // You can customize this

async function getPublicIP() {
  return new Promise((resolve) => {
    https.get('https://loca.lt/mytunnelpassword', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data.trim()));
    }).on('error', () => {
      // Fallback method
      exec('curl -s https://ipinfo.io/ip', (err, stdout) => {
        resolve(stdout.trim() || 'Check https://loca.lt/mytunnelpassword');
      });
    });
  });
}

async function createTunnel() {
  console.log('🚀 Starting Next.js development server...\n');
  
  // Start Next.js in the background
  const next = spawn('next', ['dev', '-p', port], {
    stdio: 'inherit',
    shell: true
  });

  // Wait a bit for Next.js to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('\n🌐 Creating secure tunnel...\n');

  try {
    const tunnel = await localtunnel({ 
      port,
      subdomain: subdomain + '-' + Math.random().toString(36).substring(7)
    });

    const tunnelPassword = await getPublicIP();

    console.log('✅ Your app is publicly accessible at:');
    console.log(`\n   ${tunnel.url}\n`);
    console.log('🔐 TUNNEL PASSWORD: ' + tunnelPassword);
    console.log('   (This is your public IP address)\n');
    console.log('📋 Share BOTH the URL and password with others');
    console.log('🔒 This tunnel is secure (HTTPS) and temporary\n');
    console.log('Press Ctrl+C to stop the tunnel and server\n');

    tunnel.on('close', () => {
      console.log('\n🛑 Tunnel closed');
      next.kill();
      process.exit();
    });

    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down...');
      tunnel.close();
      next.kill();
      process.exit();
    });

  } catch (error) {
    console.error('❌ Error creating tunnel:', error.message);
    next.kill();
    process.exit(1);
  }
}

createTunnel();