const axios = require('axios');

const API_BASE_URL = 'https://midterm4458.onrender.com/api/v1';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''; // We might not need this if we don't use admin endpoints, but good to have.
// For Mobile/Bank endpoints we might need specific tokens. 
// However, the prompt says "Uses constant userid/password". 
// Let's assume we log in once to get a token or use a hardcoded one.
// The API Doc says /auth/login returns a token.

class BillSystem {
    constructor() {
        this.token = null;
        this.validUntil = 0;
    }

    async authenticate() {
        // Simple caching of token
        if (this.token && Date.now() < this.validUntil) return this.token;

        try {
            // Using a default user as per prompt "constant userid/password"
            // We'll use the example one or one provided in env
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                username: process.env.API_USERNAME || 'admin'
            });
            this.token = response.data.token;
            this.validUntil = Date.now() + 3600000; // 1 hour validity assumption
            return this.token;
        } catch (error) {
            console.error('Authentication failed:', error.message);
            throw new Error('Could not authenticate with Bill System');
        }
    }

    async payBill(subscriberNo, month) {
        // Public endpoint, no token needed
        try {
            const response = await axios.post(`${API_BASE_URL}/web/pay-bill`, {
                subscriberNo,
                month
            });
            return response.data;
        } catch (error) {
            if (error.response) {
                return { error: error.response.data.paymentStatus || 'Error', details: error.response.data };
            }
            throw error;
        }
    }

    async queryBill(subscriberNo) {
        // Bank endpoint requires token
        const token = await this.authenticate();
        try {
            const response = await axios.post(`${API_BASE_URL}/bank/query-bill`,
                { subscriberNo },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            if (error.response) {
                return { error: 'Query failed', details: error.response.data };
            }
            throw error;
        }
    }

    async queryBillDetailed(subscriberNo, month) {
        // Mobile endpoint requires token
        const token = await this.authenticate();
        try {
            const response = await axios.post(`${API_BASE_URL}/mobile/query-bill-detailed`,
                { subscriberNo, month },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            if (error.response) {
                return { error: 'Detailed query failed', details: error.response.data };
            }
            throw error;
        }
    }

    async queryBillSummary(subscriberNo, month) {
        // Mobile endpoint requires token, rate limited (3/day)
        const token = await this.authenticate();
        try {
            const response = await axios.post(`${API_BASE_URL}/mobile/query-bill`,
                { subscriberNo, month },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            if (error.response) {
                return { error: 'Summary query failed', details: error.response.data };
            }
            throw error;
        }
    }

    async addBill(subscriberNo, month, billTotal) {
        // Admin endpoint requires token
        const token = await this.authenticate();
        try {
            const response = await axios.post(`${API_BASE_URL}/web/admin/add-bill`,
                { subscriberNo, month, billTotal: parseFloat(billTotal) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return response.data;
        } catch (error) {
            if (error.response) {
                return { error: 'Add bill failed', details: error.response.data };
            }
            throw error;
        }
    }
}

module.exports = new BillSystem();
