import { AudioTest } from '@/components/video/audio-test'

export default function TestAudioPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Audio Test & Diagnostics</h1>
          <p className="text-muted-foreground">
            Use this page to test your microphone, diagnose audio issues, and ensure your video conference audio is working properly.
          </p>
        </div>
        
        <AudioTest />
        
        <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2">Important Notes:</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• This test requires microphone permissions from your browser</li>
            <li>• Make sure your microphone is not muted in your system settings</li>
            <li>• If you see "Permission Denied", check your browser's microphone settings</li>
            <li>• The audio level meter should show activity when you speak</li>
            <li>• Test both your microphone input and speaker output</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
