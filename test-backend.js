#!/usr/bin/env node

// Quick test to verify backend is running on correct port
const http = require('http');

const testBackend = (port) => {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ success: true, port, data: response });
        } catch (e) {
          resolve({ success: false, port, error: 'Invalid JSON response' });
        }
      });
    });
    
    req.on('error', (err) => {
      resolve({ success: false, port, error: err.message });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, port, error: 'Timeout' });
    });
  });
};

async function main() {
  console.log('🔍 Testing backend connectivity...\n');
  
  // Test both ports
  const port3001 = await testBackend(3001);
  const port3002 = await testBackend(3002);
  
  console.log(`Port 3001: ${port3001.success ? '✅ Running' : '❌ Not running'}`);
  if (port3001.success) {
    console.log(`  Message: ${port3001.data.message}`);
  } else {
    console.log(`  Error: ${port3001.error}`);
  }
  
  console.log(`Port 3002: ${port3002.success ? '✅ Running' : '❌ Not running'}`);
  if (port3002.success) {
    console.log(`  Message: ${port3002.data.message}`);
  } else {
    console.log(`  Error: ${port3002.error}`);
  }
  
  console.log('\n📋 Summary:');
  if (port3001.success) {
    console.log('✅ Backend is running on port 3001 (correct)');
    console.log('🎉 Frontend should now be able to connect!');
  } else if (port3002.success) {
    console.log('⚠️  Backend is running on port 3002 (incorrect)');
    console.log('🔧 Please restart the backend to use port 3001');
  } else {
    console.log('❌ No backend is running');
    console.log('🚀 Please start the backend: cd backend && npm run dev');
  }
}

main().catch(console.error);
