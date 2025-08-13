"use client"

import { useEffect, useState, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'

interface AudioLevelIndicatorProps {
  stream?: MediaStream
}

export function AudioLevelIndicator({ stream }: AudioLevelIndicatorProps) {
  const [audioLevel, setAudioLevel] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    if (!stream) return

    try {
      // Create audio context and analyser
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      
      // Configure analyser
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      
      // Connect audio nodes
      source.connect(analyser)
      
      analyserRef.current = analyser
      
      // Start monitoring audio levels
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount
          const dataArray = new Uint8Array(bufferLength)
          
          analyserRef.current.getByteFrequencyData(dataArray)
          
          // Calculate average audio level
          let sum = 0
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i] || 0
          }
          const average = sum / bufferLength
          
          setAudioLevel(average)
          
          // Determine if speaking (threshold-based)
          const speakingThreshold = 20
          setIsSpeaking(average > speakingThreshold)
          
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
        }
      }
      
      updateAudioLevel()
      
    } catch (error) {
      console.error('Error setting up audio analysis:', error)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [stream])

  if (!stream) return null

  const getAudioLevelColor = (level: number) => {
    if (level < 20) return 'bg-gray-400'
    if (level < 40) return 'bg-green-400'
    if (level < 60) return 'bg-yellow-400'
    if (level < 80) return 'bg-orange-400'
    return 'bg-red-400'
  }

  const getAudioLevelWidth = (level: number) => {
    return Math.min((level / 100) * 100, 100)
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Microphone icon */}
      <div className={`p-1 rounded-full ${isSpeaking ? 'bg-green-500' : 'bg-gray-500'}`}>
        {isSpeaking ? (
          <Mic className="h-3 w-3 text-white" />
        ) : (
          <MicOff className="h-3 w-3 text-white" />
        )}
      </div>
      
      {/* Audio level bar */}
      <div className="w-8 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ${getAudioLevelColor(audioLevel)}`}
          style={{ width: `${getAudioLevelWidth(audioLevel)}%` }}
        />
      </div>
      
      {/* Audio level number */}
      <span className="text-xs text-white bg-black bg-opacity-50 px-1 rounded">
        {audioLevel.toFixed(0)}
      </span>
    </div>
  )
}
