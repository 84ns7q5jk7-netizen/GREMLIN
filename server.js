require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const { getBybitPrice } = require('./bybit');
const { getBestChangePrice } = require('./bestchange');
// Define orderManager at the top
const orderManager = require('./services/orderManager');

const app = express();
app.use(express.json());
app.use(cors());

// Configuration
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const PORT = process.env.PORT || 3000;
const WEBAPP_URL = process.env.WEBAPP_URL || 'http://localhost:3000';

// --- BOT SETUP ---
let bot = null;
if (TOKEN) {
    bot = new TelegramBot(TOKEN, { polling: true });
    console.log('🤖 Bot Started');

    bot.on('polling_error', (error) => {
        console.log(`[polling_error] ${error.code}: ${error.message}`);
    });

    bot.on('message', (msg) => {
        console.log(`📩 Received message: ${msg.text} from ${msg.chat.id}`);
    });

    bot.onText(/\/start/, (msg) => {
        console.log('➡️ /start command triggered');
        const chatId = msg.chat.id;
        bot.sendMessage(chatId, '👋 Welcome to Gremlin Exchange!', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "💸 Open Exchange", web_app: { url: WEBAPP_URL } }]
                ]
            }
        }).catch(err => console.error("Send Error:", err));
    });
}

// --- API ROUTES ---

// Get Live Rates + Markup
app.get('/api/rates', async (req, res) => {
    try {
        // Fetch Real Data
        const [bybit, bestchange] = await Promise.all([
            getBybitPrice('RUB', '1', 'USDT'),
            getBestChangePrice() // USDT -> RUB
        ]);

        let rate = 0;
        if (bestchange) {
            // "Our Rate" = Market Sell Price * 0.985 (1.5% margin)
            rate = bestchange.price * 0.985;
        } else {
            rate = 98.50; // Fallback
        }

        res.json({
            pair: "USDT/RUB",
            marketRate: bestchange ? bestchange.price : 0,
            ourRate: parseFloat(rate.toFixed(2)),
            feePercent: 1.5
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch rates' });
    }
});

// --- ORDER ROUTES ---

app.post('/api/orders', (req, res) => {
    try {
        const order = orderManager.createOrder(req.body);
        res.json(order);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

app.get('/api/orders/:id', (req, res) => {
    const order = orderManager.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
});

app.post('/api/orders/:id/confirm', async (req, res) => {
    const success = await orderManager.confirmPayment(req.params.id);
    if (!success) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true });
});

// Serve Static Files (Vite Build)
app.use(express.static(path.join(__dirname, 'client/dist')));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
