import Company from "../models/Company.js";
import bcrypt from 'bcryptjs'
import { v2 as cloudinary } from 'cloudinary'
import generateToken from "../utils/generateToken.js";
import Job from "../models/Job.js";
import { sendEmail } from "../config/email.js";
import JobApplication from "../models/JobApplication.js";

// Register a new company
export const registerCompany = async (req, res) => {

    const { name, email, password } = req.body

    const imageFile = req.file;

    if (!name || !email || !password || !imageFile) {
        return res.json({ success: false, message: "Missing Details" })
    }

    try {

        const companyExists = await Company.findOne({ email })

        if (companyExists) {
            return res.json({ success: false, message: 'Company already registered' })
        }

        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(password, salt)

        const imageUpload = await cloudinary.uploader.upload(imageFile.path)

        const company = await Company.create({
            name,
            email,
            password: hashPassword,
            image: imageUpload.secure_url
        })

        res.json({
            success: true,
            company: {
                _id: company._id,
                name: company.name,
                email: company.email,
                image: company.image
            },
            token: generateToken(company._id)
        })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Login Company
export const loginCompany = async (req, res) => {

    const { email, password } = req.body

    try {

        const company = await Company.findOne({ email })

        if (!company) {
            return res.json({ success: false, message: 'Invalid email or password' })
        }

        if (await bcrypt.compare(password, company.password)) {

            res.json({
                success: true,
                company: {
                    _id: company._id,
                    name: company.name,
                    email: company.email,
                    image: company.image
                },
                token: generateToken(company._id)
            })

        }
        else {
            res.json({ success: false, message: 'Invalid email or password' })
        }

    } catch (error) {
        res.json({ success: false, message: error.message })
    }

}

// Get Company Data
export const getCompanyData = async (req, res) => {

    try {

        const company = req.company

        res.json({ success: true, company })

    } catch (error) {
        res.json({
            success: false, message: error.message
        })
    }

}

// Post New Job
export const postJob = async (req, res) => {

    const { title, description, location, salary, level, category } = req.body

    const companyId = req.company._id

    try {

        const newJob = new Job({
            title,
            description,
            location,
            salary,
            companyId,
            date: Date.now(),
            level,
            category
        })

        await newJob.save()

        res.json({ success: true, newJob })

    } catch (error) {

        res.json({ success: false, message: error.message })

    }


}

// Get Company Job Applicants
export const getCompanyJobApplicants = async (req, res) => {
    try {

        const companyId = req.company._id

        // Find job applications for the user and populate related data
        const applications = await JobApplication.find({ companyId })
            .populate('userId', 'name image resume')
            .populate('jobId', 'title location category level salary')
            .exec()

        return res.json({ success: true, applications })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Get Company Posted Jobs
export const getCompanyPostedJobs = async (req, res) => {
    try {

        const companyId = req.company._id

        const jobs = await Job.find({ companyId })

        // Adding No. of applicants info in data
        const jobsData = await Promise.all(jobs.map(async (job) => {
            const applicants = await JobApplication.find({ jobId: job._id });
            return { ...job.toObject(), applicants: applicants.length }
        }))

        res.json({ success: true, jobsData })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Change Job Application Status
export const ChangeJobApplicationsStatus = async (req, res) => {

    try {

        const { id, status } = req.body

        // Find Job application and update status
        await JobApplication.findOneAndUpdate({ _id: id }, { status })

        res.json({ success: true, message: 'Status Changed' })

    } catch (error) {

        res.json({ success: false, message: error.message })

    }
}

// Change Job Visiblity
export const changeVisiblity = async (req, res) => {
    try {

        const { id } = req.body

        const companyId = req.company._id

        const job = await Job.findById(id)

        if (companyId.toString() === job.companyId.toString()) {
            job.visible = !job.visible
        }

        await job.save()

        res.json({ success: true, job })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Forgot Company Password
export const forgotCompanyPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const company = await Company.findOne({ email });
        if (!company) {
            return res.json({ success: false, message: "Company with this email does not exist" });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        company.resetOtp = otp;
        company.resetOtpExpire = Date.now() + 10 * 60 * 1000; // 10 mins
        await company.save();

        console.log(`[Recruiter Reset Password] OTP for ${email} is ${otp}`);

        // Send OTP to email via Nodemailer helper
        let emailMessage = "Reset OTP sent to your email.";
        try {
            const emailResult = await sendEmail({
                to: email,
                subject: "Recruiter Password Reset OTP - Job Portal",
                text: `Your password reset OTP is ${otp}. It will expire in 10 minutes.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
                        <h2 style="color: #4f46e5; text-align: center;">Reset Your Password</h2>
                        <p>Hello,</p>
                        <p>We received a request to reset the password for your recruiter account on our Job Portal.</p>
                        <p>Please use the following 6-digit One-Time Password (OTP) to complete the reset process:</p>
                        <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; padding: 15px; background-color: #f3f4f6; color: #1e1b4b; border-radius: 8px; letter-spacing: 4px;">
                            ${otp}
                        </div>
                        <p>This code will expire in <strong>10 minutes</strong>. If you did not make this request, please ignore this email.</p>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                        <p style="font-size: 12px; color: #94a3b8; text-align: center;">Job Portal Recruiter Services</p>
                    </div>
                `
            });

            if (emailResult.testAccount && emailResult.previewUrl) {
                emailMessage = `Reset OTP generated. (Preview link logged in console: ${emailResult.previewUrl})`;
            }
        } catch (emailError) {
            console.error("[Recruiter Reset Password] Email send failure:", emailError.message);
            emailMessage = `OTP generated but email delivery failed (${emailError.message}). Check server logs.`;
        }

        res.json({ 
            success: true, 
            message: emailMessage, 
            otp: otp // Returning in JSON response to make local testing seamless
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Reset Company Password
export const resetCompanyPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        if (!email || !otp || !newPassword) {
            return res.json({ success: false, message: "Missing details" });
        }

        const company = await Company.findOne({ email });
        if (!company) {
            return res.json({ success: false, message: "Company not found" });
        }

        if (!company.resetOtp || company.resetOtp !== otp) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        if (company.resetOtpExpire < Date.now()) {
            return res.json({ success: false, message: "OTP has expired" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(newPassword, salt);

        company.password = hashPassword;
        company.resetOtp = undefined;
        company.resetOtpExpire = undefined;
        await company.save();

        res.json({ success: true, message: "Password reset successful! Please login." });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Update Company Name and Logo
export const updateCompanyProfile = async (req, res) => {
    try {
        const { name } = req.body;
        const imageFile = req.file;
        const companyId = req.company._id;

        const company = await Company.findById(companyId);
        if (!company) {
            return res.json({ success: false, message: 'Company not found' });
        }

        if (name) {
            company.name = name;
        }

        if (imageFile) {
            // Upload new logo image to Cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path);
            company.image = imageUpload.secure_url;
        }

        await company.save();

        res.json({
            success: true,
            message: "Profile updated successfully",
            company: {
                _id: company._id,
                name: company.name,
                email: company.email,
                image: company.image
            }
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};