import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' }, // 'user' or 'admin'
    profileImage: { type: String, default: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' } // Default avatar
});

export default mongoose.model('User', userSchema);