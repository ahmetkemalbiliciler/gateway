require('dotenv').config();
const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chat');
const llmService = require('./services/llm');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize LLM
llmService.init(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());

app.use('/api/chat', chatRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Gateway running on http://localhost:${PORT}`);
});
