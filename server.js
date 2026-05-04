const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { initCounters } = require('./models/Counter');

const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const studentRoutes = require('./routes/students');
const borrowRoutes = require('./routes/borrow');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', bookRoutes);
app.use('/api', studentRoutes);
app.use('/api', borrowRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    console.log('MongoDB connected successfully');
    console.log('Database:', mongoose.connection.name);
    
    // Initialize counters
    await initCounters();
    console.log('Auto-increment counters ready');
})
.catch(err => {
    console.error('MongoDB connection error:', err.message);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});