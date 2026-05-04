const mongoose = require('mongoose');

const borrowSchema = new mongoose.Schema({
    borrow_id: {
        type: Number,
        required: true,
        unique: true
    },
    student_id: {
        type: Number,
        required: true,
        ref: 'Student'
    },
    book_id: {
        type: Number,
        required: true,
        ref: 'Book'
    },
    borrow_date: {
        type: Date,
        required: true,
        default: Date.now
    },
    return_date: {
        type: Date
    },
    status: {
        type: String,
        enum: ['borrowed', 'returned'],
        default: 'borrowed'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Borrow', borrowSchema);