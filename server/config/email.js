import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Helper to send email using configured SMTP settings,
 * falling back to Ethereal mock email generation if none are configured.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    let transporter;
    
    const useSMTP = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

    if (useSMTP) {
      console.log(`[Email] Using configured SMTP server: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}`);
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      console.log("[Email] No SMTP credentials in .env. Creating Ethereal test account...");
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
    }

    const mailOptions = {
      from: useSMTP ? `"${process.env.SMTP_SENDER_NAME || 'Job Portal'}" <${process.env.SMTP_USER}>` : '"Job Portal Test" <no-reply@ethereal.email>',
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Message sent successfully to ${to}. Message ID: ${info.messageId}`);
    
    if (!useSMTP) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[Email] Preview URL (Ethereal): ${previewUrl}`);
      return { success: true, previewUrl, testAccount: true };
    }

    return { success: true, testAccount: false };
  } catch (error) {
    console.error("[Email] Failed to send email:", error.message);
    throw error;
  }
};
