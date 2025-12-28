const billSystem = require('./src/services/billSystem');

(async () => {
    try {
        await billSystem.authenticate();
        console.log("Testing /bank/query-bill for 5551234567...");
        const result = await billSystem.queryBill('5551234567');
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
    }
})();
