import dotenv from 'dotenv';
import fs from 'fs';

const clientEnvContent = fs.readFileSync('../client/.env', 'utf8');
const parsed = dotenv.parse(clientEnvContent);

console.log("Parsed Client Env:");
console.log("VITE_CLERK_PUBLISHABLE_KEY:", JSON.stringify(parsed.VITE_CLERK_PUBLISHABLE_KEY));
console.log("VITE_BACKEND_URL:", JSON.stringify(parsed.VITE_BACKEND_URL));
