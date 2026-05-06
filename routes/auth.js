const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ✅ THIS MUST BE AT THE TOP - Initialize router
const router = express.Router();

// ============================================
// 📝 SIGNUP ENDPOINT
// ============================================

router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('=================================');
        console.log('📝 Signup attempt for:', username);
        
        // Validate
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already taken' });
        }
        
        // Get next user_id
        const lastUser = await User.findOne().sort({ user_id: -1 });
        const nextId = lastUser ? lastUser.user_id + 1 : 3;
        
        // Create user (let the pre-save hook hash the password)
        const newUser = new User({
            user_id: nextId,
            username: username,
            password: password,
            role: 'user'
        });
        
        await newUser.save();
        
        console.log('✅ User created:', username);
        console.log('=================================');
        
        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            user: {
                user_id: newUser.user_id,
                username: newUser.username,
                role: newUser.role
            }
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// ============================================
// 🔐 LOGIN ENDPOINT
// ============================================

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('=================================');
        console.log('Login attempt for:', username);
        
        const user = await User.findOne({ username });
        
        if (!user) {
            console.log('❌ User not found');
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            console.log('❌ Invalid password');
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        const token = jwt.sign(
            { 
                userId: user._id, 
                username: user.username,
                user_id: user.user_id,
                role: user.role
            },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '24h' }
        );
        
        console.log('✅ Login successful');
        console.log('=================================');
        
        res.json({
            success: true,
            token,
            username: user.username,
            user_id: user.user_id,
            role: user.role
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// 🔍 TEST ENDPOINTS
// ============================================

router.get('/ping', (req, res) => {
    res.json({ message: 'pong', timestamp: new Date() });
});

router.get('/health', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const dbState = mongoose.connection.readyState;
        const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
        const userCount = await User.countDocuments();
        
        res.json({
            database: states[dbState],
            userCount: userCount,
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
