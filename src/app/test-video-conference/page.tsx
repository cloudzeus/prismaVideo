import { MeetingRoom } from '@/components/video/meeting-room'

export default function TestVideoConferencePage() {
  // Mock meeting data for testing
  const mockMeeting = {
    id: 'test-meeting-123',
    title: 'Test Video Conference',
    description: 'Testing multi-user video conferencing',
    startTime: new Date().toISOString(),
    status: 'active',
    createdById: 'user-1',
    participants: [
      {
        userId: 'user-2',
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          avatar: null
        }
      },
      {
        userId: 'user-3',
        user: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          avatar: null
        }
      }
    ]
  }

  const mockUser = {
    id: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    role: 'admin',
    avatar: null
  }

  return (
    <div className="h-screen">
      <MeetingRoom
        meeting={mockMeeting}
        user={mockUser}
        isHost={true}
        isAdmin={true}
      />
    </div>
  )
}
