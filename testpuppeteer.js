const puppeteer = require("puppeteer");

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.goto("https://www.google.com/travel/flights", { waitUntil: "networkidle2" });
    console.log("✅ Google Flights Loaded");
    await browser.close();
})();