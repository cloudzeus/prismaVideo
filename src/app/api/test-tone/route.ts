import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Generate a simple 440Hz sine wave test tone
    const sampleRate = 44100
    const duration = 2 // 2 seconds
    const frequency = 440 // A4 note
    const samples = sampleRate * duration
    
    // Create audio buffer
    const audioBuffer = new ArrayBuffer(44 + samples * 2) // WAV header + 16-bit samples
    const view = new DataView(audioBuffer)
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + samples * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, samples * 2, true)
    
    // Generate sine wave samples
    for (let i = 0; i < samples; i++) {
      const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate)
      const sample16 = Math.round(sample * 16383) // Convert to 16-bit
      view.setInt16(44 + i * 2, sample16, true)
    }
    
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': 'attachment; filename="test-tone.wav"',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Error generating test tone:', error)
    return NextResponse.json(
      { error: 'Failed to generate test tone' },
      { status: 500 }
    )
  }
}
