const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    student_id: {
        type: Number,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    class: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// NO pre-save hooks

module.exports = mongoose.model('Student', studentSchema);