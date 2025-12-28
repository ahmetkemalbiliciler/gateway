const { GoogleGenerativeAI } = require("@google/generative-ai");

class LLMService {
    constructor() {
        this.genAI = null;
        this.model = null;
    }

    init(apiKey) {
        if (!apiKey) {
            console.warn("Gemini API Key is missing!");
            return;
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    async parseIntent(userMessage) {
        if (!this.model) throw new Error("LLM Service not initialized");

        const prompt = `
        You are an AI assistant for a Bill Payment System.
        Your job is to extract the user's intent and parameters from their message.
        
        Available tools/intents matching the API 1:1:
        1. QUERY_UNPAID_BILLS: List unpaid bills. Endpoint: /bank/query-bill. Required: subscriberNo.
        2. PAY_BILL: Pay a specific bill. Endpoint: /web/pay-bill. Required: subscriberNo, month (YYYY-MM).
        3. QUERY_BILL_SUMMARY: Get quick bill status (Limited 3/day). Endpoint: /mobile/query-bill. Required: subscriberNo, month (YYYY-MM).
        4. QUERY_BILL_DETAILED: Get detailed bill info (Unlimited). Endpoint: /mobile/query-bill-detailed. Required: subscriberNo, month (YYYY-MM).
        5. ADD_BILL: Add a new bill (Admin). Endpoint: /web/admin/add-bill. Required: subscriberNo, month (YYYY-MM), billTotal (number).
        
        Rules:
        - If the user explicitly asks to "pay" or "payment" but is missing the 'month', you MUST return "NEED_MORE_INFO" and ask for the month. DO NOT default to QUERY_UNPAID_BILLS.
        - If the user asks to "check bills", "list bills", or "what do I owe", use QUERY_UNPAID_BILLS.
        - If the user asks for a "summary" or "status" of a specific month, use QUERY_BILL_SUMMARY.
        - If the user asks for "details" or "breakdown" of a specific month, use QUERY_BILL_DETAILED.
        - If the user wants to "add bill" or "create bill", use ADD_BILL.
        
        If information is missing for the chosen intent, set intent to "NEED_MORE_INFO" and specify what is missing in "message".
        If the request is unrelated, set intent to "UNKNOWN".

        Current Date: ${new Date().toISOString().split('T')[0]}

        User Message: "${userMessage}"

        Respond ONLY in JSON format:
        {
            "intent": "QUERY_UNPAID_BILLS" | "PAY_BILL" | "QUERY_BILL_SUMMARY" | "QUERY_BILL_DETAILED" | "ADD_BILL" | "NEED_MORE_INFO" | "UNKNOWN",
            "subscriberNo": "string" | null,
            "month": "YYYY-MM" | null,
            "billTotal": number | null,
            "message": "string (optional, for clarification or chat response)"
        }
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Cleanup json markdown if present
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("LLM Error:", error);
            return { intent: "UNKNOWN", message: "Sorry, I am having trouble understanding you right now." };
        }
    }

    async generateResponse(userMessage, actionResult) {
        if (!this.model) return "System Error";

        const prompt = `
        You are a helpful customer service AI.
        
        User said: "${userMessage}"
        
        We performed an action and got this result:
        ${JSON.stringify(actionResult, null, 2)}
        
        Please formulate a natural language response to the user summarizing the result.
        
        Important Rules:
        - If the result contains an error mentioning "Daily limit exceeded" or status 429, you MUST apologize and inform the user that they have reached their daily transaction limit.
        - If the result contains "paidRecordCount" and "unpaidRecordCount", you MUST explicitly state these numbers in your summary.
          - Example: "For [month], I found [total] bills. [paid] are Paid and [unpaid] are Unpaid."
        - If specific detailed text is missing, do not focus on that error. Instead, focus on the helpful summary of Paid vs Unpaid status.
        - Be polite and helpful.
        `;

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    }
}

module.exports = new LLMService();
