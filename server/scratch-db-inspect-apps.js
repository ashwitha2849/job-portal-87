import 'dotenv/config';
import connectDB from './config/db.js';
import User from './models/User.js';
import JobApplication from './models/JobApplication.js';
import mongoose from 'mongoose';

async function inspect() {
    await connectDB();
    console.log('Connected to DB');

    const applications = await JobApplication.find({}).populate('userId', 'name resume');
    console.log(`Total Applications: ${applications.length}`);
    applications.forEach((app, i) => {
        console.log(`App #${i+1}:`);
        console.log(`  User: ${app.userId ? app.userId.name : 'Unknown'}`);
        console.log(`  App Resume: ${app.resume}`);
        console.log(`  User Profile Resume: ${app.userId ? app.userId.resume : 'N/A'}`);
    });

    await mongoose.disconnect();
}

inspect().catch(console.error);
