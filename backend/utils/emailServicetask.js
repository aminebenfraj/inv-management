const nodemailer = require("nodemailer")
require("dotenv").config()

// Create a transporter using the provided SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === "465", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP connection error:", error)
  } else {
    console.log("✅ SMTP server is ready to send emails")
  }
})

/**
 * Send task assignment email to a user
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.username - Recipient name
 * @param {string} options.taskName - Task name
 * @param {string} options.taskDescription - Task description
 * @param {string} options.sectionName - Section/table name (e.g., "Kick-Off", "Design", etc.)
 * @param {string} options.sectionUrl - URL to the specific section
 * @param {string} options.specificInstruction - Specific instruction for the user
 * @returns {Promise} - Email sending result
 */
exports.sendTaskAssignmentEmail = async (options) => {
  try {
    const {
      to,
      username,
      taskName,
      taskDescription,
      sectionName = "Task Management",
      sectionUrl = "/dashboard",
      specificInstruction = "Please log into the system to review your task assignment.",
    } = options

    // Get base URL from environment or use default
    const baseUrl = process.env.FRONTEND_URL || "http://localhost:3000"
    const fullSectionUrl = `${baseUrl}${sectionUrl}`

    // Email HTML template with enhanced content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; border-bottom: 3px solid #007bff; padding-bottom: 15px; margin-top: 0;">
            📋 Task Assignment Notification
          </h2>
          
          <p style="font-size: 16px; color: #333;">Dear <strong>${username}</strong>,</p>
          
          <p style="font-size: 14px; color: #666; line-height: 1.6;">
            You have been assigned to a new task in the <strong>${sectionName}</strong> section that requires your immediate attention.
          </p>
          
          <div style="background-color: #e3f2fd; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 5px solid #2196f3;">
            <h3 style="color: #1976d2; margin-top: 0; font-size: 18px;">
              🎯 Task Details
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333; width: 120px;">Section:</td>
                <td style="padding: 8px 0; color: #666;">${sectionName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Task:</td>
                <td style="padding: 8px 0; color: #666;">${taskName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #333;">Description:</td>
                <td style="padding: 8px 0; color: #666;">${taskDescription}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 5px solid #ffc107; margin: 25px 0;">
            <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 16px;">
              ⚠️ Action Required
            </h4>
            <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
              <strong>Specific Instructions:</strong> ${specificInstruction}
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${fullSectionUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
              🔗 Go to ${sectionName} Section
            </a>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 25px 0;">
            <h4 style="margin: 0 0 10px 0; color: #495057; font-size: 14px;">📍 Quick Access Links:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #6c757d; font-size: 13px;">
              <li>Dashboard: <a href="${baseUrl}/dashboard" style="color: #007bff;">${baseUrl}/dashboard</a></li>
              <li>${sectionName}: <a href="${fullSectionUrl}" style="color: #007bff;">${fullSectionUrl}</a></li>
              <li>My Tasks: <a href="${baseUrl}/my-tasks" style="color: #007bff;">${baseUrl}/my-tasks</a></li>
            </ul>
          </div>
          
          <p style="margin-top: 25px; font-size: 14px; color: #666; line-height: 1.6;">
            If you have any questions about this assignment, please contact your project manager or team lead immediately.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          
          <div style="text-align: center;">
            <p style="color: #6c757d; font-size: 12px; margin: 0;">
              This is an automated notification from the <strong>Task Management System</strong>
            </p>
            <p style="color: #6c757d; font-size: 12px; margin: 5px 0 0 0;">
              Please do not reply to this email. For support, contact your system administrator.
            </p>
          </div>
        </div>
      </div>
    `

    // Plain text version for email clients that don't support HTML
    const textContent = `
      Task Assignment Notification
      
      Dear ${username},
      
      You have been assigned to a new task in the ${sectionName} section.
      
      Task Details:
      - Section: ${sectionName}
      - Task: ${taskName}
      - Description: ${taskDescription}
      
      Action Required: ${specificInstruction}
      
      Access the ${sectionName} section: ${fullSectionUrl}
      
      If you have any questions about this assignment, please contact your project manager or team lead.
      
      ---
      This is an automated notification from the Task Management System.
    `

    // Email options
    const mailOptions = {
      from: `"Task Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject: `🔔 Task Assignment: ${taskName} (${sectionName})`,
      html: htmlContent,
      text: textContent,
    }

    // Send email
    const info = await transporter.sendMail(mailOptions)
    console.log(`📧 Email sent successfully to ${to}:`, info.messageId)
    return info
  } catch (error) {
    console.error("❌ Error sending email:", error)
    throw error
  }
}

/**
 * Send bulk task assignment emails
 * @param {Array} emailList - Array of email options objects
 * @returns {Promise} - Results of all email sending attempts
 */
exports.sendBulkTaskAssignmentEmails = async (emailList) => {
  try {
    console.log(`📧 Sending ${emailList.length} task assignment emails...`)

    const results = await Promise.allSettled(
      emailList.map((emailOptions) => exports.sendTaskAssignmentEmail(emailOptions)),
    )

    const successful = results.filter((result) => result.status === "fulfilled").length
    const failed = results.filter((result) => result.status === "rejected").length

    console.log(`✅ Bulk email results: ${successful} successful, ${failed} failed`)

    return {
      total: emailList.length,
      successful,
      failed,
      results,
    }
  } catch (error) {
    console.error("❌ Error sending bulk emails:", error)
    throw error
  }
}
