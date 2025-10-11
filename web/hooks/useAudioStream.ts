/**
 * Hook to manage WebSocket audio streaming for live interview.
 * Captures microphone audio, sends to server, and plays back responses.
 */

import { useRef, useState, useCallback, useEffect } from 'react'

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

interface JobData {
  raw_text: string
  title: string
  source: string
  role: string
  skills_core: string[]
  skills_nice: string[]
  values: string[]
  requirements: string[]
}

interface UseAudioStreamReturn {
  connect: (jobData?: JobData | null) => Promise<void>
  disconnect: () => void
  connectionState: ConnectionState
  error: string | null
  isSpeaking: boolean
}

const WS_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace('http', 'ws') || 'ws://localhost:8000'

export function useAudioStream(): UseAudioStreamReturn {
  const wsRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const processorRef = useRef<ScriptProcessorNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const nextPlayTimeRef = useRef<number>(0)

  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [error, setError] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const disconnect = useCallback(() => {
    // Stop audio processing
    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current = null
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }

    // Stop microphone
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setConnectionState('disconnected')
    setIsSpeaking(false)
    nextPlayTimeRef.current = 0
  }, [])

  const connect = useCallback(async (jobData?: JobData | null) => {
    try {
      setError(null)
      setConnectionState('connecting')

      // Get microphone access (don't force sample rate - let browser decide)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })

      mediaStreamRef.current = stream

      // Create audio context with default sample rate (usually 44.1kHz or 48kHz)
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      const source = audioContext.createMediaStreamSource(stream)
      sourceRef.current = source

      console.log('AudioContext sample rate:', audioContext.sampleRate)

      // Create WebSocket connection with job data as query params
      let wsUrl = `${WS_URL}/ws/interview`
      if (jobData) {
        const params = new URLSearchParams({
          role: jobData.role || jobData.title || 'this position',
          company: jobData.source || ''
        })
        wsUrl = `${wsUrl}?${params.toString()}`
      }
      console.log('Connecting to WebSocket:', wsUrl)
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.binaryType = 'arraybuffer'

      ws.onopen = () => {
        console.log('WebSocket connected successfully')
        setConnectionState('connected')

        // Create audio processor to capture and send audio
        const processor = audioContext.createScriptProcessor(4096, 1, 1)
        processorRef.current = processor

        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0)

            // Convert Float32 to Int16 PCM
            const pcmData = new Int16Array(inputData.length)
            for (let i = 0; i < inputData.length; i++) {
              const s = Math.max(-1, Math.min(1, inputData[i]))
              pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
            }

            // Send PCM data to server
            ws.send(pcmData.buffer)

            // Detect if user is speaking (simple volume threshold)
            const volume = Math.sqrt(
              inputData.reduce((sum, val) => sum + val * val, 0) / inputData.length
            )
            setIsSpeaking(volume > 0.01)
          }
        }

        source.connect(processor)
        processor.connect(audioContext.destination)
      }

      ws.onmessage = async (event) => {
        // Receive audio from server and play it
        if (event.data instanceof ArrayBuffer) {
          const pcmData = new Int16Array(event.data)

          // Convert Int16 PCM to Float32
          const float32Data = new Float32Array(pcmData.length)
          for (let i = 0; i < pcmData.length; i++) {
            float32Data[i] = pcmData[i] / (pcmData[i] < 0 ? 0x8000 : 0x7FFF)
          }

          // Gemini sends audio at 24kHz
          const audioBuffer = audioContext.createBuffer(1, float32Data.length, 24000)
          audioBuffer.getChannelData(0).set(float32Data)

          const bufferSource = audioContext.createBufferSource()
          bufferSource.buffer = audioBuffer
          bufferSource.connect(audioContext.destination)

          // Queue audio chunks sequentially to avoid gaps and overlaps
          const currentTime = audioContext.currentTime
          const startTime = Math.max(currentTime, nextPlayTimeRef.current)

          bufferSource.start(startTime)

          // Update next play time (duration = samples / sample rate)
          nextPlayTimeRef.current = startTime + audioBuffer.duration
        }
      }

      ws.onerror = (event) => {
        console.error('WebSocket error:', event)
        setError('Connection error')
        setConnectionState('error')
      }

      ws.onclose = (event) => {
        console.log('WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        })

        if (event.code === 1008) {
          setError('GEMINI_API_KEY not configured on server')
        } else if (event.code === 1011) {
          setError(`Server error: ${event.reason}`)
        } else if (!event.wasClean) {
          setError('Connection lost unexpectedly')
        }

        setConnectionState('disconnected')
      }

    } catch (err) {
      console.error('Error starting audio stream:', err)

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Microphone permission denied. Please allow microphone access.')
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setError('No microphone found on this device.')
        } else {
          setError(`Microphone error: ${err.message}`)
        }
      } else {
        setError('Unknown error accessing microphone')
      }

      setConnectionState('error')
      disconnect()
    }
  }, [disconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    connect,
    disconnect,
    connectionState,
    error,
    isSpeaking
  }
}
