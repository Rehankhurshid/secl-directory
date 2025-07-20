#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

function killServers() {
  const platform = os.platform();
  
  console.log('🔍 Finding and killing all Node.js server processes...\n');
  
  try {
    if (platform === 'darwin' || platform === 'linux') {
      // Kill processes on port 3000
      try {
        const pid = execSync("lsof -ti:3000", { encoding: 'utf8' }).trim();
        if (pid) {
          execSync(`kill -9 ${pid}`);
          console.log('✅ Killed process on port 3000');
        }
      } catch (e) {
        console.log('ℹ️  No process found on port 3000');
      }
      
      // Kill all node processes
      try {
        execSync("pkill -f node", { encoding: 'utf8' });
        console.log('✅ Killed all Node.js processes');
      } catch (e) {
        console.log('ℹ️  No Node.js processes found');
      }
      
      // Kill Next.js specific processes
      try {
        execSync("pkill -f next", { encoding: 'utf8' });
        console.log('✅ Killed all Next.js processes');
      } catch (e) {
        console.log('ℹ️  No Next.js processes found');
      }
      
    } else if (platform === 'win32') {
      // Windows commands
      try {
        // Kill process on port 3000
        const netstat = execSync('netstat -ano | findstr :3000', { encoding: 'utf8' });
        const lines = netstat.split('\n').filter(line => line.includes('LISTENING'));
        
        for (const line of lines) {
          const pid = line.trim().split(/\s+/).pop();
          if (pid) {
            execSync(`taskkill /PID ${pid} /F`);
            console.log(`✅ Killed process ${pid} on port 3000`);
          }
        }
      } catch (e) {
        console.log('ℹ️  No process found on port 3000');
      }
      
      // Kill all node processes
      try {
        execSync('taskkill /F /IM node.exe');
        console.log('✅ Killed all Node.js processes');
      } catch (e) {
        console.log('ℹ️  No Node.js processes found');
      }
    }
    
    console.log('\n✨ All server processes killed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the kill servers function
killServers();