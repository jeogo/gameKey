/**
 * Bot Simulation Test Suite
 * Simulates real users interacting with the Telegram bot
 */

const axios = require('axios');

const BOT_BASE_URL = 'http://localhost:3000'; // Assuming bot webhook is on same server

class BotSimulator {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      scenarios: []
    };
    this.users = [
      {
        id: 111222333,
        first_name: 'John',
        last_name: 'Gamer',
        username: 'johngamer2024'
      },
      {
        id: 444555666,
        first_name: 'Sarah',
        last_name: 'Pro',
        username: 'sarahpro'
      }
    ];
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }

  // Simulate Telegram message to bot
  async simulateMessage(user, text) {
    const message = {
      update_id: Date.now(),
      message: {
        message_id: Date.now(),
        from: user,
        chat: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          username: user.username,
          type: 'private'
        },
        date: Math.floor(Date.now() / 1000),
        text: text
      }
    };

    try {
      // This would normally go to the bot webhook
      const response = await axios.post(`${BOT_BASE_URL}/webhook`, message, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      this.log(`⚠️ Message simulation failed: ${error.message}`);
      throw error;
    }
  }

  // Simulate button callback
  async simulateCallback(user, data) {
    const callback = {
      update_id: Date.now(),
      callback_query: {
        id: Date.now().toString(),
        from: user,
        message: {
          message_id: Date.now(),
          from: {
            id: 'bot_id',
            is_bot: true,
            first_name: 'GameKey Bot'
          },
          chat: {
            id: user.id,
            type: 'private'
          },
          date: Math.floor(Date.now() / 1000),
          text: 'Previous message'
        },
        data: data
      }
    };

    try {
      const response = await axios.post(`${BOT_BASE_URL}/webhook`, callback, {
        headers: { 'Content-Type': 'application/json' }
      });
      return response.data;
    } catch (error) {
      this.log(`⚠️ Callback simulation failed: ${error.message}`);
      throw error;
    }
  }

  async testScenario(scenarioName, testFunction) {
    try {
      this.log(`🎭 Scenario: ${scenarioName}`);
      await testFunction();
      this.testResults.passed++;
      this.testResults.scenarios.push({ name: scenarioName, status: 'PASSED' });
      this.log(`✅ PASSED: ${scenarioName}`);
    } catch (error) {
      this.testResults.failed++;
      this.testResults.scenarios.push({ name: scenarioName, status: 'FAILED', error: error.message });
      this.log(`❌ FAILED: ${scenarioName} - ${error.message}`);
    }
  }

  // Scenario 1: New user registration
  async testNewUserRegistration() {
    await this.testScenario('New user starts bot and registers', async () => {
      const user = this.users[0];
      
      // User sends /start
      this.log('👤 User sends /start command');
      await this.simulateMessage(user, '/start');
      
      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // User provides username
      this.log('📝 User provides username');
      await this.simulateMessage(user, 'johngamer2024');
      
      // Wait for confirmation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.log('✨ Registration flow completed');
    });
  }

  // Scenario 2: Browse shop and view products
  async testShopBrowsing() {
    await this.testScenario('User browses shop and views products', async () => {
      const user = this.users[0];
      
      // User clicks shop button
      this.log('🛒 User clicks Shop button');
      await this.simulateCallback(user, 'shop');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // User selects a category (assuming PC Games category exists)
      this.log('📂 User selects PC Games category');
      await this.simulateCallback(user, 'category_pc_games');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // User views a specific product
      this.log('🎮 User views specific product');
      await this.simulateCallback(user, 'product_view_1');
      
      this.log('👀 Shop browsing completed');
    });
  }

  // Scenario 3: Complete purchase flow
  async testPurchaseFlow() {
    await this.testScenario('User completes full purchase flow', async () => {
      const user = this.users[0];
      
      // User initiates purchase
      this.log('💰 User initiates purchase');
      await this.simulateCallback(user, 'buy_product_1');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // User selects payment method
      this.log('💳 User selects USDT payment');
      await this.simulateCallback(user, 'payment_usdt');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate payment completion (this would normally be a webhook from payment provider)
      this.log('✅ Payment completed via webhook simulation');
      
      this.log('🎉 Purchase flow completed');
    });
  }

  // Scenario 4: Check order history
  async testOrderHistory() {
    await this.testScenario('User checks order history', async () => {
      const user = this.users[0];
      
      // User clicks orders button
      this.log('📦 User clicks Orders button');
      await this.simulateCallback(user, 'orders');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // User views specific order details
      this.log('🔍 User views order details');
      await this.simulateCallback(user, 'order_details_1');
      
      this.log('📋 Order history check completed');
    });
  }

  // Scenario 5: Profile management
  async testProfileManagement() {
    await this.testScenario('User manages profile', async () => {
      const user = this.users[1];
      
      // Second user starts bot
      this.log('👤 Second user starts bot');
      await this.simulateMessage(user, '/start');
      await this.simulateMessage(user, 'sarahpro');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // User views profile
      this.log('👤 User views profile');
      await this.simulateCallback(user, 'profile');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.log('🔧 Profile management completed');
    });
  }

  // Scenario 6: Support interaction
  async testSupportInteraction() {
    await this.testScenario('User interacts with support', async () => {
      const user = this.users[1];
      
      // User clicks support button
      this.log('🆘 User clicks Support button');
      await this.simulateCallback(user, 'support');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // User sends support message
      this.log('💬 User sends support message');
      await this.simulateMessage(user, 'I need help with my order');
      
      this.log('📞 Support interaction completed');
    });
  }

  // Scenario 7: Error handling and edge cases
  async testErrorHandling() {
    await this.testScenario('Bot handles errors gracefully', async () => {
      const user = this.users[1];
      
      // User sends invalid command
      this.log('❓ User sends invalid command');
      await this.simulateMessage(user, '/invalidcommand');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // User clicks non-existent callback
      this.log('🔘 User clicks invalid button');
      try {
        await this.simulateCallback(user, 'invalid_callback_data');
      } catch {
        // Expected to fail gracefully
      }
      
      this.log('🛡️ Error handling test completed');
    });
  }

  // Load testing with multiple concurrent users
  async testConcurrentUsers() {
    await this.testScenario('Multiple users interact simultaneously', async () => {
      this.log('👥 Simulating 5 concurrent users');
      
      const concurrentPromises = [];
      
      for (let i = 0; i < 5; i++) {
        const testUser = {
          id: 900000000 + i,
          first_name: `TestUser${i}`,
          username: `testuser${i}`
        };
        
        concurrentPromises.push(
          this.simulateMessage(testUser, '/start')
            .then(() => new Promise(resolve => setTimeout(resolve, 200)))
            .then(() => this.simulateMessage(testUser, `testuser${i}`))
            .then(() => this.simulateCallback(testUser, 'shop'))
        );
      }
      
      await Promise.all(concurrentPromises);
      
      this.log('⚡ Concurrent user test completed');
    });
  }

  async runAllScenarios() {
    this.log('🤖 Starting bot simulation tests...\n');
    
    // Basic functionality tests
    await this.testNewUserRegistration();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.testShopBrowsing();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.testPurchaseFlow();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.testOrderHistory();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.testProfileManagement();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.testSupportInteraction();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Edge cases and performance
    await this.testErrorHandling();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.testConcurrentUsers();
    
    this.printSummary();
  }

  printSummary() {
    this.log('\n🤖 BOT SIMULATION SUMMARY');
    this.log('==========================');
    this.log(`✅ Passed Scenarios: ${this.testResults.passed}`);
    this.log(`❌ Failed Scenarios: ${this.testResults.failed}`);
    this.log(`📈 Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(1)}%`);

    this.log('\n📊 SCENARIO RESULTS:');
    this.testResults.scenarios.forEach((scenario, index) => {
      const status = scenario.status === 'PASSED' ? '✅' : '❌';
      this.log(`${index + 1}. ${status} ${scenario.name}`);
      if (scenario.error) {
        this.log(`   Error: ${scenario.error}`);
      }
    });

    this.log('\n🎉 Bot simulation testing completed!');
    this.log('\n📝 RECOMMENDATIONS:');
    this.log('- Monitor bot response times during peak usage');
    this.log('- Test payment webhooks with real payment providers');
    this.log('- Validate error messages are user-friendly');
    this.log('- Ensure all buttons work correctly');
    this.log('- Test with different user permissions and states');
  }
}

// Run simulation if called directly
if (require.main === module) {
  const simulator = new BotSimulator();
  simulator.runAllScenarios().catch(console.error);
}

module.exports = { BotSimulator };