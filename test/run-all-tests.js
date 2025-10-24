/**
 * Test Runner - Executes all GameKey tests
 * Run this to test the entire system: API, Database, Bot, Payments
 */

const GameKeyTester = require('./comprehensive-test.js');
const BotTester = require('./bot-test.js');

class TestRunner {
  constructor() {
    this.results = {
      apiTests: false,
      botTests: false,
      errors: []
    };
  }

  async runAllTests() {
    console.log('🎯 GameKey Complete Test Suite');
    console.log('=' + '='.repeat(60));
    console.log('This will test:');
    console.log('  • API endpoints and database operations');
    console.log('  • Payment system with real NOWPayments integration');
    console.log('  • Bot interactions and user flows');
    console.log('  • Error handling and edge cases');
    console.log();

    try {
      // Run API and database tests
      await this.runAPITests();
      
      // Run bot simulation tests
      await this.runBotTests();
      
      // Generate final report
      await this.generateFinalReport();
      
    } catch (error) {
      console.error('💥 Test suite failed:', error.message);
      this.results.errors.push(error.message);
    }
  }

  async runAPITests() {
    console.log('📡 Running API and Database Tests...');
    console.log('-'.repeat(50));
    
    try {
      const apiTester = new GameKeyTester();
      await apiTester.init();
      await apiTester.generateTestReport();
      
      this.results.apiTests = true;
      console.log('✅ API tests completed successfully');
      
    } catch (error) {
      console.error('❌ API tests failed:', error.message);
      this.results.errors.push(`API Tests: ${error.message}`);
    }
  }

  async runBotTests() {
    console.log('\n🤖 Running Bot Simulation Tests...');
    console.log('-'.repeat(50));
    
    try {
      const botTester = new BotTester();
      await botTester.init();
      
      this.results.botTests = true;
      console.log('✅ Bot tests completed successfully');
      
    } catch (error) {
      console.error('❌ Bot tests failed:', error.message);
      this.results.errors.push(`Bot Tests: ${error.message}`);
    }
  }

  async generateFinalReport() {
    console.log('\n📊 FINAL TEST REPORT');
    console.log('=' + '='.repeat(60));
    
    console.log('Test Results:');
    console.log(`  API & Database Tests: ${this.results.apiTests ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`  Bot Simulation Tests: ${this.results.botTests ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🚨 Errors Encountered:');
      this.results.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    const allTestsPassed = this.results.apiTests && this.results.botTests && this.results.errors.length === 0;
    
    console.log('\n' + '='.repeat(60));
    
    if (allTestsPassed) {
      console.log('🎉 ALL TESTS PASSED! Your GameKey bot is ready for production.');
      console.log('\n💡 Next Steps:');
      console.log('  1. Start your API server: npm start');
      console.log('  2. Start your Telegram bot: npm run start:bot');
      console.log('  3. Test manually with your Telegram bot');
      console.log('  4. Try a real payment with a small amount');
      console.log('  5. Monitor logs for any issues');
    } else {
      console.log('⚠️  SOME TESTS FAILED. Please fix the issues before deploying.');
      console.log('\n🔧 Troubleshooting:');
      console.log('  1. Check if your API server is running (npm start)');
      console.log('  2. Verify MongoDB connection string in .env');
      console.log('  3. Ensure NOWPayments API key is valid');
      console.log('  4. Check network connectivity');
    }
    
    console.log('\n📱 Manual Testing Checklist:');
    console.log('  □ Send /start to your bot');
    console.log('  □ Browse shop categories');
    console.log('  □ View product details');
    console.log('  □ Check your profile');
    console.log('  □ View orders (should be empty initially)');
    console.log('  □ Try purchasing a product');
    console.log('  □ Test payment with different cryptocurrencies');
    console.log('  □ Verify payment URLs work');
    console.log('  □ Test support features');
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TestRunner();
  
  runner.runAllTests()
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

module.exports = TestRunner;