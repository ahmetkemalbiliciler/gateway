const express = require('express');
const router = express.Router();
const llmService = require('../services/llm');
const billSystem = require('../services/billSystem');

router.post('/', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        // 1. Parse Intent
        const parsedContext = await llmService.parseIntent(message);
        console.log('Parsed Context:', parsedContext);

        let systemResult = null;
        let responseMessage = parsedContext.message;

        // 2. Execute Action if needed
        if (parsedContext.intent === 'QUERY_UNPAID_BILLS' && parsedContext.subscriberNo) {
            systemResult = await billSystem.queryBill(parsedContext.subscriberNo);
        } else if (parsedContext.intent === 'PAY_BILL' && parsedContext.subscriberNo && parsedContext.month) {
            systemResult = await billSystem.payBill(parsedContext.subscriberNo, parsedContext.month);
        } else if (parsedContext.intent === 'QUERY_BILL_SUMMARY' && parsedContext.subscriberNo && parsedContext.month) {
            systemResult = await billSystem.queryBillSummary(parsedContext.subscriberNo, parsedContext.month);
        } else if (parsedContext.intent === 'ADD_BILL' && parsedContext.subscriberNo && parsedContext.month && parsedContext.billTotal) {
            systemResult = await billSystem.addBill(parsedContext.subscriberNo, parsedContext.month, parsedContext.billTotal);
        } else if (parsedContext.intent === 'QUERY_BILL_DETAILED' && parsedContext.subscriberNo && parsedContext.month) {
            // Fetch both detailed list and unpaid list to calculate status
            const [detailedResult, unpaidResult] = await Promise.all([
                billSystem.queryBillDetailed(parsedContext.subscriberNo, parsedContext.month),
                billSystem.queryBill(parsedContext.subscriberNo)
            ]);

            const allMonthBills = detailedResult.results || [];
            const allUnpaidBills = unpaidResult.unpaidBills || [];

            // Filter unpaid bills for the specific month
            const unpaidForMonth = allUnpaidBills.filter(b => b.month === parsedContext.month);

            // Logic: Total - Unpaid = Paid
            // Note: This assumes simple matching by count since we lack unique IDs in this API
            const totalCount = allMonthBills.length;
            const unpaidCount = unpaidForMonth.length;
            const paidCount = Math.max(0, totalCount - unpaidCount);

            systemResult = {
                month: parsedContext.month,
                totalRecordCount: totalCount,
                unpaidRecordCount: unpaidCount,
                paidRecordCount: paidCount,
                details: detailedResult // Keep original details if needed
            };
        }

        // 3. Generate Natural Language Response
        if (parsedContext.intent !== 'NEED_MORE_INFO' && parsedContext.intent !== 'UNKNOWN') {
            responseMessage = await llmService.generateResponse(message, systemResult || { status: 'Action executed' });
        }

        res.json({
            user: message,
            agent: responseMessage,
            details: systemResult // Optional: send raw details to UI if needed
        });

    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

module.exports = router;
