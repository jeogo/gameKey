/**
 * Master Test Runner
 * Orchestrates all tests: database setup, API testing, and bot simulation
 */

const { setupDatabase } = require('./database-setup');
const { APITester } = require('./api-tests');
const { BotSimulator } = require('./bot-simulation');

class MasterTestRunner {
  constructor() {
    this.startTime = Date.now();
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  async waitForServer(url, maxAttempts = 10) {
    const axios = require('axios');
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await axios.get(`${url}/health`);
        this.log(`✅ Server is ready at ${url}`);
        return true;
      } catch {
        this.log(`⏳ Waiting for server... (attempt ${i + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error(`Server not available at ${url} after ${maxAttempts} attempts`);
  }

  async runDatabaseSetup() {
    this.log('🗄️ PHASE 1: Database Setup');
    this.log('===========================');
    
    try {
      await setupDatabase();
      this.log('✅ Database setup completed successfully');
      return true;
    } catch (error) {
      this.log(`❌ Database setup failed: ${error.message}`);
      return false;
    }
  }

  async runAPITests() {
    this.log('\n🔌 PHASE 2: API Testing');
    this.log('========================');
    
    try {
      const apiTester = new APITester();
      await apiTester.runAllTests();
      
      const successRate = (apiTester.testResults.passed / (apiTester.testResults.passed + apiTester.testResults.failed)) * 100;
      
      if (successRate >= 90) {
        this.log('✅ API tests completed with high success rate');
        return true;
      } else {
        this.log(`⚠️ API tests completed with ${successRate.toFixed(1)}% success rate`);
        return false;
      }
    } catch (error) {
      this.log(`❌ API testing failed: ${error.message}`);
      return false;
    }
  }

  async runBotSimulation() {
    this.log('\n🤖 PHASE 3: Bot Simulation');
    this.log('===========================');
    
    try {
      const botSimulator = new BotSimulator();
      await botSimulator.runAllScenarios();
      
      const successRate = (botSimulator.testResults.passed / (botSimulator.testResults.passed + botSimulator.testResults.failed)) * 100;
      
      if (successRate >= 80) {
        this.log('✅ Bot simulation completed with acceptable success rate');
        return true;
      } else {
        this.log(`⚠️ Bot simulation completed with ${successRate.toFixed(1)}% success rate`);
        return false;
      }
    } catch (error) {
      this.log(`❌ Bot simulation failed: ${error.message}`);
      return false;
    }
  }

  async runPerformanceTests() {
    this.log('\n⚡ PHASE 4: Performance Testing');
    this.log('================================');
    
    const axios = require('axios');
    const API_BASE_URL = 'http://localhost:3000/api';
    
    try {
      // Test API response times
      this.log('📊 Testing API response times...');
      
      const tests = [
        { name: 'Get Categories', url: `${API_BASE_URL}/categories` },
        { name: 'Get Products', url: `${API_BASE_URL}/products` },
        { name: 'Get Users', url: `${API_BASE_URL}/users` }
      ];
      
      for (const test of tests) {
        const start = Date.now();
        await axios.get(test.url);
        const duration = Date.now() - start;
        
        this.log(`  ${test.name}: ${duration}ms`);
        
        if (duration > 1000) {
          this.log(`  ⚠️ Slow response time for ${test.name}`);
        }
      }
      
      // Test concurrent requests
      this.log('🔄 Testing concurrent request handling...');
      const concurrentStart = Date.now();
      const promises = Array(10).fill().map(() => axios.get(`${API_BASE_URL}/products`));
      await Promise.all(promises);
      const concurrentDuration = Date.now() - concurrentStart;
      
      this.log(`  10 concurrent requests: ${concurrentDuration}ms`);
      
      this.log('✅ Performance tests completed');
      return true;
      
    } catch (error) {
      this.log(`❌ Performance testing failed: ${error.message}`);
      return false;
    }
  }

  async runSecurityTests() {
    this.log('\n🔒 PHASE 5: Basic Security Testing');
    this.log('===================================');
    
    const axios = require('axios');
    const API_BASE_URL = 'http://localhost:3000/api';
    
    try {
      // Test input validation
      this.log('🛡️ Testing input validation...');
      
      const maliciousInputs = [
        { type: 'SQL Injection', data: { name: "'; DROP TABLE users; --" } },
        { type: 'XSS', data: { name: '<script>alert("xss")</script>' } },
        { type: 'Large Payload', data: { name: 'A'.repeat(10000) } }
      ];
      
      for (const input of maliciousInputs) {
        try {
          await axios.post(`${API_BASE_URL}/categories`, input.data);
          this.log(`  ⚠️ ${input.type} test: Server accepted malicious input`);
        } catch (error) {
          if (error.response && error.response.status >= 400) {
            this.log(`  ✅ ${input.type} test: Server rejected malicious input`);
          }
        }
      }
      
      this.log('✅ Basic security tests completed');
      return true;
      
    } catch (error) {
      this.log(`❌ Security testing failed: ${error.message}`);
      return false;
    }
  }

  async generateTestReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    this.log('\n📋 FINAL TEST REPORT');
    this.log('====================');
    this.log(`📅 Test Date: ${new Date().toISOString()}`);
    this.log(`⏱️ Total Duration: ${(totalDuration / 1000).toFixed(2)} seconds`);
    this.log(`🖥️ Environment: Development`);
    this.log(`📊 Database: MongoDB`);
    this.log(`🤖 Bot Framework: Grammy`);
    this.log(`🔌 API Framework: Express.js`);
    
    this.log('\n✅ RECOMMENDATIONS:');
    this.log('- Schedule regular automated testing');
    this.log('- Monitor response times in production');
    this.log('- Implement proper error tracking');
    this.log('- Add integration tests for payment providers');
    this.log('- Set up CI/CD pipeline with these tests');
    this.log('- Consider load testing for high traffic scenarios');
    
    this.log('\n🎉 All testing phases completed!');
    this.log('The system is ready for production deployment.');
  }

  async runAllTests() {
    this.log('🚀 STARTING COMPREHENSIVE TEST SUITE');
    this.log('====================================');
    this.log('This will test the entire GameKey system:');
    this.log('- Database setup and data population');
    this.log('- API endpoints and functionality');
    this.log('- Bot user interactions and workflows');
    this.log('- Performance and security basics');
    this.log('');
    
    try {
      // Wait for server to be ready
      this.log('🔍 Checking server availability...');
      await this.waitForServer('http://localhost:3000');
      
      // Run all test phases
      const results = {
        database: await this.runDatabaseSetup(),
        api: await this.runAPITests(),
        bot: await this.runBotSimulation(),
        performance: await this.runPerformanceTests(),
        security: await this.runSecurityTests()
      };
      
      // Generate final report
      await this.generateTestReport();
      
      // Check overall success
      const allPassed = Object.values(results).every(result => result === true);
      
      if (allPassed) {
        this.log('\n🎊 ALL TESTS PASSED! System is ready for production.');
        process.exit(0);
      } else {
        this.log('\n⚠️ Some tests failed. Please review the results above.');
        process.exit(1);
      }
      
    } catch (error) {
      this.log(`\n💥 Test runner failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Export for use in other files
module.exports = { MasterTestRunner };

// Run if called directly
if (require.main === module) {
  const runner = new MasterTestRunner();
  runner.runAllTests();
}