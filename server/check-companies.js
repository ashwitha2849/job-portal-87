import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Company from './models/Company.js';

dotenv.config();

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    const companies = await Company.find({}, 'name email password');
    console.log("Registered companies:");
    companies.forEach(c => {
      console.log(`Name: ${c.name}, Email: ${c.email}`);
    });
    mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
};

check();
