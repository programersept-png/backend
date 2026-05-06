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
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    fullName: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'admin', 'librarian']
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

module.exports = mongoose.model('User', userSchema);
