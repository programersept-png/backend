const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

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
                user_id: user.user_id 
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
            message: 'Login successful'
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

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

module.exports = router;