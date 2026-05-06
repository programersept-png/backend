const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// ============================================
// 📝 SIGNUP ENDPOINT - Add this FIRST
// ============================================

router.post('/signup', async (req, res) => {
    try {
        const { username, password, email, fullName } = req.body;
        
        console.log('=================================');
        console.log('📝 Signup attempt for:', username);
        
        // Validate required fields
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log('❌ Username already taken:', username);
            return res.status(400).json({ error: 'Username already taken' });
        }
        
        // Check if email already exists (if provided)
        if (email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                console.log('❌ Email already registered:', email);
                return res.status(400).json({ error: 'Email already registered' });
            }
        }
        
        // Get next user_id
        const lastUser = await User.findOne().sort({ user_id: -1 });
        const nextId = lastUser ? lastUser.user_id + 1 : 3; // Start from 3 since admin(1) and programmer(2) exist
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user
        const newUser = new User({
            username: username,
            password: hashedPassword,
            email: email || '',
            fullName: fullName || '',
            role: 'user',
            user_id: nextId
        });
        
        await newUser.save();
        
        console.log('✅ New user created successfully!');
        console.log(`   Username: ${username}`);
        console.log(`   User ID: ${nextId}`);
        console.log(`   Role: user`);
        console.log('=================================');
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                username: newUser.username,
                email: newUser.email,
                fullName: newUser.fullName,
                role: newUser.role,
                user_id: newUser.user_id
            }
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error during signup' });
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
        
        // Find user
        const user = await User.findOne({ username });
        
        if (!user) {
            console.log('❌ User not found');
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        
        console.log('✅ User found');
        console.log('Stored hash:', user.password.substring(0, 30) + '...');
        
        // Compare password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        console.log('Password valid:', isPasswordValid);
        
        if (!isPasswordValid) {
            console.log('❌ Invalid password');
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
        
        console.log('✅ Login successful');
        console.log('=================================');
        
        res.json({
            success: true,
            token,
            username: user.username,
            user_id: user.user_id,
            role: user.role,
            message: 'Login successful'
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ============================================
// 🔍 TEST ENDPOINTS
// ============================================

// Simple test endpoint to verify admin exists
router.get('/test-admin', async (req, res) => {
    try {
        const admin = await User.findOne({ username: 'admin' });
        if (!admin) {
            return res.json({ exists: false, message: 'Admin user not found' });
        }
        
        // Test password verification
        const testPassword = 'admin123';
        const isValid = await bcrypt.compare(testPassword, admin.password);
        
        res.json({
            exists: true,
            username: admin.username,
            user_id: admin.user_id,
            passwordHash: admin.password.substring(0, 30) + '...',
            passwordValid: isValid,
            message: isValid ? 'Admin password is correct' : 'Admin password hash is invalid'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Debug endpoint to see all users
router.get('/debug-users', async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json({
            totalUsers: users.length,
            users: users.map(u => ({
                username: u.username,
                email: u.email,
                role: u.role,
                user_id: u.user_id
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Reset admin password
router.post('/reset-admin', async (req, res) => {
    try {
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const result = await User.updateOne(
            { username: 'admin' },
            { 
                $set: { 
                    password: hashedPassword,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
        
        res.json({
            success: true,
            message: 'Admin password reset to: admin123',
            modified: result.modifiedCount,
            upserted: result.upsertedCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ping endpoint to test if server is running
router.get('/ping', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Server is running',
        timestamp: new Date()
    });
});

module.exports = router;
