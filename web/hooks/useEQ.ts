/**
 * Hook to manage EQ metrics analysis from video frames.
 * Uses requestAnimationFrame loop (~15 FPS) to analyze facial features.
 * Applies simple moving average smoothing and optional OpenCV box filtering.
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { initFaceLandmarker, analyzeVideoFrame } from '@/lib/eq/faceLandmarker'
import { loadOpenCV } from '@/lib/cv/loadOpenCV'

interface EQMetrics {
  gazeStability: number
  blinkRatePerMin: number
  expressionVariance: number
}

interface UseEQReturn {
  metrics: EQMetrics
  start: () => Promise<void>
  stop: () => void
  isRunning: boolean
  error: string | null
}

// Rolling buffer size for smoothing
const BUFFER_SIZE = 10
const TARGET_FPS = 15
const FRAME_INTERVAL = 1000 / TARGET_FPS

export function useEQ(videoRef: React.RefObject<HTMLVideoElement>): UseEQReturn {
  const [metrics, setMetrics] = useState<EQMetrics>({
    gazeStability: 0,
    blinkRatePerMin: 0,
    expressionVariance: 0
  })
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rafIdRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number>(0)
  const cvRef = useRef<any>(null)

  // Rolling buffers for smoothing
  const gazeBufferRef = useRef<number[]>([])
  const blinkBufferRef = useRef<number[]>([])
  const expressionBufferRef = useRef<number[]>([])

  const start = useCallback(async () => {
    if (isRunning) return

    try {
      setError(null)

      // Initialize FaceLandmarker
      await initFaceLandmarker({ maxFaces: 1, runningMode: 'VIDEO' })

      // Load OpenCV (optional, for advanced filtering)
      const cvResult = await loadOpenCV()
      if (cvResult.available) {
        cvRef.current = cvResult.cv
      }

      setIsRunning(true)
    } catch (err) {
      console.error('Failed to start EQ analysis:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize')
    }
  }, [isRunning])

  const stop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    setIsRunning(false)

    // Clear buffers
    gazeBufferRef.current = []
    blinkBufferRef.current = []
    expressionBufferRef.current = []
  }, [])

  // Analysis loop
  useEffect(() => {
    if (!isRunning || !videoRef.current) return

    const analyze = async (timestamp: number) => {
      // Throttle to target FPS
      if (timestamp - lastFrameTimeRef.current < FRAME_INTERVAL) {
        rafIdRef.current = requestAnimationFrame(analyze)
        return
      }
      lastFrameTimeRef.current = timestamp

      const video = videoRef.current
      if (!video || video.readyState < 2) {
        rafIdRef.current = requestAnimationFrame(analyze)
        return
      }

      try {
        // Analyze frame
        const rawMetrics = await analyzeVideoFrame(video)

        // Update buffers
        gazeBufferRef.current.push(rawMetrics.gazeStability)
        blinkBufferRef.current.push(rawMetrics.blinkRatePerMin)
        expressionBufferRef.current.push(rawMetrics.expressionVariance)

        // Maintain buffer size
        if (gazeBufferRef.current.length > BUFFER_SIZE) gazeBufferRef.current.shift()
        if (blinkBufferRef.current.length > BUFFER_SIZE) blinkBufferRef.current.shift()
        if (expressionBufferRef.current.length > BUFFER_SIZE) expressionBufferRef.current.shift()

        // Apply simple moving average
        const gazeStability = average(gazeBufferRef.current)
        const blinkRatePerMin = average(blinkBufferRef.current)
        const expressionVariance = average(expressionBufferRef.current)

        // Optional: Apply OpenCV box filter if available
        let smoothedMetrics = { gazeStability, blinkRatePerMin, expressionVariance }

        if (cvRef.current && gazeBufferRef.current.length === BUFFER_SIZE) {
          try {
            smoothedMetrics.gazeStability = boxFilter(gazeBufferRef.current, cvRef.current)
            smoothedMetrics.expressionVariance = boxFilter(expressionBufferRef.current, cvRef.current)
          } catch (err) {
            // Fallback to simple average if box filter fails
            console.warn('OpenCV box filter failed, using simple average:', err)
          }
        }

        setMetrics(smoothedMetrics)
      } catch (err) {
        console.error('Error analyzing frame:', err)
      }

      rafIdRef.current = requestAnimationFrame(analyze)
    }

    rafIdRef.current = requestAnimationFrame(analyze)

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [isRunning, videoRef])

  // Pause processing when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning) {
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current)
          rafIdRef.current = null
        }
      } else if (!document.hidden && isRunning) {
        // Resume
        rafIdRef.current = requestAnimationFrame(() => {})
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isRunning])

  return {
    metrics,
    start,
    stop,
    isRunning,
    error
  }
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

function boxFilter(values: number[], cv: any): number {
  if (values.length === 0) return 0

  try {
    // Create a Mat from the values array
    const mat = cv.matFromArray(1, values.length, cv.CV_32F, values)

    // Apply box filter (simple blur)
    const filtered = new cv.Mat()
    const ksize = new cv.Size(3, 1)
    cv.boxFilter(mat, filtered, -1, ksize)

    // Get the middle value
    const result = filtered.data32F[Math.floor(values.length / 2)]

    // Cleanup
    mat.delete()
    filtered.delete()

    return result
  } catch (err) {
    // Fallback to simple average
    return average(values)
  }
}
