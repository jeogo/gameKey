/**
 * Quick Server Test
 * Verifies the server starts and responds to basic requests
 */

const axios = require('axios');

async function testServerBasics() {
  console.log('🔍 Testing server basics...\n');
  
  const baseURL = 'http://localhost:3000';
  
  try {
    // Test health endpoint
    console.log('📊 Testing health endpoint...');
    const healthResponse = await axios.get(`${baseURL}/health`);
    if (healthResponse.status === 200) {
      console.log('✅ Health endpoint working');
      console.log(`   Server uptime: ${healthResponse.data.uptime} seconds`);
    }
    
    // Test status endpoint
    console.log('📈 Testing status endpoint...');
    const statusResponse = await axios.get(`${baseURL}/status`);
    if (statusResponse.status === 200) {
      console.log('✅ Status endpoint working');
      console.log(`   Memory usage: ${statusResponse.data.memory.used}`);
    }
    
    // Test API documentation
    console.log('📚 Testing API documentation...');
    const docsResponse = await axios.get(`${baseURL}/docs-json`);
    if (docsResponse.status === 200) {
      console.log('✅ API documentation available');
    }
    
    console.log('\n🎉 Server is running and responding correctly!');
    console.log(`\n📋 Available endpoints:`);
    console.log(`   🏠 Home: ${baseURL}`);
    console.log(`   📊 Health: ${baseURL}/health`);
    console.log(`   📈 Status: ${baseURL}/status`);
    console.log(`   📚 API Docs: ${baseURL}/api-docs`);
    console.log(`   🔌 API Base: ${baseURL}/api`);
    
  } catch (error) {
    console.error('❌ Server test failed:', error.message);
    console.log('\n💡 Make sure to start the server first with:');
    console.log('   npm run dev');
    process.exit(1);
  }
}

if (require.main === module) {
  testServerBasics();
}

module.exports = { testServerBasics };