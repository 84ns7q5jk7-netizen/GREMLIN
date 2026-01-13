const axios = require('axios');

async function getBybitPrice(currency = 'RUB', side = '1', token = 'USDT') {
    // side: '1' = Buy (User buys from merchant), '0' = Sell
    try {
        const response = await axios.post(
            'https://api2.bybit.com/fiat/otc/item/online',
            {
                "userId": "",
                "tokenId": token,
                "currencyId": currency,
                "payment": [],
                "side": side,
                "size": "10",
                "page": "1",
                "amount": ""
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0"
                }
            }
        );

        if (response.data && response.data.result && response.data.result.items) {
            const bestAd = response.data.result.items[0];
            return {
                price: parseFloat(bestAd.price),
                merchant: bestAd.nickName,
                available: bestAd.lastQuantity
            };
        }
        return null;
    } catch (error) {
        console.error('Error fetching Bybit:', error.message);
        return null;
    }
}

if (require.main === module) {
    getBybitPrice().then(console.log);
}

module.exports = { getBybitPrice };
