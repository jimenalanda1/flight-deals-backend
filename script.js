document.getElementById("searchButton").addEventListener("click", function() {
    const selectedMonths = Array.from(document.getElementById("monthSelect").selectedOptions).map(opt => opt.value);
    const departureDay = document.getElementById("departureDay").value;
    const returnDay = document.getElementById("returnDay").value;
    const numResults = document.getElementById("numResults").value;

    // Get the current month and year
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // JavaScript months are 0-based
    const currentYear = today.getFullYear();

    // Adjust selected months to the correct year
    const adjustedMonths = selectedMonths.map(month => {
        const monthNum = parseInt(month, 10);
        const year = (monthNum < currentMonth) ? currentYear + 1 : currentYear;
        return `${year}-${month.padStart(2, "0")}`;
    });

    // Add timestamp to prevent caching
    const queryString = `months=${adjustedMonths.join(",")}&departureDay=${departureDay}&returnDay=${returnDay}&numResults=${numResults}&nocache=${new Date().getTime()}`;

    fetch(`https://flight-deals-backend.onrender.com/api/getFlights?${queryString}`, {
        cache: "no-store"  // Forces browser to always fetch new data
    })
    .then(response => response.json())
    .then(data => {
        let resultsContainer = document.getElementById("results");
        resultsContainer.innerHTML = ""; // Clear previous results

        if (!data || data.length === 0) {
            resultsContainer.innerHTML = "<p>No flights found.</p>";
            return;
        }

        // Create a table to display results
        let table = `
            <table>
                <tr>
                    <th>City</th>
                    <th>Price ($)</th>
                    <th>Date</th>
                    <th>Booking Link</th>
                </tr>
        `;

        data.forEach(flight => {
            table += `
                <tr>
                    <td>${flight.city}</td>
                    <td>${flight.price}</td>
                    <td>${flight.date}</td>
                    <td><a href="${flight.link}" target="_blank">Book Now</a></td>
                </tr>
            `;
        });

        table += "</table>";
        resultsContainer.innerHTML = table;
    })
    .catch(error => {
        console.error("Error fetching flights:", error);
        document.getElementById("results").innerHTML = "<p>Failed to retrieve flight details.</p>";
    });
});
