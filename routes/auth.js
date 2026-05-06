router.post('/signup', async (req, res) => {
    try {
        const { username, password, fullName } = req.body;
        
        console.log('=================================');
        console.log('📝 Signup attempt for:', username);
        
        // Validate
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
            return res.status(400).json({ error: 'Username already taken' });
        }
        
        // Get next user_id
        const lastUser = await User.findOne().sort({ user_id: -1 });
        const nextId = lastUser ? lastUser.user_id + 1 : 3;
        
        // Create user (let the pre-save hook hash the password)
        const newUser = new User({
            username: username,
            password: password,  // Will be hashed by pre-save hook
            fullName: fullName || '',
            role: 'user',
            user_id: nextId
        });
        
        await newUser.save();
        
        console.log('✅ User created:', username);
        
        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            user: {
                username: newUser.username,
                fullName: newUser.fullName,
                role: newUser.role,
                user_id: newUser.user_id
            }
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: error.message });
    }
});
