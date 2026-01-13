const axios = require('axios');

async function getBinancePrice(fiat = 'RUB', tradeType = 'BUY', asset = 'USDT') {
    try {
        const response = await axios.post(
            'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search',
            {
                "fiat": fiat,
                "page": 1,
                "rows": 10,
                "tradeType": tradeType,
                "asset": asset,
                "countries": [],
                "proMerchantAds": false,
                "shieldMerchantAds": false,
                "publisherType": null,
                "payTypes": [] // Empty = All banks
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0"
                }
            }
        );

        if (response.data) {
            // console.log(JSON.stringify(response.data, null, 2)); // Debug blocked, uncomment if needed. 
            // Actually let's just log the code for now.

            if (response.data.code !== "000000") {
                console.log("API Error:", response.data);
            }

            if (response.data.data && response.data.data.length > 0) {
                const bestAd = response.data.data[0];
                return {
                    price: parseFloat(bestAd.adv.price),
                    merchant: bestAd.advertiser.nickName,
                    available: bestAd.adv.surplusAmount
                };
            }
        }
        return null;
    } catch (error) {
        console.error('Error fetching Binance:', error.message);
        return null; // Silent failure for MVP loop
    }
}

if (require.main === module) {
    getBinancePrice().then(res => console.log("Result:", res));
}

module.exports = { getBinancePrice };
