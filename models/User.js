const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { getNextSequence } = require('./Counter');

const userSchema = new mongoose.Schema({
    user_id: {
        type: Number,
        unique: true,
        sparse: true  // Allow null/undefined values to prevent duplicate key errors
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'librarian'
    }
}, {
    timestamps: true
});

// Single pre-save hook that handles both auto-increment and password hashing
userSchema.pre('save', async function(next) {
    try {
        // Handle auto-increment for user_id
        if (this.isNew && !this.user_id) {
            const nextId = await getNextSequence('user_id');
            this.user_id = nextId;
            console.log(`Generated user_id: ${nextId} for user: ${this.username}`);
        }
        
        // Handle password hashing
        if (this.isModified('password')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            console.log(`Password hashed for user: ${this.username}`);
        }
        
        next();
    } catch (error) {
        console.error('Error in pre-save hook:', error);
        next(error);
    }
});

module.exports = mongoose.model('User', userSchema);