const axios = require('axios');
const billSystem = require('./src/services/billSystem');

(async () => {
    try {
        console.log("Authenticating...");
        const token = await billSystem.authenticate();
        console.log("Authenticated. Token acquired.");

        console.log("Testing /mobile/query-bill for 5551234567, 2024-01...");
        const response = await axios.post('https://midterm4458.onrender.com/api/v1/mobile/query-bill',
            { subscriberNo: '5551234567', month: '2024-01' },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Result:", JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Response data:", error.response.data);
        }
    }
})();
