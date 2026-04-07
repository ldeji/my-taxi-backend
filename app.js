import express from 'express'; // 1. Use express instead of http
import { calculateFare } from './math.js'; // Import the fare calculation function from math.js


const bookings = []; // This will act as our temporary database
const app = express(); // 2. Initialize the express "app"
app.use(express.json()); // This allows Express to read JSON in the "Body" of a request. Posting data to the server is common in real apps.
const PORT = 3000;

// 3. Define your routes (No more if/else!)
// Home Page
app.get('/', (req, res) => {
    // res.send automatically sets the header and ends the response!
    res.send('<h1>Welcome to Akano Taxi Company!</h1><h1>Welcome To Our Home Page. - Happy Travelling!</h1>');
});

// About Page
app.get('/about', (req, res) => {
    res.send('<h1>Welcome to the About Page!</h1><p>We provide excellent taxi services!</p>');
});

// Contact Page
app.get('/contact', (req, res) => {
    res.send('<h1>Contact Us</h1><p>Email: akanotaxi@service.com</p>');
});

// Fleet Page. Sends HTML (for humans to read).
app.get('/fleet', (req, res) => {
    res.send('<h1>Our Fleet</h1><p>Check out our fleet of taxis!</p><ul><li>Taxi 1: Sedan</li><li>Taxi 2: SUV</li><li>Taxi 3: Van</li><li>Taxi 4: Keke Napep</li><li>Taxi 5: Okada</li></ul>');
});

// A "Database" of your taxis (normally this comes from MongoDB)
const taxiFleet = [
    { id: 1, type: "Sedan", pricePerKm: 2.5, available: true },
    { id: 2, type: "SUV", pricePerKm: 4.0, available: false },
    { id: 3, type: "Van", pricePerKm: 5.5, available: true },
    { id: 4, type: "Keke", pricePerKm: 1.0, available: true },
    { id: 5, type: "Danfo", pricePerKm: 2.9, available: true }
];

// READING DATA (GET) - API Routes
// JSON API Route  Sends JSON (for React/Apps to read).
app.get('/api/fleet', (req, res) => {
    // res.json() is a special Express function!
    // It converts the JavaScript array/object into a JSON string automatically.
    res.json(taxiFleet);
});

// Get a SINGLE taxi by ID
app.get('/api/fleet/:taxiId', (req, res) => {
    // 1. Grab the ID from the URL
    // req.params.taxiId matches the ":taxiId" in the route string
    const id = req.params.taxiId;

    // 2. Find the taxi by ID in our "database" array
    const taxi = taxiFleet.find(t => t.id === parseInt(id));

    // 3. Logic: What if the taxi doesn't exist?
    if (!taxi) {
        return res.status(404).json({ message: "Taxi not found! Try ID 1, 2, 3, or 4." });
    }

    // 4. Send the specific taxi data
    res.json(taxi);
});



// Get a fare estimate for a ride
app.get('/api/estimate/:type/:distance', (req, res) => {
    // 1. Get the data from the URL
    const type = req.params.type.toLowerCase();
    const distance = parseFloat(req.params.distance);

    // 2. Look up the taxi to get its price
    const taxi = taxiFleet.find(t => t.type.toLowerCase() === type);

    // 3. Validation: Check if taxi exists and distance is a number
    if (!taxi) {
        return res.status(404).json({ error: "Invalid taxi type. Please type Sedan, SUV, or Van." });
    }
    if (isNaN(distance)) {
        return res.status(400).json({ error: "Distance must be a number." });
    }

    // 4. Use our Math Module to calculate the cost
    const totalFare = calculateFare(taxi.pricePerKm, distance);

    // 5. Send back a "Receipt" JSON
    res.json({
        confirmation: "Estimate Fare Calculated",
        details: {
            vehicle: taxi.type,
            distance: `${distance} km`,
            pricePerKm: `#${taxi.pricePerKm}`,
            totalEstimate: `#${totalFare.toFixed(2)}`
        },
        notice: "Prices may vary based on traffic."
    });
});



// Search for a specific type of vehicle
app.get('/api/search/:vehicleType', (req, res) => {
    const type = req.params.vehicleType.toLowerCase();
    
    // Filter the fleet to find matches
    const matches = taxiFleet.filter(t => t.type.toLowerCase() === type);

    if (matches.length === 0) {
        return res.status(404).json({ message: `No ${type}s found in our fleet. Try Sedan, SUV, Van, Danfo or Keke.` });
    }

    res.json(matches);
});


// A flexible search route using Query Parameters . The "Professional Search" way
app.get('/api/search', (req, res) => {
    // req.query grabs everything after the "?"
    const searchType = req.query.type; 

    if (!searchType) {
        return res.json(taxiFleet); // If no search, show everything
    }

    const results = taxiFleet.filter(t => 
        t.type.toLowerCase().includes(searchType.toLowerCase())
    );

    res.json({
        resultsFound: results.length,
        data: results
    });
});


// POST: Book a Taxi
app.post('/api/bookings', (req, res) => {
    // 1. Get the data sent by the user from req.body
    const { passengerName, pickupLocation, taxiId } = req.body;

    // 2. Simple Validation: Make sure they sent all info
    if (!passengerName || !pickupLocation || !taxiId) {
        return res.status(400).json({ error: "Please provide name, pickup, and taxiId." });
    }

    // 3. Create a new booking object
    const newBooking = {
        bookingId: bookings.length + 1,
        passengerName,
        pickupLocation,
        taxiId,
        status: "Confirmed",
        bookedAt: new Date()
    };

    // 4. "Save" it to our array
    bookings.push(newBooking);

    // 5. Send back a 201 (Created) status and the confirmation
    res.status(201).json({
        message: "Booking successful!",
        data: newBooking
    });
});

// Also, let's add a GET route so we can see all bookings
app.get('/api/bookings', (req, res) => {
    res.json(bookings);
});

// 404 - Not Found
// Express goes from top to bottom. If it doesn't match the routes above, it hits this.
app.use((req, res) => {
    res.status(404).send('<h1>404: Page Not Found</h1>');
});

// 4. Start the server
app.listen(PORT, () => {
    console.log(`Express server is running at http://localhost:${PORT}`);
});