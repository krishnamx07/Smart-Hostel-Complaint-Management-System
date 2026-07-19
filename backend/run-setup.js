// run-setup.js — Bootstrap script to set up and verify this project
// Run with: node run-setup.js

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs   = require('fs');

const projectDir = path.resolve(__dirname);
console.log('📁 Project dir:', projectDir);

// Check node_modules
const nmPath = path.join(projectDir, 'node_modules');
if (!fs.existsSync(nmPath)) {
  console.log('📦 node_modules not found. Running npm install...');
  try {
    execSync('npm install', { cwd: projectDir, stdio: 'inherit' });
    console.log('✅ npm install complete!');
  } catch (e) {
    console.error('❌ npm install failed:', e.message);
    process.exit(1);
  }
} else {
  console.log('✅ node_modules already exists.');
}

// Start server
console.log('\n🚀 Starting server...\n');
const server = spawn(process.execPath, ['server.js'], {
  cwd: projectDir,
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err.message);
});

server.on('exit', (code) => {
  console.log('Server exited with code:', code);
});
