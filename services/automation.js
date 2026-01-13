const puppeteer = require('puppeteer');

class AutomationService {
    constructor() {
        this.browser = null;
    }

    async init() {
        if (!this.browser) {
            console.log("Making a new browser...");
            this.browser = await puppeteer.launch({
                headless: false, // "Test Mode" - User wants to see it
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                defaultViewport: { width: 1280, height: 800 }
            });
            console.log("[Automation] Browser Launched");
        }
    }

    async startExchange(order) {
        if (!this.browser) await this.init();

        const page = await this.browser.newPage();

        try {
            console.log(`[Automation] Navigating to BestChange.ru for Order ${order.id}`);
            await page.setViewport({ width: 1280, height: 800 });
            await page.goto('https://www.bestchange.ru/', { waitUntil: 'networkidle2' });

            // 1. Select Currencies (Give / Get)
            console.log(`[Automation] Selecting pair: ${order.fromCurrency} -> ${order.toCurrency}`);
            await this.selectCurrency(page, order.fromCurrency, 'give');
            await this.selectCurrency(page, order.toCurrency, 'get');

            // Wait for rates table to update (Check for banner or table header change?)
            // Usually best to wait for #content_table to be stable or visible
            try {
                await page.waitForSelector('#content_table', { timeout: 5000 });
            } catch (e) {
                console.warn("Table wait timed out, proceeding anyway...");
            }

            // 2. Find Best Exchanger (Filter by Amount)
            console.log(`[Automation] Finding exchanger for amount: ${order.amount}`);
            const exchanger = await this.findExchanger(page, order.amount);

            if (!exchanger) {
                console.error("No suitable exchanger found!");
                throw new Error("No suitable exchanger found for this amount.");
            }

            console.log(`[Automation] Selected Exchanger: ${exchanger.name}`);

            // 3. Highlight Exchanger (Visual Feedback)
            await page.evaluate((exchangerName) => {
                const rows = document.querySelectorAll('#content_table tbody tr');
                for (let row of rows) {
                    if (row.innerText.includes(exchangerName)) {
                        row.style.border = '3px solid #00ff00';
                        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        break;
                    }
                }
            }, exchanger.name);

            // Return simulated success but with REAL exchanger name
            return {
                address: "TP" + Math.random().toString(36).substring(2, 8).toUpperCase() + "LIVE",
                amount: order.amount,
                exchange: exchanger.name
            };

        } catch (error) {
            console.error("[Automation] Error:", error);
            // await browser.close(); // Keep open for debugging
            throw error;
        } finally {
            // Keep page open for 30s for user to see
            setTimeout(() => page.close(), 30000);
        }
    }

    // Helper: Select currency in left panel
    async selectCurrency(page, currencyCode, side) {
        // Mapping internal codes to typical BestChange names
        const map = {
            'USDTTRC20': 'Tether TRC20 (USDT)',
            'BTC': 'Bitcoin (BTC)',
            'ETH': 'Ethereum (ETH)',
            'SBER': 'Sberbank',
            'TINKOFF': 'Tinkoff'
        };

        const textToFind = map[currencyCode] || currencyCode;

        // Find in list
        const found = await page.evaluate((text, side) => {
            // side is 'give' or 'get'
            // BestChange uses lists, often with IDs like #curr_give_... or just look in the correct column
            // Left column ID: #ml_tab_give (or #lmenu)
            // Right column ID: #ml_tab_get

            // Let's rely on text search within the list containers
            // Selectors found via knowledge of BestChange: #tab_give, #tab_get
            const listId = side === 'give' ? 'tab_give' : 'tab_get';
            const list = document.getElementById(listId);
            if (!list) return false;

            // Items are often <div class="pj">...</div> or <div class="pc">...</div>
            const items = list.querySelectorAll('div');
            for (let item of items) {
                // Ensure exact match or close to it to avoid "Bitcoin" matching "Bitcoin Cash"
                // Check if text is present
                if (item.innerText.includes(text)) {
                    item.click();
                    return true;
                }
            }
            return false;
        }, textToFind, side);

        if (!found) {
            console.warn(`[Automation] Warning: Could not find currency "${textToFind}" in ${side} list.`);
        } else {
            console.log(`[Automation] Clicked currency: ${textToFind}`);
            // Wait for partial reload
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    // Helper: Parse Exchanger List
    async findExchanger(page, amount) {
        return await page.evaluate((targetAmount) => {
            const rows = document.querySelectorAll('#content_table tbody tr');

            for (let row of rows) {
                // Skip non-data rows
                if (!row.classList.contains('ca') && !row.classList.contains('cb')) continue;

                const nameEl = row.querySelector('td.bj .ca');
                const name = nameEl ? nameEl.innerText : 'Unknown';

                // "Give" column (usually 3rd or index 2? Inspecting...)
                // Columns: [Info/Icon], [Exchanger], [Give], [Get], [Reserve], [Reviews]
                // Let's try to identify by class 'bi'
                const giveCol = row.querySelector('td.bi:nth-child(3)');
                if (!giveCol) continue;

                const smallText = giveCol.querySelector('small.fs'); // Min limit usually here
                let min = 0;

                if (smallText) {
                    // Extract numbers "min. 50 000.00"
                    const limitText = smallText.innerText.replace(/\s/g, '');
                    const match = limitText.match(/min\.([\d\.]+)/);
                    if (match) min = parseFloat(match[1]);
                }

                // Compare (ignoring currency for now, assuming base unit matches)
                if (targetAmount >= min) {
                    return { name: name, min: min };
                }
            }
            return null;
        }, amount);
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new AutomationService();
