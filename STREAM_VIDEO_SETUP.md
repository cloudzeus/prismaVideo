# Stream Video Integration Setup Guide

This guide will help you set up Stream Video for your video conference application.

## What We've Implemented

✅ **Stream Video SDK Integration**
- Installed `@stream-io/video-react-sdk` and `stream-chat`
- Created Stream Video client configuration
- Implemented token generation API endpoint
- Created Stream Video meeting room component
- Updated meeting page to use Stream Video

## Environment Variables

Add these to your `.env.local` file:

```bash
# Stream.io Video API
STREAM_API_KEY="your-stream-api-key"
STREAM_SECRET="your-stream-secret"
```

## Getting Stream.io Credentials

1. Go to [Stream Dashboard](https://dashboard.getstream.io/)
2. Create a new app or use existing one
3. Copy your API Key and Secret from the app settings
4. Add them to your environment variables

## How It Works

1. **User joins meeting** → Meeting page loads
2. **Token generation** → `/api/stream/token` generates Stream Video token
3. **Stream client creation** → Creates Stream Video client with user info
4. **Call joining** → Joins or creates Stream Video call
5. **Video interface** → Renders Stream Video components (SpeakerLayout, CallControls)

## Components

### `StreamMeetingRoomSimple`
- Main video conference interface
- Uses Stream Video SDK components
- Handles connection and error states
- Responsive design with host controls

### Stream Video Features
- **SpeakerLayout**: Main video area with active speaker
- **CallControls**: Mute, video, screen share, leave call
- **Participant management**: Automatic participant detection
- **Real-time communication**: WebRTC-based video/audio

## API Endpoints

### `POST /api/stream/token`
Generates Stream Video tokens for authenticated users.

**Request:**
```json
{
  "userId": "user-id",
  "meetingId": "meeting-id"
}
```

**Response:**
```json
{
  "token": "stream-video-token",
  "apiKey": "stream-api-key",
  "userId": "user-id",
  "meetingId": "meeting-id"
}
```

## Testing

1. **Start your development server**: `npm run dev`
2. **Navigate to a meeting**: `/meetings/[meeting-id]`
3. **Check browser console** for any connection errors
4. **Verify Stream Video interface** loads correctly

## Troubleshooting

### Common Issues

1. **"Stream.io API key and secret are required"**
   - Check your `.env.local` file has `STREAM_API_KEY` and `STREAM_SECRET`
   - Restart your development server after adding environment variables

2. **"Failed to get Stream token"**
   - Check the `/api/stream/token` endpoint is working
   - Verify user authentication is working
   - Check browser network tab for API errors

3. **Video not showing**
   - Allow camera/microphone permissions in browser
   - Check browser console for WebRTC errors
   - Verify Stream Video SDK is properly imported

### Debug Steps

1. **Check environment variables**:
   ```bash
   echo $STREAM_API_KEY
   echo $STREAM_SECRET
   ```

2. **Test token API**:
   ```bash
   curl -X POST http://localhost:3000/api/stream/token \
     -H "Content-Type: application/json" \
     -d '{"userId":"test","meetingId":"test"}'
   ```

3. **Check browser console** for JavaScript errors

## Production Deployment

1. **Set production environment variables** in your hosting platform
2. **Verify Stream.io app settings** for production domain
3. **Test video calls** with multiple participants
4. **Monitor Stream.io dashboard** for usage and errors

## Next Steps

- [ ] Test with multiple participants
- [ ] Add recording functionality
- [ ] Implement breakout rooms
- [ ] Add chat features
- [ ] Customize Stream Video theme
- [ ] Add analytics and monitoring

## Resources

- [Stream Video React SDK Documentation](https://getstream.io/video/sdk/react/)
- [Stream Video API Reference](https://getstream.io/video/docs/api/)
- [Stream Dashboard](https://dashboard.getstream.io/)
- [Video Calling Tutorial](https://getstream.io/video/sdk/react/tutorial/video-calling/)

## Support

If you encounter issues:
1. Check this setup guide
2. Review Stream.io documentation
3. Check browser console and network tab
4. Verify environment variables
5. Test with Stream.io demo app first
