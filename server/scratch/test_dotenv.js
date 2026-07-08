import 'dotenv/config';

console.log("JWT_SECRET parsed:", JSON.stringify(process.env.JWT_SECRET));
console.log("CLERK_PUBLISHABLE_KEY parsed:", JSON.stringify(process.env.CLERK_PUBLISHABLE_KEY));
console.log("CLERK_SECRET_KEY parsed:", JSON.stringify(process.env.CLERK_SECRET_KEY));
