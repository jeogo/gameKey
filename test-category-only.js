const { APITester } = require('./test/api-tests');

(async () => {
  const tester = new APITester();
  await tester.testCategoryAPI();
  tester.printSummary();
})();