const axios = require('axios');
const cheerio = require('cheerio');

// URL for USDT (TRC20) -> Sberbank/Tinkoff (or RUB general)
// ID 10 = Sberbank, ID 63 = Tinkoff
// ID 105 = USDT TRC20
// Example: Exchange USDT TRC20 to Tinkoff RUB (Sell USDT)
// Direction: GIVE 105 (USDT) -> GET 63 (Tinkoff)

async function getBestChangePrice(giveId = 105, getId = 63) {
    try {
        // Request the specific pair page
        const url = `https://www.bestchange.com/tether-trc20-to-tinkoff.html`;
        // Note: .com version is English, .ru is Russian. Rates are global usually.

        const response = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36"
            }
        });

        const $ = cheerio.load(response.data);

        // Selector for the best rate (first row in table)
        // Table id is Usually 'content_table' -> 'tbody' -> 'tr'
        // The rate is in a specific column. BestChange structure is tricky.
        // Simplified: Fetch 'fs' (Give) and 'ts' (Get) in the first data row.

        // Finding the first exchange row
        const firstRow = $('#content_table tbody tr').first();
        if (!firstRow.length) return null;

        // Rate is usually in the column with class 'bi' (Give) and 'bi' (Get) text processing
        // BestChange format: "1 USDT = 92.5 RUB"
        // actually column 3 (Give) and 4 (Get) usually.

        // Let's grab the text from the rate column.
        const rateText = firstRow.find('.bi').text(); // "1"
        // The second .bi is the second value
        // Safer way: Iterate tds

        // td.bi are the amounts.
        // We typically want the "Get" amount for 1 "Give" unit.

        // Let's assume we want to SELL USDT there.
        // So we look for Highest Price? No, valid exchangers are sorted.
        // Top 1 is best rate.

        // In "USDT -> RUB", Top 1 = High RUB for 1 USDT.
        // rate is typically stored in `fs` (from sum) `ts` (to sum) attributes internally or parsing text.

        // For MVP, valid parsing of the table:
        const rateCell = firstRow.find('td.bi').last();
        let price = parseFloat(firstRow.find('td.bi').eq(1).text().split(' ')[0]);

        // Fallback if structure varies:
        // Text might be "92.5483 RUB"

        // Let's look for a simpler way: BestChange provides an API export file `info.zip`, but for realtime we parse.
        // Let's rely on text content of the rate.

        const giveVal = parseFloat(firstRow.find('td.bi').first().text()); // 1
        const getVal = parseFloat(firstRow.find('td.bi').eq(1).text()); // 92.50

        const exchangeName = firstRow.find('td.bj').find('div.ca').text();

        return {
            price: getVal / giveVal, // Price of 1 Unit
            exchange: exchangeName
        };

    } catch (error) {
        console.error('Error fetching BestChange:', error.message);
        return null;
    }
}

if (require.main === module) {
    getBestChangePrice().then(console.log);
}

module.exports = { getBestChangePrice };
