const { v4: uuidv4 } = require('uuid');

// In-memory store for orders (Replace with DB later)
const orders = new Map();

const ORDER_STATUS = {
    CREATED: 'created',
    FINDING_RATE: 'finding_rate',
    ORDER_PLACED: 'order_placed',
    WAITING_PAYMENT: 'waiting_payment',
    PAID: 'paid',
    COMPLETED: 'completed',
    FAILED: 'failed'
};

class OrderManager {
    createOrder(data) {
        const orderId = uuidv4();
        const order = {
            id: orderId,
            user: {
                wallet: data.wallet,
                email: data.email
            },
            amount: data.amount,
            pair: "USDT/RUB",
            fromCurrency: "USDTTRC20",
            toCurrency: "SBER",
            status: ORDER_STATUS.CREATED, // Start here
            createdAt: Date.now(),
            requisites: null, // Will be filled by "AI"
            externalOrderId: null
        };

        orders.set(orderId, order);

        // --- SIMULATE AI AGENT WORKFLOW (Async) ---
        this.processOrder(orderId);

        return order;
    }

    getOrder(id) {
        return orders.get(id);
    }

    // This simulates the "Headless Browser" or "API Wrapper" logic
    async processOrder(orderId) {
        const order = orders.get(orderId);
        if (!order) return;

        console.log(`[OrderManager] Processing ${orderId}...`);

        // Use Real Automation
        order.status = ORDER_STATUS.FINDING_RATE;
        console.log(`[OrderManager] Launching Automation for ${orderId}...`);

        try {
            const automationService = require('./automation');
            const result = await automationService.startExchange(order);

            // automationService returned data (simulated scraping result)
            order.status = ORDER_STATUS.WAITING_PAYMENT;
            order.requisites = {
                address: result.address,
                amount: result.amount,
                validUntil: Date.now() + 15 * 60 * 1000
            };
            console.log(`[OrderManager] Order ${orderId} waiting for payment. Browser success.`);

        } catch (e) {
            console.error("Automation Failed", e);
            order.status = ORDER_STATUS.FAILED;
        }
    }

    async confirmPayment(orderId) {
        const order = orders.get(orderId);
        if (!order) return false;

        order.status = ORDER_STATUS.PAID;
        console.log(`[OrderManager] Order ${orderId} marked as PAiD.`);
        return true;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new OrderManager();
