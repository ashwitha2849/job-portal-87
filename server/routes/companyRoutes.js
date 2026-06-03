import express from 'express'
import { ChangeJobApplicationsStatus, changeVisiblity, getCompanyData, getCompanyJobApplicants, getCompanyPostedJobs, loginCompany, postJob, registerCompany, forgotCompanyPassword, resetCompanyPassword, updateCompanyProfile } from '../controllers/companyController.js'
import upload from '../config/multer.js'
import { protectCompany } from '../middleware/authMiddleware.js'

const router = express.Router()

// Register a company
router.post('/register', upload.single('image'), registerCompany)

// Company login
router.post('/login', loginCompany)

// Forgot Password
router.post('/forgot-password', forgotCompanyPassword)

// Reset Password
router.post('/reset-password', resetCompanyPassword)

// Get company data
router.get('/company', protectCompany, getCompanyData)

// Update Company profile
router.post('/update-profile', protectCompany, upload.single('image'), updateCompanyProfile)

// Post a job
router.post('/post-job', protectCompany, postJob)

// Get Applicants Data of Company
router.get('/applicants', protectCompany, getCompanyJobApplicants)

// Get  Company Job List
router.get('/list-jobs', protectCompany, getCompanyPostedJobs)

// Change Applcations Status 
router.post('/change-status', protectCompany, ChangeJobApplicationsStatus)

// Change Applcations Visiblity 
router.post('/change-visiblity', protectCompany, changeVisiblity)

export default router