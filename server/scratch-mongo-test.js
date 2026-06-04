import 'dotenv/config';
import dns from 'dns';
import mongoose from 'mongoose';

// Set DNS servers
dns.setServers(['208.67.222.222', '8.8.8.8', '1.1.1.1']);
console.log('Set DNS servers successfully');

// Import models to register them
import './models/User.js';
import './models/Job.js';
import './models/Company.js';
import './models/JobApplication.js';

async function testConnection() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
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
