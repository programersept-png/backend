const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

// Function to get next sequence
async function getNextSequence(name) {
    try {
        const counter = await Counter.findByIdAndUpdate(
            name,
            { $inc: { seq: 1 } },
            { 
                upsert: true, 
                new: true
            }
        );
        console.log(`Generated ${name}: ${counter.seq}`);
        return counter.seq;
    } catch (error) {
        console.error(`Error getting next sequence for ${name}:`, error);
        throw error;
    }
}

// Initialize counters
async function initCounters() {
    try {
        const counters = ['book_id', 'student_id', 'user_id', 'borrow_id'];
        for (const counter of counters) {
            const exists = await Counter.findById(counter);
            if (!exists) {
                await Counter.create({ _id: counter, seq: 0 });
                console.log(`✅ Created counter for ${counter}`);
            }
        }
        console.log('🎯 All counters initialized');
    } catch (error) {
        console.error('Error initializing counters:', error);
    }
}

module.exports = { Counter, getNextSequence, initCounters };