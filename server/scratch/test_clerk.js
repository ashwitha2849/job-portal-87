import 'dotenv/config';
import { clerkClient } from '@clerk/express';

console.log("CLERK_PUBLISHABLE_KEY:", process.env.CLERK_PUBLISHABLE_KEY);
console.log("CLERK_SECRET_KEY:", process.env.CLERK_SECRET_KEY ? "Loaded (length: " + process.env.CLERK_SECRET_KEY.length + ")" : "Not Loaded");

async function test() {
  try {
    const list = await clerkClient.users.getUserList();
    console.log("Successfully connected to Clerk! Users count:", list.data.length);
  } catch (error) {
    console.error("Clerk Error:", error);
  }
}

test();
