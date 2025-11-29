import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Helper function to create a standardized, styled email template
const createStyledEmail = (subject, contentHtml) => {
    // Make sure to set FRONTEND_URL in your .env file, e.g., FRONTEND_URL=https://gmp-user-ui41.vercel.app
    const frontendUrl = process.env.FRONTEND_URL || '#';

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; margin: 0; padding: 0; background-color: #f4f7f6; }
            .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; }
            .email-header { background-color: #f8f8f8; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0; }
            .email-header img { max-width: 220px; }
            .email-body { padding: 30px; font-size: 16px; line-height: 1.6; color: #333333; }
            .email-body p { margin: 0 0 15px 0; }
            .email-body h2 { color: #004a9c; margin-top: 0; }
            .button-container { text-align: center; margin: 30px 0; }
            .button { display: inline-block; padding: 14px 28px; background-color: #005A9C; color: #ffffff !important; text-decoration: none; border-radius: 5px; font-weight: bold; }
            .email-footer { background-color: #f8f8f8; padding: 20px; font-size: 14px; color: #888888; text-align: center; border-top: 1px solid #e0e0e0; }
            ul { list-style-type: none; padding-left: 0; }
            li { background: #fafafa; margin-bottom: 8px; padding: 12px; border-left: 4px solid #005A9C; border-radius: 4px; }
            li strong { color: #333; }
            .otp-code { font-size: 28px; font-weight: bold; color: #D9531E; text-align: center; margin: 25px 0; padding: 15px; background-color: #fdf2e9; border-radius: 5px; letter-spacing: 3px; }
            blockquote { border-left: 4px solid #ccc; padding-left: 15px; margin: 20px 0; font-style: italic; color: #555; }
            hr { border: none; border-top: 1px solid #eee; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <img src="https://nitsikkim.ac.in/include/header/assets/images/nitLogo.png" alt="NIT Sikkim Grievance Portal Logo">
            </div>
            <div class="email-body">
                ${contentHtml}
            </div>
            <div class="email-footer">
                <p>This is an automated message from the NIT Sikkim Women's Grievance Cell Portal. Please do not reply directly to this email.</p>
                <p>&copy; ${new Date().getFullYear()} Women's Grievance Cell, NIT Sikkim</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // use TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to, subject, html, attachments = []) => {
    const mailOptions = {
        from: `"Women's Grievance Cell | NIT Sikkim" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        attachments,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.response);
    } catch (error) {
        console.error("--- NODEMAILER ERROR ---", error);
        throw new Error("Failed to send email via Nodemailer.");
    }
};

export const sendRegistrationEmail = async (email, name) => {
    const subject = "Welcome to the Women's Grievance Cell Portal!";
    const content = `
        <h2>Welcome, ${name}!</h2>
        <p>Thank you for registering for the Women Grievance Management Portal. We're glad to have you on board.</p>
        <p>You can now log in to submit and track your grievances. Our goal is to provide a transparent and efficient platform for addressing your concerns.</p>
        <div class="button-container">
            <a href="${process.env.FRONTEND_URL || '#'}/login" class="button">Go to Login</a>
        </div>
        <p>Best regards,<br>The Women's Grievance Cell Team</p>
    `;
    const html = createStyledEmail(subject, content);
    await sendEmail(email, subject, html);
};

export const sendGrievanceStatusUpdateEmail = async (userEmail, userName, complaintId, newStatus) => {
    const subject = `Grievance Update: Your complaint #${complaintId} is now ${newStatus}`;
    const content = `
        <h2>Grievance Status Update</h2>
        <p>Hi ${userName},</p>
        <p>The status of your grievance with Complaint ID <strong>#${complaintId}</strong> has been updated to:</p>
        <p style="text-align:center; font-size: 20px; font-weight: bold; color: #005A9C;">${newStatus}</p>
        <div class="button-container">
             <a href="${process.env.FRONTEND_URL || '#'}/track-grievance" class="button">Track Your Grievance</a>
        </div>
        <p>Regards,<br>Women's Grievance Cell Team</p>
    `;
    const html = createStyledEmail(subject, content);
    await sendEmail(userEmail, subject, html);
};

export const sendGrievanceAssignedEmailToUser = async (userEmail, userName, complaintId, assignedMember) => {
    const subject = `Action has been taken on your Grievance #${complaintId}`;
    const content = `
        <h2>Grievance In Progress</h2>
        <p>Hi ${userName},</p>
        <p>Your grievance with Complaint ID <strong>#${complaintId}</strong> is now "In Progress" and has been assigned to a committee member for resolution.</p>
        <p>We appreciate your patience as we work to resolve your issue.</p>
        <p>Regards,<br>Women's Grievance Cell Team</p>
    `;
    const html = createStyledEmail(subject, content);
    await sendEmail(userEmail, subject, html);
};

export const sendGrievanceAssignedEmailToCommitteeMember = async (memberEmail, memberName, complaintId, complaint) => {
    const subject = `New Grievance Assigned: #${complaintId}`;
    const content = `
        <h2>New Grievance Assignment</h2>
        <p>Dear ${memberName},</p>
        <p>A new grievance with Complaint ID <strong>#${complaintId}</strong> has been assigned to you for resolution.</p>
        <ul>
            <li><strong>Title:</strong> ${complaint.title}</li>
            <li><strong>Description:</strong> ${complaint.description}</li>
        </ul>
        <p>Please log in to the portal to view the full details and take the necessary action.</p>
        <p>Thank you,<br>Women's Grievance Cell</p>
    `;
    const html = createStyledEmail(subject, content);
    await sendEmail(memberEmail, subject, html);
};

export const sendEscalationNotification = async (complaint, escalatedFromMember, adminEmail) => {
    const subject = `[ESCALATION] Complaint #${complaint.id} Requires Your Attention`;
    const content = `
        <h2>Grievance Escalation Notice</h2>
        <p>Dear Admin,</p>
        <p>A complaint has been automatically escalated to you due to a resolution deadline breach.</p>
        <ul>
            <li><strong>Complaint ID:</strong> #${complaint.id}</li>
            <li><strong>Title:</strong> ${complaint.title}</li>
            <li><strong>Escalated From:</strong> ${escalatedFromMember ? escalatedFromMember.name : 'N/A'}</li>
        </ul>
        <p>This issue requires your immediate attention. Please log in to the portal to take action.</p>
        <p>Thank you,<br>Women's Grievance Cell</p>
    `;
    const html = createStyledEmail(subject, content);
    await sendEmail(adminEmail, subject, html);
};

export const sendOtpEmail = async (email, otp) => {
    const subject = "Your One-Time Password for the Women's Grievance Cell Portal";
    const content = `
        <h2>Verification Required</h2>
        <p>Dear User,</p>
        <p>To proceed with your request, please use the following One-Time Password (OTP). This code is valid for 60 seconds.</p>
        <div class="otp-code">${otp}</div>
        <p>If you did not request this code, you can safely ignore this email. Do not share this OTP with anyone.</p>
        <p>Thank you,<br>The Women's Grievance Cell Team</p>
    `;
    const html = createStyledEmail(subject, content);
    await sendEmail(email, subject, html);
};

export const sendTicketIdEmail = async (email, name, complaintId, category, resolveIn) => {
    if (!email) {
        console.error("sendTicketIdEmail: missing recipient email, aborting send");
        return;
    }

    const subject = `Your Grievance Complaint #${complaintId} has been submitted`;
    const content = `
      <p>Hi ${name},</p>
      <p>Your grievance has been received. Here are the details:</p>
      <ul>
        <li><strong>Complaint ID:</strong> #${complaintId}</li>
        <li><strong>Category:</strong> ${category}</li>
        <li><strong>Expected Resolution Time:</strong> ${resolveIn}</li>
      </ul>
      <br/>
      <p>Regards,<br/>Women's Grievance Cell Team</p>
    `;
    const html = createStyledEmail(subject, content);
    try {
        await sendEmail(email, subject, html);
    } catch (err) {
        console.error("Error sending ticket ID email:", err);
        throw err; // re-throw so the controller’s .catch can pick it up
    }
};