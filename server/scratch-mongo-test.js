import 'dotenv/config';
import connectDB from './config/db.js';
import mongoose from 'mongoose';

// Import models to register them
import './models/User.js';
import './models/Job.js';
import './models/Company.js';
import './models/JobApplication.js';

async function testConnection() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database Connected Successfully!');
    
    console.log('Registered Models:', mongoose.modelNames());
    
    // Test simple find
    const User = mongoose.model('User');
    const usersCount = await User.countDocuments();
    console.log(`Successfully queried User collection. Total users: ${usersCount}`);
    
    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();
