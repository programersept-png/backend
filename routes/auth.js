const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// ============================================
// PUBLIC ENDPOINTS - No authentication required
// ============================================

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ message: 'Auth routes working!', timestamp: new Date() });
});

// Signup endpoint
router.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('=================================');
        console.log('📝 Signup attempt for:', username);
        
        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }
        
        if (password.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log('❌ Username already taken:', username);
            return res.status(400).json({ error: 'Username already taken' });
        }
        
        // Get next user_id
        const lastUser = await User.findOne().sort({ user_id: -1 });
        const nextId = lastUser ? lastUser.user_id + 1 : 3;
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = new User({
            user_id: nextId,
            username: username,
            password: hashedPassword,
            role: 'user'
        });
        
        await newUser.save();
        
        console.log('✅ User created successfully!');
        console.log(`   Username: ${username}`);
        console.log(`   User ID: ${nextId}`);
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
        console.error('❌ Signup error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('=================================');
        console.log('🔐 Login attempt for:', username);
        
        // Find user
        const user = await User.findOne({ username });
        
        if (!user) {
            console.log('❌ User not found:', username);
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            console.log('❌ Invalid password for:', username);
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        // Generate token
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
        
        console.log('✅ Login successful:', username);
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

// Debug endpoint - check users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json({
            count: users.length,
            users: users.map(u => ({
                user_id: u.user_id,
                username: u.username,
                role: u.role,
                createdAt: u.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
