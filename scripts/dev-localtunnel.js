#!/usr/bin/env node

const { spawn } = require('child_process');
const localtunnel = require('localtunnel');
const fs = require('fs');
const path = require('path');

// Configuration
const APP_PORT = 3000;
const WS_PORT = 3002;
const APP_SUBDOMAIN = 'secl-messaging';
const WS_SUBDOMAIN = 'secl-websocket';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Update .env.local with tunnel URLs
function updateEnvFile(appUrl, wsUrl) {
  const envPath = path.join(__dirname, '..', '.env.local');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update or add the URLs
  if (envContent.includes('NEXT_PUBLIC_APP_URL=')) {
    envContent = envContent.replace(
      /NEXT_PUBLIC_APP_URL=.*/,
      `NEXT_PUBLIC_APP_URL="${appUrl}"`
    );
  } else {
    envContent += `\nNEXT_PUBLIC_APP_URL="${appUrl}"`;
  }
  
  if (envContent.includes('NEXT_PUBLIC_WEBSOCKET_URL=')) {
    envContent = envContent.replace(
      /# ?NEXT_PUBLIC_WEBSOCKET_URL=.*/,
      `NEXT_PUBLIC_WEBSOCKET_URL="${wsUrl}"`
    );
  } else {
    envContent += `\nNEXT_PUBLIC_WEBSOCKET_URL="${wsUrl}"`;
  }
  
  fs.writeFileSync(envPath, envContent);
  log('✅ Updated .env.local with tunnel URLs', 'green');
}

async function startTunnels() {
  log('\n🚀 Starting SECL App with Localtunnel...', 'bright');
  
  try {
    // Start WebSocket server
    log('\n📡 Starting WebSocket server...', 'cyan');
    const wsServer = spawn('node', ['scripts/websocket-server.js'], {
      stdio: 'pipe',
      env: {
        ...process.env,
        HOST: '0.0.0.0',
        PORT: WS_PORT
      }
    });
    
    wsServer.stdout.on('data', (data) => {
      process.stdout.write(`${colors.blue}[WebSocket]${colors.reset} ${data}`);
    });
    
    wsServer.stderr.on('data', (data) => {
      process.stderr.write(`${colors.red}[WebSocket Error]${colors.reset} ${data}`);
    });
    
    // Wait for WebSocket server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create WebSocket tunnel
    log('\n🌐 Creating WebSocket tunnel...', 'cyan');
    const wsTunnel = await localtunnel({
      port: WS_PORT,
      subdomain: WS_SUBDOMAIN
    });
    
    const wsUrl = wsTunnel.url.replace('https://', 'wss://');
    log(`✅ WebSocket tunnel: ${wsUrl}`, 'green');
    
    // Create App tunnel
    log('\n🌐 Creating App tunnel...', 'cyan');
    const appTunnel = await localtunnel({
      port: APP_PORT,
      subdomain: APP_SUBDOMAIN
    });
    
    log(`✅ App tunnel: ${appTunnel.url}`, 'green');
    
    // Update .env.local
    updateEnvFile(appTunnel.url, wsUrl);
    
    // Start Next.js with updated environment
    log('\n🚀 Starting Next.js server...', 'cyan');
    const nextServer = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      env: {
        ...process.env,
        NEXT_PUBLIC_APP_URL: appTunnel.url,
        NEXT_PUBLIC_WEBSOCKET_URL: wsUrl,
        HOST: '0.0.0.0'
      }
    });
    
    nextServer.stdout.on('data', (data) => {
      process.stdout.write(`${colors.green}[Next.js]${colors.reset} ${data}`);
    });
    
    nextServer.stderr.on('data', (data) => {
      process.stderr.write(`${colors.red}[Next.js Error]${colors.reset} ${data}`);
    });
    
    // Wait for everything to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Display access information
    console.log('\n' + '='.repeat(60));
    log('\n✨ SECL App is ready for mobile access!', 'bright');
    log('\n📱 Mobile Access URLs:', 'yellow');
    log(`   App URL: ${appTunnel.url}`, 'green');
    log(`   WebSocket: ${wsUrl}`, 'green');
    log('\n📋 Share these URLs to access from your mobile device', 'cyan');
    log('🔒 Both tunnels are secure (HTTPS/WSS)', 'cyan');
    log('\n⌨️  Press Ctrl+C to stop all servers and tunnels', 'yellow');
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Handle shutdown
    const shutdown = () => {
      log('\n\n🛑 Shutting down...', 'red');
      
      appTunnel.close();
      wsTunnel.close();
      nextServer.kill('SIGINT');
      wsServer.kill('SIGINT');
      
      setTimeout(() => {
        process.exit(0);
      }, 2000);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    
    // Handle tunnel closures
    appTunnel.on('close', () => {
      log('\n❌ App tunnel closed', 'red');
      shutdown();
    });
    
    wsTunnel.on('close', () => {
      log('\n❌ WebSocket tunnel closed', 'red');
      shutdown();
    });
    
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Check if localtunnel is installed
try {
  require.resolve('localtunnel');
} catch (e) {
  log('❌ Localtunnel not installed!', 'red');
  log('📦 Installing localtunnel...', 'yellow');
  
  const install = spawn('npm', ['install', '--save-dev', 'localtunnel'], {
    stdio: 'inherit'
  });
  
  install.on('close', (code) => {
    if (code === 0) {
      log('✅ Localtunnel installed successfully!', 'green');
      startTunnels();
    } else {
      log('❌ Failed to install localtunnel', 'red');
      process.exit(1);
    }
  });
} 

// Start if localtunnel is already installed
if (require.resolve('localtunnel')) {
  startTunnels();
}