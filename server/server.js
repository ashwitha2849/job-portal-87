import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/db.js'
import { clerkWebhooks } from './controllers/webhooks.js'
import companyRoutes from './routes/companyRoutes.js'
import connectCloudinary from './config/cloudinary.js'
import jobRoutes from './routes/jobRoutes.js'
import userRoutes from './routes/userRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import { clerkMiddleware } from '@clerk/express'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure uploads folder exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

connectDB()
await connectCloudinary()

app.use(cors())
app.use(express.json())
app.use(clerkMiddleware())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/', (req, res) => res.send("API Working"))

app.post('/webhooks', clerkWebhooks)
app.use('/api/company', companyRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/users', userRoutes)
app.use('/api/users/ai', aiRoutes)

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err)
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})