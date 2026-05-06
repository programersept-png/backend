// ============================================
// 📝 SIGNUP ENDPOINT - No Email Required
// ============================================

router.post('/signup', async (req, res) => {
    try {
        const { username, password, fullName } = req.body;
        
        console.log('=================================');
        console.log('📝 Signup attempt for:', username);
        
        // Validate required fields
        if (!username || !password) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ error: 'Username and password are required' });
        }
        
        // Validate username length
        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }
        
        // Validate password length
        if (password.length < 4) {
            return res.status(400).json({ error: 'Password must be at least 4 characters' });
        }
        
        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log('❌ Username already taken:', username);
            return res.status(400).json({ error: 'Username already taken' });
        }
        
        // Get next user_id
        const lastUser = await User.findOne().sort({ user_id: -1 });
        const nextId = lastUser ? lastUser.user_id + 1 : 3;
        console.log(`Next user_id will be: ${nextId}`);
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create new user (without email)
        const newUser = new User({
            username: username,
            password: hashedPassword,
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
            message: 'Account created successfully! You can now login.',
            user: {
                username: newUser.username,
                fullName: newUser.fullName,
                role: newUser.role,
                user_id: newUser.user_id
            }
        });
        
    } catch (error) {
        console.error('❌ Signup error:', error);
        res.status(500).json({ error: 'Server error. Please try again.' });
    }
});
