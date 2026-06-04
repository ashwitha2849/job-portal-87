import mongoose from "mongoose";
import dns from "dns";

const connectDB = async () => {
  try {
    dns.setServers(['208.67.222.222', '8.8.8.8', '1.1.1.1', '9.9.9.9']);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database Connected");
  } catch (error) {
    console.error("Database connection failed on startup:", error);
    throw error;
  }
};

export default connectDB;