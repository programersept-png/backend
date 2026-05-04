const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const fixAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');
        
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        
        // Remove existing admin
        await usersCollection.deleteOne({ username: 'admin' });
        console.log('✅ Removed existing admin user\n');
        
        // Hash the password correctly
        const plainPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        
        console.log('Generated new password hash:');
        console.log(hashedPassword);
        console.log('\n');
        
        // Create new admin user
        const result = await usersCollection.insertOne({
            username: 'admin',
            password: hashedPassword,
            role: 'admin',
            user_id: 1,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        console.log('✅ Admin user created successfully!');
        console.log('📝 Username: admin');
        console.log('🔑 Password: admin123');
        console.log(`🆔 User ID: 1`);
        
        // Verify the password works
        const savedUser = await usersCollection.findOne({ username: 'admin' });
        const verifyMatch = await bcrypt.compare('admin123', savedUser.password);
        
        console.log('\n🔍 Verification:');
        console.log(`Password match test: ${verifyMatch ? '✅ PASSED' : '❌ FAILED'}`);
        
        if (verifyMatch) {
            console.log('\n✅ Admin user is ready to use!');
        } else {
            console.log('\n❌ Still having issues with password hash');
        }
        
        await mongoose.disconnect();
        
    } catch (error) {
        console.error('Error:', error);
    }
};

fixAdmin();