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
import resumeAnalyserRoutes from './routes/resumeAnalyserRoutes.js'
import { clerkMiddleware } from '@clerk/express'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { createApolloMiddleware } from './graphql/index.js'

const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure uploads folder exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true })
}
if (!fs.existsSync(path.join(__dirname, 'uploads/resumes'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads/resumes'), { recursive: true })
}

await connectDB()
await connectCloudinary()

// CORS must be applied before Apollo middleware
app.use(cors({ origin: '*', credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(clerkMiddleware())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/', (req, res) => res.send("API Working"))

app.post('/webhooks', clerkWebhooks)
app.use('/api/company', companyRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/users', userRoutes)
app.use('/api/users/ai', aiRoutes)

// ── AI Resume Analyser REST API ──────────────────────────────
app.use('/api/resume-analyser', resumeAnalyserRoutes)

// ── GraphQL API (Apollo Server v4) ──────────────────────────
try {
  const apolloMiddleware = await createApolloMiddleware()
  app.use('/graphql', apolloMiddleware)
  console.log('✅ GraphQL API ready at /graphql')
} catch (err) {
  console.error('❌ Failed to start Apollo Server:', err.message)
}

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
  console.log(`Server is running on port ${PORT}`)
  console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`)
  console.log(`Resume Analyser REST: http://localhost:${PORT}/api/resume-analyser`)
})