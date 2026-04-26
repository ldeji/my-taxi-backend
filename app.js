import 'dotenv/config';  // Load environment variables from .env file (like MONGO_URI)
import express from 'express'; // For creating the Express server and handling routes
import mongoose from 'mongoose';  // For MongoDB connection and schema management
import Booking from './Booking.js'; // Booking model for MongoDB interactions
import { calculateFare } from './math.js'; // A simple utility function to calculate fare based on price per km and distance. This keeps our code clean and modular.
import cors from 'cors'; // npm install cors was installed to allow cross-origin requests from the React frontend
import bcrypt from 'bcryptjs';  // For password hashing
import jwt from 'jsonwebtoken'; // For token generation and verification
import User from './User.js';  // User model for authentication and role management


const app = express();
app.use(cors()); // This allows the Frontend to access the API!

const PORT = 3000;

// Middleware
app.use(express.json());

// 1. DATABASE CONNECTION
// We use the variable from .env file
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB!"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err.message));

// 2. MOCK DATA (Taxi Fleet)
const taxiFleet = [
    { id: 1, type: "Sedan", pricePerKm: 800, color: "White", available: true },
    { id: 2, type: "SUV", pricePerKm: 600, color: "Red", available: false },
    { id: 3, type: "BRT", pricePerKm: 500, color: "Arsh", available: true },
    { id: 4, type: "Keke", pricePerKm: 300, color: "Yellow", available: true },
    { id: 5, type: "Danfo", pricePerKm: 300, color: "Yellow", available: true },
    { id: 6, type: "Okada", pricePerKm: 200, color: "Green", available: true }
];

// --- HTML ROUTES (For Humans) ---
app.get('/', (req, res) => {
    res.send('<h1>Welcome to Akano Taxi Company!</h1><h2>Home Page - Happy Travelling!</h2><h4>The Young Shall Grow!</h4>');
});

app.get('/about', (req, res) => {
    res.send('<h1>About Page</h1><p>We provide excellent taxi services in all nations!</p>');
});

app.get('/contact', (req, res) => {
    res.send('<h1>Contact Us</h1><p>Email: akanotaxi@service.com</p>');
});

app.get('/fleet', (req, res) => {
    res.send('<h1>Our Fleet</h1><ul><li>Sedan</li><li>SUV</li><li>Van</li><li>Keke Napep</li><li>Danfo</li><li>Okada</li></ul>');
});

// --- API ROUTES (For Data/React) ---

// Get all Taxis
app.get('/api/fleet', (req, res) => {
    res.json(taxiFleet);
});

// Get a single taxi by ID
app.get('/api/fleet/:taxiId', (req, res) => {
    const taxi = taxiFleet.find(t => t.id === parseInt(req.params.taxiId));
    if (!taxi) return res.status(404).json({ message: "Taxi not found!" });
    res.json(taxi);
});

// Fare Estimator
app.get('/api/estimate/:type/:distance', (req, res) => {
    const type = req.params.type.toLowerCase();
    const distance = parseFloat(req.params.distance);
    const taxi = taxiFleet.find(t => t.type.toLowerCase() === type);

    if (!taxi) return res.status(404).json({ error: "Invalid taxi type." });
    if (isNaN(distance)) return res.status(400).json({ error: "Distance must be a number." });

    const totalFare = calculateFare(taxi.pricePerKm, distance);
    res.json({
        confirmation: "Estimate Calculated",
        details: { vehicle: taxi.type, distance: `${distance} km`, totalEstimate: `#${totalFare.toFixed(2)}` }
    });
});

// Search Taxis (Query or Params)
app.get('/api/search', (req, res) => {
    const searchType = req.query.type;
    if (!searchType) return res.json(taxiFleet);
    const results = taxiFleet.filter(t => t.type.toLowerCase().includes(searchType.toLowerCase()));
    res.json(results);
});

// --- BOOKING ROUTES (Database) ---

// POST: Create a new booking in MongoDB
app.post('/api/bookings', async (req, res) => {
    try {
        const { passengerName, pickupLocation, destination, taxiId } = req.body;
        const newBooking = new Booking({ passengerName, pickupLocation, destination, taxiId });
        const savedBooking = await newBooking.save();
        res.status(201).json(savedBooking);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET: View all bookings from MongoDB
app.get('/api/bookings', async (req, res) => {
    try {
        const allBookings = await Booking.find();
        res.json(allBookings);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch bookings" });
    }
});


// UPDATE: Change a booking's location or status. Use PATCH method
app.patch('/api/bookings/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const updates = req.body; // e.g., { pickupLocation: "New Address" }

        // Find the booking and update it with the new data
        const updatedBooking = await Booking.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedBooking) return res.status(404).json({ error: "Booking not found" });

        res.json({ message: "Booking updated!", data: updatedBooking });
    } catch (error) {
        res.status(400).json({ error: "Invalid ID or update data" });
    }
});


// DELETE: Cancel a booking
app.delete('/api/bookings/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const deletedBooking = await Booking.findByIdAndDelete(id);

        if (!deletedBooking) return res.status(404).json({ error: "Booking not found" });

        res.json({ message: "Booking cancelled successfully" });
    } catch (error) {
        res.status(400).json({ error: "Invalid ID format" });
    }
});


// REGISTER USER
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, role });
        await newUser.save();
        res.status(201).json({ message: "User Created" });
    } catch (err) {
        res.status(400).json({ error: "Email already exists" });
    }
});

// LOGIN USER
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Wrong password" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'secret');
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
});

// GET ALL USERS (For Admin Dashboard)
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).send('<h1>404: Page Not Found</h1>');
});

// Start Server
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server is running at http://localhost:${PORT}`);
});
