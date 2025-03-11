const puppeteer = require("puppeteer");
const chromium = require("chrome-aws-lambda"); // Add this package

const fs = require("fs");

const airportToCity = {
    // South Africa
    "CPT": "Cape Town",
    "JNB": "Johannesburg",

    // South Korea
    "ICN": "Seoul",

    // Austria
    //"VIE": "Vienna",

    // Croatia
   // "DBV": "Dubrovnik",

    // Norway
    //"OSL": "Oslo",

    // Portugal
    //"FAO": "Faro",
    //"FNC": "Funchal",
    //"LIS": "Lisbon",
    //"OPO": "Porto",

    // Costa Rica
    //"LIR": "Liberia",
    //"SJO": "San Jose",

    // Bahamas
    //"NAS": "Nassau",

    // U.S. Virgin Islands
    //"STT": "St. Thomas",
   // "STX": "St. Croix"
};

// ** Function to find all occurrences of a given weekday in a month **
function getAllDatesForWeekday(yearMonth, departureDay, returnDay) {
    const [year, month] = yearMonth.split("-").map(Number);
    let dates = [];

    for (let day = 1; day <= 31; day++) {
        let date = new Date(year, month - 1, day);
        if (date.getMonth() !== month - 1) break; // Stop at the end of the month

        if (date.getDay() === departureDay) {
            // Find corresponding return date
            let returnDate = new Date(date);
            returnDate.setDate(returnDate.getDate() + (returnDay - departureDay + 7) % 7); // Get next occurrence of returnDay
            if (returnDate.getMonth() !== month - 1) continue; // Ensure it's within the same month

            dates.push({
                departure: date.toISOString().split("T")[0],
                return: returnDate.toISOString().split("T")[0]
            });
        }
    }

    return dates;
}

// Read user input from command-line arguments
const travelMonths = process.argv[2].split(",");
const departureDay = parseInt(process.argv[3]); // Expecting 0 (Sunday) - 6 (Saturday)
const returnDay = parseInt(process.argv[4]);
const numResults = parseInt(process.argv[5]);

async function fetchCheapestFlights(travelMonths, departureDay, returnDay, numResults) {
    console.log(`🚀 Searching direct flights for: ${travelMonths}, Depart: ${departureDay}, Return: ${returnDay}, Showing: ${numResults}`);

    let flightDeals = [];

    for (let month of travelMonths) {
        const allDates = getAllDatesForWeekday(month, departureDay, returnDay);

        for (let datePair of allDates) {
            for (let destination in airportToCity) {
                console.log(`✈️ Searching flights from EWR to ${airportToCity[destination]} (${destination}) on ${datePair.departure} → ${datePair.return}...`);
                const browser = await puppeteer.launch({
                    executablePath: await chromium.executablePath, // Uses Chromium from package
                    headless: true,
                    args: [
                        "--no-sandbox",
                        "--disable-setuid-sandbox"
                    ]
                });
                
                const page = await browser.newPage();

                // Construct Google Flights search URL
                const searchURL = `https://www.google.com/travel/flights?q=Flights%20from%20EWR%20to%20${destination}%20on%20${datePair.departure}%20returning%20${datePair.return}&flt=direct`;
                await page.goto(searchURL, { waitUntil: "networkidle2" });

                try {
                    await page.waitForSelector("div.YMlIz.FpEdX.jLMuyc span", { timeout: 20000 });
                } catch (error) {
                    console.log(`❌ Flights did not load for ${airportToCity[destination]}`);
                    await browser.close();
                    continue;
                }

                // Extract the cheapest flight price
                const cheapestFlight = await page.evaluate((cityName, searchURL, departure) => {
                    let priceElement = document.querySelector("div.YMlIz.FpEdX.jLMuyc span");
                    if (!priceElement) return null;

                    let price = priceElement.innerText.replace("$", "").replace(",", "");
                    return {
                        city: cityName,
                        price: parseInt(price),
                        date: departure,
                        link: searchURL
                    };
                }, airportToCity[destination], searchURL, datePair.departure);

                console.log(`✅ Cheapest flight to ${airportToCity[destination]}:`, cheapestFlight);

                flightDeals.push(cheapestFlight);
                await browser.close();
            }
        }
    }

    // Sort by price and return the user-defined number of results
    flightDeals.sort((a, b) => a.price - b.price);
    flightDeals = flightDeals.slice(0, numResults);

    fs.writeFileSync("flights.json", JSON.stringify(flightDeals, null, 2));
    console.log("✅ Flight deals saved to flights.json!");
}

// ** Run the scraper with user-provided inputs **
fetchCheapestFlights(travelMonths, departureDay, returnDay, numResults);
