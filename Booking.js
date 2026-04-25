import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    passengerName: { type: String, required: true },
    pickupLocation: { type: String, required: true },
    destination: { type: String, required: true },
    taxiId: { type: Number, required: true },
    status: { type: String, default: "Confirmed" },
    bookedAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;