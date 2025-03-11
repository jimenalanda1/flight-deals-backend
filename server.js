const express = require("express");
const fs = require("fs");
const cors = require("cors");
const { exec } = require("child_process");

const app = express();
app.use(cors());

// Disable caching in responses
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
});

// API endpoint to fetch fresh flight data
app.get("/api/getFlights", (req, res) => {
    const { months, departureDay, returnDay, numResults } = req.query;

    if (!months || !departureDay || !returnDay || !numResults) {
        return res.status(400).json({ error: "Missing parameters." });
    }

    console.log("🔄 Running scraper with:", { months, departureDay, returnDay, numResults });

    // Run the scraper dynamically with updated parameters
    exec(`node scraper.js "${months}" "${departureDay}" "${returnDay}" "${numResults}"`, (error, stdout, stderr) => {
        if (error) {
            console.error("❌ Error running scraper:", stderr);
            return res.status(500).json({ error: "Failed to fetch flight details." });
        }

        console.log("✅ Scraper executed successfully. Fetching results...");

        try {
            const data = fs.readFileSync("flights.json", "utf-8");
            res.json(JSON.parse(data));
        } catch (readError) {
            console.error("❌ Error reading flights.json:", readError);
            res.status(500).json({ error: "Failed to retrieve flight details." });
        }
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
