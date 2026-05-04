const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    book_id: {
        type: Number,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    available_quantity: {
        type: Number,
        required: true,
        min: 0
    }
}, {
    timestamps: true
});

// NO pre-save hooks - we'll handle ID generation in the route

module.exports = mongoose.model('Book', bookSchema);