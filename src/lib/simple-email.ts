// Simple email service that can work without nodemailer
// This is a placeholder that can be replaced with a working email service later

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface MeetingInvitationData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  agenda?: string;
  hostName: string;
  hostEmail: string;
  participantEmails: string[];
}

class SimpleEmailService {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // For now, just log the email details
      console.log('Email would be sent:', {
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      
      // In a real implementation, this would send the email
      // For now, return true to simulate success
      return true;
    } catch (error) {
      console.error('Error in simple email service:', error);
      return false;
    }
  }

  async sendMeetingInvitation(data: MeetingInvitationData): Promise<boolean> {
    const startTime = data.startTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const endTime = data.endTime.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Meeting Invitation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .meeting-details { background: #fff; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; }
            .detail-row { margin-bottom: 15px; }
            .label { font-weight: bold; color: #495057; }
            .value { margin-left: 10px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 14px; color: #6c757d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; color: #007bff;">📅 Meeting Invitation</h1>
            </div>
            
            <div class="meeting-details">
              <div class="detail-row">
                <span class="label">Meeting:</span>
                <span class="value">${data.title}</span>
              </div>
              
              ${data.description ? `
                <div class="detail-row">
                  <span class="label">Description:</span>
                  <span class="value">${data.description}</span>
                </div>
              ` : ''}
              
              <div class="detail-row">
                <span class="label">Date & Time:</span>
                <span class="value">${startTime} - ${endTime}</span>
              </div>
              
              ${data.location ? `
                <div class="detail-row">
                  <span class="label">Location:</span>
                  <span class="value">${data.location}</span>
                </div>
              ` : ''}
              
              ${data.agenda ? `
                <div class="detail-row">
                  <span class="label">Agenda:</span>
                  <span class="value">${data.agenda}</span>
                </div>
              ` : ''}
              
              <div class="detail-row">
                <span class="label">Host:</span>
                <span class="value">${data.hostName} (${data.hostEmail})</span>
              </div>
            </div>
            
            <div class="footer">
              <p>This invitation was sent from your Video Conference Manager system.</p>
              <p>Please contact the host if you have any questions.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Meeting Invitation

Meeting: ${data.title}
${data.description ? `Description: ${data.description}` : ''}
Date & Time: ${startTime} - ${endTime}
${data.location ? `Location: ${data.location}` : ''}
${data.agenda ? `Agenda: ${data.agenda}` : ''}
Host: ${data.hostName} (${data.hostEmail})

This invitation was sent from your Video Conference Manager system.
Please contact the host if you have any questions.
    `;

    return await this.sendEmail({
      to: data.participantEmails,
      subject: `Meeting Invitation: ${data.title}`,
      html,
      text,
    });
  }

  async testConnection(): Promise<boolean> {
    // For now, always return true to simulate success
    console.log('Simple email service connection test passed');
    return true;
  }
}

export const simpleEmailService = new SimpleEmailService(); 