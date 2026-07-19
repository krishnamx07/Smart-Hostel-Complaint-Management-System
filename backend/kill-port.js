const { exec } = require('child_process');

console.log('🔍 Searching for process on port 5000...');

exec('netstat -ano | findstr :5000', (err, stdout) => {
  if (err || !stdout) {
    console.log('✅ Port 5000 is already free.');
    return;
  }

  const lines = stdout.trim().split('\n');
  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && pid !== '0') {
      console.log(`🧨 Killing process with PID: ${pid}`);
      exec(`taskkill /F /PID ${pid}`, (killErr) => {
        if (killErr) console.log(`⚠️ Could not kill ${pid}: ${killErr.message}`);
        else console.log(`✅ Success: Killed PID ${pid}`);
      });
    }
  });
});
