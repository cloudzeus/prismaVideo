import nodemailer from 'nodemailer'
import { format } from 'date-fns'

// Get SMTP settings from environment or database
async function getSmtpConfig() {
  try {
    // Try to get from database first
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/settings/smtp`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (response.ok) {
      const settings = await response.json()
      if (settings.enabled) {
        return {
          host: settings.host,
          port: settings.port,
          secure: settings.encryption === 'ssl',
          auth: settings.requireAuth ? {
            user: settings.username,
            pass: settings.password,
          } : undefined,
          fromEmail: settings.fromEmail,
          fromName: settings.fromName,
        }
      }
    }
  } catch (error) {
    console.warn('Failed to get SMTP settings from database, using environment variables:', error)
  }

  // Fallback to environment variables
  return {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    fromEmail: process.env.SMTP_FROM || 'noreply@video-conference.com',
    fromName: process.env.SMTP_FROM_NAME || 'Video Conference Manager',
  }
}

// Create transporter with current settings
async function createTransporter() {
  const config = await getSmtpConfig()
  
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  })
}

const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@video-conference.com'

// Email templates
export function generateMeetingInvitationEmail(
  meeting: any,
  host: any,
  participants: any[],
  invitationLink: string
) {
  const meetingDate = format(new Date(meeting.startTime), 'PPP')
  const meetingTime = format(new Date(meeting.startTime), 'p')
  
  return {
    subject: `Meeting Invitation: ${meeting.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Meeting Invitation</h2>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${meeting.title}</h3>
          <p><strong>Date:</strong> ${meetingDate}</p>
          <p><strong>Time:</strong> ${meetingTime}</p>
          <p><strong>Host:</strong> ${host.firstName} ${host.lastName}</p>
          ${meeting.description ? `<p><strong>Description:</strong> ${meeting.description}</p>` : ''}
          ${meeting.password ? `<p><strong>Password:</strong> ${meeting.password}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationLink}" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Join Meeting
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This invitation was sent by the Video Conference Manager system.
        </p>
      </div>
    `,
    text: `
Meeting Invitation: ${meeting.title}

Date: ${meetingDate}
Time: ${meetingTime}
Host: ${host.firstName} ${host.lastName}
${meeting.description ? `Description: ${meeting.description}` : ''}
${meeting.password ? `Password: ${meeting.password}` : ''}

Join Meeting: ${invitationLink}

This invitation was sent by the Video Conference Manager system.
    `,
  }
}

export function generateRecordingNotificationEmail(
  recording: any,
  meeting: any,
  participants: any[]
) {
  return {
    subject: `Recording Available: ${meeting.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Recording Available</h2>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${meeting.title}</h3>
          <p><strong>Recording Title:</strong> ${recording.title}</p>
          ${recording.description ? `<p><strong>Description:</strong> ${recording.description}</p>` : ''}
          ${recording.duration ? `<p><strong>Duration:</strong> ${Math.floor(recording.duration / 60)} minutes</p>` : ''}
          <p><strong>Recorded:</strong> ${format(new Date(recording.createdAt), 'PPP')}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${recording.bunnyCdnUrl}" 
             style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Recording
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This recording is available for 30 days from the meeting date.
        </p>
      </div>
    `,
    text: `
Recording Available: ${meeting.title}

Recording Title: ${recording.title}
${recording.description ? `Description: ${recording.description}` : ''}
${recording.duration ? `Duration: ${Math.floor(recording.duration / 60)} minutes` : ''}
Recorded: ${format(new Date(recording.createdAt), 'PPP')}

View Recording: ${recording.bunnyCdnUrl}

This recording is available for 30 days from the meeting date.
    `,
  }
}

export function generatePasswordResetEmail(
  user: any,
  resetToken: string,
  resetUrl: string
) {
  return {
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        
        <p>Hello ${user.firstName},</p>
        
        <p>We received a request to reset your password for your Video Conference Manager account.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>If you didn't request this password reset, please ignore this email.</p>
        
        <p>This link will expire in 1 hour for security reasons.</p>
        
        <p style="color: #666; font-size: 14px;">
          Best regards,<br>
          Video Conference Manager Team
        </p>
      </div>
    `,
    text: `
Password Reset Request

Hello ${user.firstName},

We received a request to reset your password for your Video Conference Manager account.

Reset Password: ${resetUrl}

If you didn't request this password reset, please ignore this email.

This link will expire in 1 hour for security reasons.

Best regards,
Video Conference Manager Team
    `,
  }
}

export function generateWelcomeEmail(user: any, company: any) {
  return {
    subject: 'Welcome to Video Conference Manager',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Video Conference Manager!</h2>
        
        <p>Hello ${user.firstName},</p>
        
        <p>Welcome to Video Conference Manager! Your account has been successfully created.</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Account Details</h3>
          <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Company:</strong> ${company.name}</p>
          <p><strong>Role:</strong> ${user.role}</p>
        </div>
        
        <p>You can now:</p>
        <ul>
          <li>Schedule and join video meetings</li>
          <li>Manage your profile and preferences</li>
          <li>Access meeting recordings and transcripts</li>
          <li>View usage statistics and reports</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL}" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Get Started
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          If you have any questions, please contact your system administrator.
        </p>
      </div>
    `,
    text: `
Welcome to Video Conference Manager!

Hello ${user.firstName},

Welcome to Video Conference Manager! Your account has been successfully created.

Account Details:
Name: ${user.firstName} ${user.lastName}
Email: ${user.email}
Company: ${company.name}
Role: ${user.role}

You can now:
- Schedule and join video meetings
- Manage your profile and preferences
- Access meeting recordings and transcripts
- View usage statistics and reports

Get Started: ${process.env.NEXTAUTH_URL}

If you have any questions, please contact your system administrator.
    `,
  }
}

// Email sending functions
export async function sendEmail(to: string, subject: string, html: string, text: string) {
  try {
    const transporter = await createTransporter()
    const config = await getSmtpConfig()
    
    const mailOptions = {
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      html,
      text,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email sending failed:', error)
    throw new Error('Failed to send email')
  }
}

export async function sendMeetingInvitation(
  meeting: any,
  host: any,
  participants: any[]
) {
  const invitationLink = `${process.env.NEXTAUTH_URL}/meetings/${meeting.id}?password=${meeting.password}`
  const emailContent = generateMeetingInvitationEmail(meeting, host, participants, invitationLink)
  
  const emailPromises = participants.map(participant =>
    sendEmail(participant.email, emailContent.subject, emailContent.html, emailContent.text)
  )
  
  return Promise.all(emailPromises)
}

export async function sendRecordingNotification(
  recording: any,
  meeting: any,
  participants: any[]
) {
  const emailContent = generateRecordingNotificationEmail(recording, meeting, participants)
  
  const emailPromises = participants.map(participant =>
    sendEmail(participant.email, emailContent.subject, emailContent.html, emailContent.text)
  )
  
  return Promise.all(emailPromises)
}

export async function sendPasswordResetEmail(user: any, resetToken: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`
  const emailContent = generatePasswordResetEmail(user, resetToken, resetUrl)
  
  return sendEmail(user.email, emailContent.subject, emailContent.html, emailContent.text)
}

export async function sendWelcomeEmail(user: any, company: any) {
  const emailContent = generateWelcomeEmail(user, company)
  
  return sendEmail(user.email, emailContent.subject, emailContent.html, emailContent.text)
}

export async function sendMeetingInvitationEmail({
  to,
  meeting,
  host,
  invitationLink,
  message = ''
}: {
  to: string
  meeting: any
  host: any
  invitationLink: string
  message?: string
}) {
  const meetingDate = format(new Date(meeting.startTime), 'PPP')
  const meetingTime = format(new Date(meeting.startTime), 'p')
  
  const emailContent = {
    subject: `Meeting Invitation: ${meeting.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Meeting Invitation</h2>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${meeting.title}</h3>
          <p><strong>Date:</strong> ${meetingDate}</p>
          <p><strong>Time:</strong> ${meetingTime}</p>
          <p><strong>Host:</strong> ${host.firstName} ${host.lastName}</p>
          ${meeting.description ? `<p><strong>Description:</strong> ${meeting.description}</p>` : ''}
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationLink}" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Join Meeting
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          This invitation was sent by the Video Conference Manager system.<br>
          You can join this meeting using the link above without needing to log in.
        </p>
      </div>
    `,
    text: `
Meeting Invitation: ${meeting.title}

Date: ${meetingDate}
Time: ${meetingTime}
Host: ${host.firstName} ${host.lastName}
${meeting.description ? `Description: ${meeting.description}` : ''}
${message ? `Message: ${message}` : ''}

Join Meeting: ${invitationLink}

This invitation was sent by the Video Conference Manager system.
You can join this meeting using the link above without needing to log in.
    `,
  }
  
  return sendEmail(to, emailContent.subject, emailContent.html, emailContent.text)
}

// Utility functions
export function generateMeetingPassword(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function generateInvitationLink(meetingId: string, password?: string): string {
  const baseUrl = `${process.env.NEXTAUTH_URL}/meetings/${meetingId}`
  return password ? `${baseUrl}?password=${password}` : baseUrl
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Bulk email sending with rate limiting
export async function sendBulkEmails(
  emails: Array<{ to: string; subject: string; html: string; text: string }>,
  delayMs: number = 1000
) {
  const results = []
  
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i]
    if (!email) continue
    
    try {
      const result = await sendEmail(
        email.to,
        email.subject,
        email.html,
        email.text
      )
      results.push({ success: true, email: email.to, messageId: result.messageId })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      results.push({ success: false, email: email.to, error: errorMessage })
    }
    
    // Add delay between emails to avoid rate limiting
    if (i < emails.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  
  return results
} 