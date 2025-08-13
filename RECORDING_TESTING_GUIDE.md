# Video Conference Recording Testing Guide

This guide will help you test and verify that video conference recordings are properly saved to Bunny CDN.

## 🎯 What We're Testing

1. **Stream.io Recording API** - Start/stop recording during video calls
2. **Webhook System** - Automatic processing when recordings are ready
3. **Bunny CDN Integration** - Automatic upload and storage of recordings
4. **Database Storage** - Recording metadata and URLs stored in database

## 🚀 Quick Test Steps

### 1. **Navigate to Test Page**
Go to `/test-recording` in your application to access the recording test dashboard.

### 2. **Check Environment Variables**
Verify these environment variables are set:
- ✅ `STREAM_API_KEY`
- ✅ `STREAM_SECRET` 
- ✅ `STREAM_WEBHOOK_SECRET`
- ✅ `BUNNY_ACCESS_KEY`
- ✅ `BUNNY_STORAGE_ZONE`
- ✅ `BUNNY_CDN_URL`
- ✅ `BUNNY_STORAGE_URL`

### 3. **Test Recording Flow**
Click "Test Recording Flow" button to simulate:
- Starting a recording
- Stopping a recording
- Webhook processing
- Bunny CDN upload

## 🔧 Stream.io Configuration

### **Webhook Setup**
1. Go to your Stream.io dashboard
2. Navigate to **Webhooks** section
3. Add new webhook endpoint:
   ```
   URL: https://your-domain.com/api/webhooks/stream
   Events: call.ended, call.recording.ready, call.transcription.ready, call.livestream.ready
   ```

### **Recording Permissions**
Ensure your Stream.io plan supports recording functionality.

## 📹 Testing in Real Video Conference

### **Start a Video Conference**
1. Create or join a meeting
2. Navigate to the meeting room
3. Look for the recording button (circle/square icon)

### **Start Recording**
1. Click the recording button (circle icon)
2. You should see "Recording Started" toast
3. Recording status should show "Recording" badge

### **Stop Recording**
1. Click the recording button again (square icon)
2. You should see "Recording Stopped" toast
3. Status should change to "Processing"

### **Check Webhook Processing**
1. Monitor your application logs
2. Look for webhook events:
   ```
   Stream webhook event: call.recording.ready
   Recording processed and uploaded to Bunny CDN: [recording_id]
   ```

## 🗄️ Database Verification

### **Check Recordings Table**
Query your database to see recordings:
```sql
SELECT * FROM recordings ORDER BY createdAt DESC;
```

### **Expected Fields**
- `id` - Unique recording ID
- `callId` - Associated meeting ID
- `streamRecordingId` - Stream.io recording ID
- `title` - Recording title
- `status` - Status (recording → processing → completed)
- `bunnyCdnUrl` - Final CDN URL (after processing)
- `duration` - Recording duration in seconds
- `fileSize` - File size in bytes

## 🌐 Bunny CDN Verification

### **Check File Storage**
1. Go to your Bunny CDN dashboard
2. Navigate to **Storage** → **Your Storage Zone**
3. Look for `recordings/[companyId]/` folder
4. Verify MP4 files are present

### **Check CDN URLs**
1. In your test page, look for "Bunny CDN URL" links
2. Click on the URL to verify the video plays
3. URLs should look like: `https://cdn.bunny.net/[zone]/recordings/[company]/recording-[id]-[timestamp].mp4`

## 🐛 Troubleshooting

### **Recording Won't Start**
- Check browser console for errors
- Verify user has recording permission (host/admin)
- Check Stream.io API credentials
- Ensure meeting has valid `streamCallId`

### **Webhook Not Receiving Events**
- Verify webhook URL is correct
- Check webhook secret matches environment variable
- Ensure webhook events are enabled in Stream.io
- Check application logs for webhook errors

### **Bunny CDN Upload Fails**
- Verify Bunny CDN credentials
- Check storage zone exists and is accessible
- Ensure sufficient storage space
- Check network connectivity to Bunny CDN

### **Database Records Missing**
- Check Prisma connection
- Verify database schema matches expectations
- Check for database errors in logs
- Ensure user has proper permissions

## 📊 Monitoring and Logs

### **Application Logs**
Look for these log messages:
```
Stream webhook event: call.recording.ready
Recording processed and uploaded to Bunny CDN: [recording_id]
Bunny CDN upload error: [error details]
```

### **Stream.io Dashboard**
- Check **Calls** section for recording status
- Monitor **Webhooks** for delivery status
- Review **Analytics** for recording metrics

### **Bunny CDN Dashboard**
- Monitor **Storage** usage
- Check **CDN** performance
- Review **Analytics** for file access

## ✅ Success Indicators

### **Complete Flow Success**
1. ✅ Recording starts successfully
2. ✅ Recording stops successfully  
3. ✅ Webhook received (`call.recording.ready`)
4. ✅ File downloaded from Stream.io
5. ✅ File uploaded to Bunny CDN
6. ✅ Database record updated with `bunnyCdnUrl`
7. ✅ Email notifications sent to participants
8. ✅ Recording accessible via CDN URL

### **Expected File Structure**
```
Bunny CDN Storage:
└── [storage-zone]/
    └── recordings/
        └── [company-id]/
            ├── recording-[call-id]-[timestamp].mp4
            ├── recording-[call-id]-[timestamp].mp4
            └── ...
```

## 🔄 Testing Different Scenarios

### **Short Recording (5-10 seconds)**
- Verify quick processing
- Check file size and duration

### **Long Recording (5+ minutes)**
- Test extended recording stability
- Verify large file handling

### **Multiple Recordings**
- Start/stop multiple times in same meeting
- Verify each recording is processed separately

### **Different User Roles**
- Test with host/admin users
- Test with regular participants
- Verify permission restrictions

## 📱 Mobile Testing

### **Mobile Browsers**
- Test recording on mobile devices
- Verify responsive UI
- Check mobile-specific permissions

### **Different Devices**
- Test on various screen sizes
- Verify touch controls work
- Check mobile performance

## 🚨 Common Issues & Solutions

### **Issue: Recording button not visible**
**Solution:** Check user permissions and meeting role

### **Issue: Recording starts but never stops**
**Solution:** Verify Stream.io API connectivity and webhook setup

### **Issue: Files not appearing in Bunny CDN**
**Solution:** Check Bunny CDN credentials and storage zone configuration

### **Issue: Webhook signature verification fails**
**Solution:** Ensure `STREAM_WEBHOOK_SECRET` matches Stream.io dashboard

### **Issue: Database errors during recording creation**
**Solution:** Verify Prisma schema and database connection

## 📞 Support

If you encounter persistent issues:
1. Check application logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test Stream.io API endpoints directly
4. Check Bunny CDN dashboard for storage issues
5. Review database schema and permissions

## 🎉 Success!

When everything works correctly, you should be able to:
- Start and stop recordings during video conferences
- See recordings automatically processed and uploaded to Bunny CDN
- Access recordings via CDN URLs
- View recording metadata in your database
- Receive email notifications when recordings are ready

This confirms your video conference recording system is fully functional with cloud storage integration!
