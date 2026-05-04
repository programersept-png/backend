const mongoose = require('mongoose');
require('dotenv').config();
const Borrow = require('./models/Borrow');
const { initCounters } = require('./models/Counter');

const fixBorrowCollection = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Initialize counters
        await initCounters();
        
        // Drop the borrows collection to remove all indexes
        await mongoose.connection.db.collection('borrows').drop();
        console.log('✅ Dropped borrows collection');
        
        // Recreate the collection with proper schema
        await Borrow.createCollection();
        console.log('✅ Recreated borrows collection');
        
        // Ensure the index is created properly
        await Borrow.syncIndexes();
        console.log('✅ Synced indexes');
        
        console.log('🎉 Borrow collection fixed successfully!');
        
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        
    } catch (error) {
        console.error('Error fixing borrow collection:', error);
        if (error.code === 26) {
            console.log('Collection did not exist, which is fine');
        }
        process.exit(1);
    }
};

fixBorrowCollection();