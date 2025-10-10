/**
 * Hook to manage webcam access via getUserMedia.
 * Provides a video ref, start/stop controls, and permission state.
 */

import { useRef, useState, useCallback, useEffect } from 'react'

type PermissionState = 'prompt' | 'granted' | 'denied' | 'error'

interface UseWebcamReturn {
  videoRef: React.RefObject<HTMLVideoElement>
  start: () => Promise<void>
  stop: () => void
  permissionState: PermissionState
  error: string | null
}

export function useWebcam(): UseWebcamReturn {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt')
  const [error, setError] = useState<string | null>(null)

  const start = useCallback(async () => {
    try {
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      })

      streamRef.current = stream
      setPermissionState('granted')

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(err => {
          console.error('Error playing video:', err)
          setError('Failed to play video stream')
        })
      }
    } catch (err) {
      console.error('Error accessing webcam:', err)

      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setPermissionState('denied')
          setError('Camera permission denied. Please allow camera access.')
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setPermissionState('error')
          setError('No camera found on this device.')
        } else {
          setPermissionState('error')
          setError(`Camera error: ${err.message}`)
        }
      } else {
        setPermissionState('error')
        setError('Unknown error accessing camera')
      }
    }
  }, [])

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setPermissionState('prompt')
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return {
    videoRef,
    start,
    stop,
    permissionState,
    error
  }
}
