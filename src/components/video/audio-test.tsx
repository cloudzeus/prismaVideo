"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause,
  Settings,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function AudioTest() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [hasAudioPermission, setHasAudioPermission] = useState<boolean | null>(null)
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('')
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number>()
  
  const { toast } = useToast()

  useEffect(() => {
    // Check audio permissions and get available devices
    checkAudioPermissions()
    getAudioDevices()
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const checkAudioPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setHasAudioPermission(true)
      setIsAudioEnabled(true)
      
      // Set up audio analysis
      setupAudioAnalysis(stream)
      
      toast({
        title: "Audio Permission Granted",
        description: "Microphone access has been granted",
      })
    } catch (error: any) {
      setHasAudioPermission(false)
      toast({
        title: "Audio Permission Denied",
        description: "Please allow microphone access to use audio features",
        variant: 'destructive',
      })
    }
  }

  const getAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(device => device.kind === 'audioinput')
      setAudioDevices(audioInputs)
      
      if (audioInputs.length > 0 && audioInputs[0]?.deviceId) {
        setSelectedAudioDevice(audioInputs[0]?.deviceId || '')
      }
    } catch (error) {
      console.error('Failed to get audio devices:', error)
    }
  }

  const setupAudioAnalysis = (stream: MediaStream) => {
    try {
      streamRef.current = stream
      
      // Create audio context and analyser
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)
      
      // Configure analyser
      analyserRef.current.fftSize = 256
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      
      // Start monitoring audio levels
      const updateAudioLevel = () => {
        if (analyserRef.current && isAudioEnabled) {
          analyserRef.current.getByteFrequencyData(dataArray)
          
          // Calculate average audio level
          let sum = 0
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i] || 0
          }
          const average = sum / bufferLength
          setAudioLevel(average)
          
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
        }
      }
      
      updateAudioLevel()
    } catch (error) {
      console.error('Failed to setup audio analysis:', error)
    }
  }

  const toggleAudio = async () => {
    if (isAudioEnabled) {
      // Disable audio
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => track.stop())
      }
      setIsAudioEnabled(false)
      setAudioLevel(0)
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      
      toast({
        title: "Microphone Disabled",
        description: "Your microphone is now muted",
      })
    } else {
      // Enable audio
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setupAudioAnalysis(stream)
        setIsAudioEnabled(true)
        
        toast({
          title: "Microphone Enabled",
          description: "Your microphone is now active",
        })
      } catch (error) {
        toast({
          title: "Failed to Enable Audio",
          description: "Could not access microphone",
          variant: 'destructive',
        })
      }
    }
  }

  const playTestTone = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const changeAudioDevice = async (deviceId: string) => {
    try {
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => track.stop())
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      })
      
      setupAudioAnalysis(stream)
      setSelectedAudioDevice(deviceId)
      
      toast({
        title: "Audio Device Changed",
        description: "Audio input device has been updated",
      })
    } catch (error) {
      toast({
        title: "Device Change Failed",
        description: "Could not switch to selected audio device",
        variant: 'destructive',
      })
    }
  }

  const getAudioLevelColor = (level: number) => {
    if (level < 30) return 'bg-gray-400'
    if (level < 60) return 'bg-yellow-400'
    if (level < 90) return 'bg-orange-400'
    return 'bg-red-400'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Audio Test & Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Audio Permission Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Microphone Permission:</span>
            {hasAudioPermission === null ? (
              <Badge variant="secondary">Checking...</Badge>
            ) : hasAudioPermission ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Granted
              </Badge>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Denied
              </Badge>
            )}
          </div>

          {/* Audio Device Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Audio Input Device:</label>
            <select
              value={selectedAudioDevice}
              onChange={(e) => changeAudioDevice(e.target.value)}
              className="w-full p-2 border border-input rounded-md"
              disabled={audioDevices.length === 0}
            >
              {audioDevices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${device.deviceId.slice(0, 8)}...`}
                </option>
              ))}
            </select>
          </div>

          {/* Audio Level Meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Audio Level:</span>
              <span className="text-sm text-muted-foreground">{audioLevel.toFixed(1)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-100 ${getAudioLevelColor(audioLevel)}`}
                style={{ width: `${(audioLevel / 100) * 100}%` }}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-2">
            <Button
              variant={isAudioEnabled ? "default" : "destructive"}
              onClick={toggleAudio}
              className="flex-1"
            >
              {isAudioEnabled ? (
                <>
                  <Mic className="mr-2 h-4 w-4" />
                  Disable Microphone
                </>
              ) : (
                <>
                  <MicOff className="mr-2 h-4 w-4" />
                  Enable Microphone
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={playTestTone}
              className="flex-1"
            >
              {isPlaying ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  Stop Test Tone
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Play Test Tone
                </>
              )}
            </Button>
          </div>

          {/* Test Tone Audio Element */}
          <audio
            ref={audioRef}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          >
            <source src="/api/test-tone" type="audio/wav" />
            Your browser does not support the audio element.
          </audio>

          {/* Troubleshooting Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Audio Troubleshooting Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Make sure your microphone is not muted in system settings</li>
              <li>• Check that the correct audio input device is selected</li>
              <li>• Ensure your browser has permission to access the microphone</li>
              <li>• Try refreshing the page if audio stops working</li>
              <li>• Check your system volume and microphone levels</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
