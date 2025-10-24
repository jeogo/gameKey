# GameKey Test Suite

This comprehensive test suite validates all functionality of the GameKey bot and API system.

## 🚀 Quick Start

### Prerequisites
- Server running on http://localhost:3000
- MongoDB database connected
- Node.js and npm installed

### Run All Tests
```bash
npm run test:all
```

This will execute all test phases in sequence:
1. Database setup with test data
2. API endpoint testing
3. Bot user simulation
4. Performance testing
5. Basic security testing

## 📋 Individual Test Commands

### Database Setup
```bash
npm run test:setup
```
Populates the database with realistic test data:
- 4 product categories (PC Games, Steam Accounts, Gift Cards, Game Passes)
- 4 sample products with prices and stock
- 2 test user accounts

### API Testing
```bash
npm run test:api
```
Tests all REST API endpoints:
- User management (create, read, update)
- Category operations
- Product management
- Order processing
- Payment handling
- Notification system
- Error handling

### Bot Simulation
```bash
npm run test:bot
```
Simulates real user interactions:
- New user registration flow
- Shop browsing and product viewing
- Complete purchase workflow
- Order history checking
- Profile management
- Support interactions
- Error handling and edge cases
- Concurrent user testing

## 🧪 Test Scenarios

### User Journey Testing
1. **New User Registration**
   - User sends /start command
   - Provides username
   - Account creation confirmation

2. **Shopping Experience**
   - Browse product categories
   - View individual products
   - Add to cart and purchase
   - Payment method selection

3. **Order Management**
   - View order history
   - Check order details
   - Order status tracking

4. **Account Management**
   - View profile information
   - Update account details
   - Contact support

### API Validation Testing
- **Data Integrity**: Ensures all CRUD operations work correctly
- **Error Handling**: Tests invalid inputs and edge cases
- **Response Validation**: Verifies correct HTTP status codes and data formats
- **Concurrency**: Tests multiple simultaneous requests

### Performance Testing
- **Response Times**: Measures API endpoint response times
- **Concurrent Requests**: Tests system under load
- **Resource Usage**: Monitors memory and CPU usage patterns

### Security Testing
- **Input Validation**: Tests against SQL injection and XSS attacks
- **Data Sanitization**: Ensures malicious inputs are rejected
- **Rate Limiting**: Validates request throttling (if implemented)

## 📊 Test Results

The test suite provides detailed reporting:
- ✅ **Pass/Fail Status** for each test
- 📈 **Success Rate Percentages**
- ⏱️ **Performance Metrics**
- 🔍 **Detailed Error Messages**
- 📋 **Recommendations**

### Sample Output
```
🚀 STARTING COMPREHENSIVE TEST SUITE
====================================

🗄️ PHASE 1: Database Setup
✅ Created category: PC Games
✅ Created product: Grand Theft Auto V - $29.99
✅ Database setup completed successfully

🔌 PHASE 2: API Testing
✅ PASSED: Create new user
✅ PASSED: Get user by Telegram ID
❌ FAILED: Update user - Validation error

🤖 PHASE 3: Bot Simulation
✅ PASSED: New user starts bot and registers
✅ PASSED: User browses shop and views products

📊 TEST SUMMARY
================
✅ Passed: 45/50 tests
❌ Failed: 5/50 tests
📈 Success Rate: 90.0%
```

## 🛠️ Configuration

### Test Data Customization
Edit `test/database-setup.js` to modify:
- Product categories and descriptions
- Sample products with pricing
- Test user accounts
- Stock quantities

### API Endpoints
Update `test/api-tests.js` to modify:
- Base URL configuration
- Test scenarios
- Validation criteria
- Timeout settings

### Bot Scenarios
Customize `test/bot-simulation.js` for:
- User interaction flows
- Message templates
- Callback button testing
- Error scenario simulation

## 🔧 Troubleshooting

### Common Issues

**Server Not Available**
```
❌ Server not available at http://localhost:3000
```
- Ensure the server is running with `npm run dev`
- Check if the correct port is configured
- Verify MongoDB connection

**Database Connection Errors**
```
❌ Database setup failed: Connection refused
```
- Check MongoDB is running
- Verify connection string in .env
- Ensure database permissions

**Test Timeouts**
```
❌ Test timeout after 30 seconds
```
- Increase timeout values in test configuration
- Check server performance
- Verify network connectivity

### Debug Mode
Add debug logging by setting:
```bash
DEBUG=gamekey:* npm run test:all
```

## 📈 Continuous Integration

### GitHub Actions Setup
Add to `.github/workflows/test.yml`:
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: npm run test:all
```

### Pre-commit Hooks
Install husky for automatic testing:
```bash
npm install --save-dev husky
npx husky add .husky/pre-commit "npm run test:all"
```

## 📝 Best Practices

1. **Run tests before deployment**
2. **Monitor test results in CI/CD**
3. **Update test data regularly**
4. **Add new tests for new features**
5. **Review failed tests immediately**

## 🎯 Success Criteria

- **API Tests**: ≥90% pass rate
- **Bot Simulation**: ≥80% pass rate
- **Response Times**: <1000ms average
- **Error Handling**: All edge cases covered
- **Security**: No malicious inputs accepted

---

**🎉 Happy Testing!** This comprehensive suite ensures your GameKey system is production-ready.