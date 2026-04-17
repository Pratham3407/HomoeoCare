require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.DOCTOR_EMAIL,
    pass: process.env.DOCTOR_EMAIL_PASSWORD,
  },
});

const sendMeetLink = async (patientEmail, patientName, meetLink, date, time) => {
  const mailOptions = {
    from: `"Dr. Suketu Shah - HomeoCare" <${process.env.DOCTOR_EMAIL}>`,
    to: patientEmail,
    subject: `Your Online Consultation Link — ${date} at ${time}`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e6e1d8; border-radius: 10px;">
        <h2 style="color: #4a7c59; margin-bottom: 4px;">HomeoCare</h2>
        <p style="color: #888; margin-top: 0;">Dr. Suketu Shah — Homoeopathic Consultant</p>
        <hr style="border: none; border-top: 1px solid #e6e1d8; margin: 20px 0;" />
        
        <p>Dear <strong>${patientName}</strong>,</p>
        
        <p>Your online consultation has been scheduled. Please join using the link below at your appointment time.</p>
        
        <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 12px; font-weight: 600; color: #555;">📅 Date</td>
            <td style="padding: 8px 12px;">${date}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; font-weight: 600; color: #555;">⏰ Time</td>
            <td style="padding: 8px 12px;">${time}</td>
          </tr>
        </table>
        
        <a href="${meetLink}" style="display: inline-block; padding: 14px 28px; background: #4a7c59; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          📹 Join Google Meet
        </a>
        
        <p style="margin-top: 20px; color: #888; font-size: 14px;">
          Or copy this link: <a href="${meetLink}" style="color: #4a7c59;">${meetLink}</a>
        </p>
        
        <hr style="border: none; border-top: 1px solid #e6e1d8; margin: 24px 0;" />
        <p style="color: #aaa; font-size: 12px;">This is an automated email from HomeoCare. Please do not reply.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (patientEmail, patientName, newPassword) => {
  const mailOptions = {
    from: `"Dr. Suketu Shah - HomeoCare" <${process.env.DOCTOR_EMAIL}>`,
    to: patientEmail,
    subject: `Password Reset Request - HomeoCare`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e6e1d8; border-radius: 10px;">
        <h2 style="color: #4a7c59; margin-bottom: 4px;">HomeoCare</h2>
        <p style="color: #888; margin-top: 0;">Password Recovery</p>
        <hr style="border: none; border-top: 1px solid #e6e1d8; margin: 20px 0;" />
        
        <p>Dear <strong>${patientName}</strong>,</p>
        
        <p>We received a request to reset your password. Here is your new randomly generated temporary password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <span style="display: inline-block; padding: 15px 30px; background: #fdfbf7; color: #333; font-size: 24px; font-weight: bold; letter-spacing: 2px; border: 2px dashed #4a7c59; border-radius: 8px;">
            ${newPassword}
          </span>
        </div>
        
        <p style="color: #d35400; font-weight: bold;">
          ⚠️ Important: We strongly recommend logging in and changing this password immediately from your Profile Settings.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e6e1d8; margin: 24px 0;" />
        <p style="color: #aaa; font-size: 12px;">This is an automated email from HomeoCare. Please do not reply.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendReportReviewEmail = async (patientEmail, patientName, reportName) => {
  const mailOptions = {
    from: `"Dr. Suketu Shah - HomeoCare" <${process.env.DOCTOR_EMAIL}>`,
    to: patientEmail,
    subject: `Medical Report Reviewed - HomeoCare`,
    html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e6e1d8; border-radius: 10px;">
        <h2 style="color: #4a7c59; margin-bottom: 4px;">HomeoCare</h2>
        <p style="color: #888; margin-top: 0;">Report Review Updates</p>
        <hr style="border: none; border-top: 1px solid #e6e1d8; margin: 20px 0;" />
        
        <p>Dear <strong>${patientName}</strong>,</p>
        
        <p>Dr. Suketu Shah has just reviewed your medical report: <strong>${reportName}</strong>.</p>
        
        <p>Feedback or a prescription has been added to your report. You can view the details by logging into your HomeoCare account and visiting the "My Reports" section in your Profile.</p>
        
        <a href="http://localhost:5173/profile" style="display: inline-block; margin-top: 15px; padding: 12px 24px; background: #2980b9; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
          View My Profile
        </a>
        
        <hr style="border: none; border-top: 1px solid #e6e1d8; margin: 24px 0;" />
        <p style="color: #aaa; font-size: 12px;">This is an automated email from HomeoCare. Please do not reply.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendMeetLink, sendPasswordResetEmail, sendReportReviewEmail };
