import Job from "../models/Job.js"
import JobApplication from "../models/JobApplication.js"
import User from "../models/User.js"
import { v2 as cloudinary } from "cloudinary"
import { clerkClient } from "@clerk/express"
// Helper function to find user or auto-sync from Clerk if missing (useful for local dev without webhooks)
const findOrCreateUser = async (userId) => {
    let user = await User.findById(userId)
    if (!user) {
        try {
            const clerkUser = await clerkClient.users.getUser(userId)
            const email = clerkUser.emailAddresses[0]?.emailAddress || ''
            const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Job Seeker'
            const image = clerkUser.imageUrl || ''
            
            user = await User.create({
                _id: userId,
                name,
                email,
                image,
                resume: ''
            })
        } catch (error) {
            console.error("Failed to auto-sync user from Clerk:", error)
        }
    }
    return user
}
// Get User Data
export const getUserData = async (req, res) => {
    const userId = req.auth.userId
    try {
        const user = await findOrCreateUser(userId)
        if (!user) {
            return res.json({ success: false, message: 'User Not Found' })
        }
        res.json({ success: true, user })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
// Apply For Job
export const applyForJob = async (req, res) => {
    const { jobId } = req.body
    const userId = req.auth.userId
    try {
        const isAlreadyApplied = await JobApplication.find({ jobId, userId })
        if (isAlreadyApplied.length > 0) {
            return res.json({ success: false, message: 'Already Applied' })
        }
        const jobData = await Job.findById(jobId)
        if (!jobData) {
            return res.json({ success: false, message: 'Job Not Found' })
        }
        // Ensure user exists locally before applying
        const userData = await findOrCreateUser(userId)
        if (!userData) {
            return res.json({ success: false, message: 'User Not Found' })
        }
        // Resolve application-specific resume
        let applicationResume = ''
        if (req.file) {
            applicationResume = `uploads/${req.file.filename}`
        } else if (req.body.resume) {
            applicationResume = req.body.resume
        } else if (userData.resume) {
            applicationResume = userData.resume
        }
        if (!applicationResume) {
            return res.json({ success: false, message: 'Please provide a resume to apply' })
        }
        await JobApplication.create({
            companyId: jobData.companyId,
            userId,
            jobId,
            resume: applicationResume,
            date: Date.now()
        })
        res.json({ success: true, message: 'Applied Successfully' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
// Get User Applied Applications Data
export const getUserJobApplications = async (req, res) => {
    try {
        const userId = req.auth.userId
        const applications = await JobApplication.find({ userId })
            .populate('companyId', 'name email image')
            .populate('jobId', 'title description location category level salary')
            .exec()
        if (!applications) {
            return res.json({ success: false, message: 'No job applications found for this user.' })
        }
        return res.json({ success: true, applications })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
// Update User Resume
export const updateUserResume = async (req, res) => {
    try {
        const userId = req.auth.userId
        const resumeFile = req.file
        const userData = await findOrCreateUser(userId)
        if (!userData) {
            return res.json({ success: false, message: 'User Not Found' })
        }
        if (resumeFile) {
            userData.resume = `uploads/${resumeFile.filename}`
        }
        await userData.save()
        return res.json({ success: true, message: 'Resume Updated' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}