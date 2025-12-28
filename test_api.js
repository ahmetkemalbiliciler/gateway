const billSystem = require('./src/services/billSystem');

(async () => {
    try {
        console.log("Testing authenticate...");
        await billSystem.authenticate();
        console.log("Authenticated.");

        console.log("Testing queryBillDetailed for 5551234567, 2024-01...");
        const result = await billSystem.queryBillDetailed('5551234567', '2024-01');
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
})();
