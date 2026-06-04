import 'dotenv/config';
import connectDB from './config/db.js';
import User from './models/User.js';
import Job from './models/Job.js';
import JobApplication from './models/JobApplication.js';
import mongoose from 'mongoose';

async function test() {
    await connectDB();
    console.log('Connected to DB');
    
    const userCount = await User.countDocuments();
    const jobCount = await Job.countDocuments();
    const appCount = await JobApplication.countDocuments();
    
    console.log(`Users: ${userCount}, Jobs: ${jobCount}, Applications: ${appCount}`);
    
    const sampleUser = await User.findOne();
    console.log('Sample User:', sampleUser);
    
    const sampleJob = await Job.findOne();
    console.log('Sample Job:', sampleJob);
    
    const sampleApp = await JobApplication.findOne();
    console.log('Sample Application:', sampleApp);
    
    await mongoose.disconnect();
}

test().catch(console.error);
