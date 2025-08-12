# Meeting Invitation System

This document explains how to use the new meeting invitation system that allows both users and contacts to join meetings.

## Features

### For Users (Authenticated)
- Users can log in with their credentials and access meetings through the main meetings page
- Users can see all meetings they're invited to or have created
- Users can join meetings directly from the meetings table

### For Contacts (External Participants)
- Contacts receive email invitations with unique access tokens
- Contacts can join meetings without creating accounts or logging in
- Each contact gets a unique URL to access the meeting

## How It Works

### 1. Sending Invitations

1. **Navigate to Meetings**: Go to the main meetings page
2. **Find Your Meeting**: Locate the meeting you want to send invitations for
3. **Send Invitations**: Click the three dots menu and select "Send Invitations"
4. **Enter Email Addresses**: Add the email addresses of participants
5. **Add Personal Message** (Optional): Include a custom message
6. **Send**: Click "Send Invitations" to email all participants

### 2. Email Invitations

- Each participant receives an email with:
  - Meeting details (title, date, time, description)
  - A unique invitation link
  - Host information
  - Any personal message you added

### 3. Joining Meetings

#### For Users:
- Log in to the system
- Go to Meetings page
- Click "Join Meeting" on the meeting you want to join

#### For Contacts:
- Click the invitation link in the email
- Enter your name when prompted
- Join the meeting directly

## Technical Details

### Database Changes
- Added `accessToken` field to meetings for unique contact access
- Updated `Participant` model to support both users and contacts
- Added relationship between contacts and participants

### API Endpoints
- `POST /api/meetings/[id]/send-invitations` - Send invitations to participants
- `GET /meetings/[callId]/join/[token]` - Contact meeting access page

### Email System
- Uses configured SMTP settings from the settings page
- Falls back to environment variables if database settings unavailable
- Sends HTML and text versions of invitations

## Security Features

- Each meeting has a unique access token
- Tokens are generated automatically when invitations are sent
- Contacts can only access meetings they were invited to
- No authentication required for contacts (by design)

## Configuration

### SMTP Settings
Configure your email server in Settings > SMTP Configuration:
- SMTP Host (e.g., smtp.gmail.com)
- Port (587 for TLS, 465 for SSL)
- Username and Password
- From Email and Name
- Enable/Disable SMTP

### Environment Variables (Fallback)
If SMTP settings are not configured in the database, the system will use:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_FROM_NAME`

## Troubleshooting

### Invitations Not Sending
1. Check SMTP settings in the admin panel
2. Verify email server credentials
3. Check server logs for error messages
4. Ensure SMTP is enabled

### Contacts Can't Join
1. Verify the invitation link is correct
2. Check if the meeting has started
3. Ensure the access token is valid
4. Check meeting status (scheduled/active/ended)

### Meeting Access Issues
1. Verify user permissions
2. Check if user is a participant
3. Ensure meeting is in the correct status
4. Check company access restrictions

## Future Enhancements

- Bulk invitation management
- Recurring meeting invitations
- Calendar integration (ICS files)
- Meeting reminders
- Participant analytics
- Advanced access controls
