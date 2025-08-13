"use client"

import { useEffect, useState, useRef } from 'react'
import { Volume2 } from 'lucide-react'

interface SpeakingIndicatorProps {
  stream?: MediaStream
}

export function SpeakingIndicator({ stream }: SpeakingIndicatorProps) {
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
      
      // Configure analyser for voice detection
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.3
      
      // Connect audio nodes
      source.connect(analyser)
      
      analyserRef.current = analyser
      
      // Start monitoring for speech
      const detectSpeech = () => {
        if (analyserRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount
          const dataArray = new Uint8Array(bufferLength)
          
          analyserRef.current.getByteFrequencyData(dataArray)
          
          // Focus on human speech frequencies (85Hz - 255Hz)
          const speechStart = Math.floor(85 * bufferLength / 22050)
          const speechEnd = Math.floor(255 * bufferLength / 22050)
          
          let speechEnergy = 0
          for (let i = speechStart; i < speechEnd; i++) {
            speechEnergy += dataArray[i] || 0
          }
          
          const averageSpeechEnergy = speechEnergy / (speechEnd - speechStart)
          
          // Threshold for speech detection
          const speechThreshold = 15
          const speaking = averageSpeechEnergy > speechThreshold
          
          setIsSpeaking(speaking)
          
          animationFrameRef.current = requestAnimationFrame(detectSpeech)
        }
      }
      
      detectSpeech()
      
    } catch (error) {
      console.error('Error setting up speech detection:', error)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [stream])

  if (!stream) return null

  return (
    <div className={`p-1 rounded-full transition-all duration-200 ${
      isSpeaking 
        ? 'bg-green-500 animate-pulse' 
        : 'bg-gray-500'
    }`}>
      <Volume2 className="h-3 w-3 text-white" />
    </div>
  )
}
