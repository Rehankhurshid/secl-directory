#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const https = require('https');

const port = process.env.PORT || 3000;
const staticDomain = process.env.NGROK_DOMAIN || 'exciting-basically-mustang.ngrok-free.app';

function checkNgrok() {
  return new Promise((resolve) => {
    exec('which ngrok', (error) => {
      resolve(!error);
    });
  });
}

async function startNgrokTunnel() {
  const hasNgrok = await checkNgrok();
  
  if (!hasNgrok) {
    console.log('❌ ngrok is not installed\n');
    console.log('📦 To install ngrok:');
    console.log('   Mac:     brew install ngrok');
    console.log('   Windows: choco install ngrok');
    console.log('   Linux:   snap install ngrok');
    console.log('   Or download from: https://ngrok.com/download\n');
    process.exit(1);
  }

  console.log('🚀 Starting Next.js development server...\n');
  
  // Start Next.js in the background
  const next = spawn('next', ['dev', '-p', port], {
    stdio: 'inherit',
    shell: true
  });

  // Wait for Next.js to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('\n🌐 Creating ngrok tunnel...\n');

  // Start ngrok with static domain if available
  const ngrokArgs = staticDomain 
    ? ['http', '--url=' + staticDomain, port]
    : ['http', port];
    
  const ngrok = spawn('ngrok', ngrokArgs, {
    stdio: 'pipe',
    shell: true
  });

  let tunnelUrl = null;

  // Capture ngrok output to find the URL
  ngrok.stdout.on('data', (data) => {
    const output = data.toString();
    const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.ngrok-free\.app/);
    if (match && !tunnelUrl) {
      tunnelUrl = match[0];
      console.log('✅ Your app is publicly accessible at:');
      console.log(`\n   ${tunnelUrl}\n`);
      console.log('📋 Share this URL to access from anywhere');
      console.log('🔒 This tunnel is secure (HTTPS)');
      if (staticDomain) {
        console.log('🌟 Using your static domain - URL won\'t change!');
      }
      console.log('📊 View requests at: http://localhost:4040\n');
      console.log('Press Ctrl+C to stop the tunnel and server\n');
    }
  });

  ngrok.stderr.on('data', (data) => {
    console.error('ngrok error:', data.toString());
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    ngrok.kill();
    next.kill();
    process.exit();
  });

  ngrok.on('close', () => {
    console.log('\n🛑 ngrok tunnel closed');
    next.kill();
    process.exit();
  });

  next.on('close', () => {
    ngrok.kill();
    process.exit();
  });
}

startNgrokTunnel();