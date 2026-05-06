const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    user_id: {
        type: Number,
        unique: true,
        sparse: true
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
        default: 'user'
    }
}, {
    timestamps: true
});

// Simple pre-save hook - NO next() issues
userSchema.pre('save', function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    
    // Hash password
    bcrypt.hash(this.password, 10, (err, hash) => {
        if (err) return next(err);
        this.password = hash;
        next();
    });
});

module.exports = mongoose.model('User', userSchema);
