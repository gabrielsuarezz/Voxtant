/**
 * MediaPipe FaceLandmarker wrapper for EQ metrics analysis.
 * Analyzes video frames to extract gaze stability, blink rate, and expression variance.
 *
 * Model loaded from: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
 */

import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from '@mediapipe/tasks-vision'

let faceLandmarker: FaceLandmarker | null = null
let isInitializing = false
let initPromise: Promise<void> | null = null

// Rolling buffer for blink detection
const blinkHistory: boolean[] = []
const MAX_BLINK_HISTORY = 50 // ~3.3 seconds at 15 FPS

// Expression history for variance calculation
const expressionHistory: string[] = []
const MAX_EXPRESSION_HISTORY = 30 // ~2 seconds at 15 FPS

interface InitOptions {
  maxFaces?: number
  runningMode?: 'VIDEO' | 'IMAGE'
}

export async function initFaceLandmarker(opts: InitOptions = {}): Promise<void> {
  if (faceLandmarker) return
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      isInitializing = true

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      )

      faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU'
        },
        numFaces: opts.maxFaces ?? 1,
        runningMode: opts.runningMode ?? 'VIDEO',
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true
      })
    } catch (error) {
      console.error('Failed to initialize FaceLandmarker:', error)
      throw error
    } finally {
      isInitializing = false
    }
  })()

  return initPromise
}

interface EQMetrics {
  gazeStability: number      // 0..1 (1 = stable)
  blinkRatePerMin: number    // estimated blinks per minute
  expressionVariance: number // 0..1 (higher = more varied)
  isLookingAtCamera: boolean // true if user is looking at camera
  gazeDirection: { x: number, y: number } // -1..1 range, (0,0) = center/camera
}

let lastVideoTime = -1

export async function analyzeVideoFrame(videoEl: HTMLVideoElement): Promise<EQMetrics> {
  if (!faceLandmarker) {
    throw new Error('FaceLandmarker not initialized. Call initFaceLandmarker() first.')
  }

  // Skip if same frame
  if (videoEl.currentTime === lastVideoTime) {
    return {
      gazeStability: 0.5,
      blinkRatePerMin: 0,
      expressionVariance: 0,
      isLookingAtCamera: false,
      gazeDirection: { x: 0, y: 0 }
    }
  }
  lastVideoTime = videoEl.currentTime

  const results = faceLandmarker.detectForVideo(videoEl, performance.now())

  // No face detected
  if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
    return {
      gazeStability: 0,
      blinkRatePerMin: 0,
      expressionVariance: 0,
      isLookingAtCamera: false,
      gazeDirection: { x: 0, y: 0 }
    }
  }

  // Calculate gaze stability (using eye landmarks variance)
  const gazeStability = calculateGazeStability(results)

  // Detect blinks and calculate rate
  const blinkRatePerMin = calculateBlinkRate(results)

  // Calculate expression variance
  const expressionVariance = calculateExpressionVariance(results)

  // Calculate gaze direction and camera focus
  const { isLookingAtCamera, gazeDirection } = calculateGazeDirection(results)

  return {
    gazeStability,
    blinkRatePerMin,
    expressionVariance,
    isLookingAtCamera,
    gazeDirection
  }
}

function calculateGazeStability(results: FaceLandmarkerResult): number {
  const landmarks = results.faceLandmarks[0]
  if (!landmarks) return 0

  // Use eye center landmarks (indices 468-477 are eye regions in MediaPipe)
  // Simplified: use left eye center (landmark 468) and right eye center (landmark 473)
  const leftEye = landmarks[468]
  const rightEye = landmarks[473]

  if (!leftEye || !rightEye) return 0.5

  // Calculate eye center midpoint
  const eyeCenter = {
    x: (leftEye.x + rightEye.x) / 2,
    y: (leftEye.y + rightEye.y) / 2
  }

  // For now, return a simple stability metric based on y-position variance
  // In production, track this over multiple frames
  const verticalStability = 1 - Math.min(Math.abs(eyeCenter.y - 0.5), 0.3) / 0.3

  return Math.max(0, Math.min(1, verticalStability))
}

function calculateBlinkRate(results: FaceLandmarkerResult): number {
  if (!results.faceBlendshapes || results.faceBlendshapes.length === 0) {
    return 0
  }

  const blendshapes = results.faceBlendshapes[0].categories

  // Find eye closure blendshapes
  const leftEyeBlink = blendshapes.find(b => b.categoryName === 'eyeBlinkLeft')
  const rightEyeBlink = blendshapes.find(b => b.categoryName === 'eyeBlinkRight')

  const avgBlinkScore = ((leftEyeBlink?.score ?? 0) + (rightEyeBlink?.score ?? 0)) / 2

  // Detect blink (threshold at 0.5)
  const isBlink = avgBlinkScore > 0.5

  blinkHistory.push(isBlink)
  if (blinkHistory.length > MAX_BLINK_HISTORY) {
    blinkHistory.shift()
  }

  // Count blinks in history (detect rising edges)
  let blinkCount = 0
  for (let i = 1; i < blinkHistory.length; i++) {
    if (blinkHistory[i] && !blinkHistory[i - 1]) {
      blinkCount++
    }
  }

  // Convert to blinks per minute
  const secondsCovered = blinkHistory.length / 15 // Assuming 15 FPS
  const blinkRatePerMin = secondsCovered > 0 ? (blinkCount / secondsCovered) * 60 : 0

  return blinkRatePerMin
}

function calculateExpressionVariance(results: FaceLandmarkerResult): number {
  if (!results.faceBlendshapes || results.faceBlendshapes.length === 0) {
    return 0
  }

  const blendshapes = results.faceBlendshapes[0].categories

  // Find dominant expression (simplified categorical approach)
  const expressionBlendshapes = [
    'mouthSmileLeft',
    'mouthSmileRight',
    'mouthFrownLeft',
    'mouthFrownRight',
    'browDownLeft',
    'browDownRight',
    'browInnerUp'
  ]

  let dominantExpression = 'neutral'
  let maxScore = 0.3 // Threshold for expression

  for (const name of expressionBlendshapes) {
    const blend = blendshapes.find(b => b.categoryName === name)
    if (blend && blend.score > maxScore) {
      maxScore = blend.score
      dominantExpression = name
    }
  }

  expressionHistory.push(dominantExpression)
  if (expressionHistory.length > MAX_EXPRESSION_HISTORY) {
    expressionHistory.shift()
  }

  // Calculate variance as ratio of unique expressions
  const uniqueExpressions = new Set(expressionHistory).size
  const variance = expressionHistory.length > 0
    ? (uniqueExpressions - 1) / Math.min(expressionHistory.length, 5) // Normalize to 0..1
    : 0

  return Math.max(0, Math.min(1, variance))
}

function calculateGazeDirection(results: FaceLandmarkerResult): { isLookingAtCamera: boolean, gazeDirection: { x: number, y: number } } {
  const landmarks = results.faceLandmarks[0]
  if (!landmarks) {
    return { isLookingAtCamera: false, gazeDirection: { x: 0, y: 0 } }
  }

  // Use iris landmarks for accurate gaze tracking
  // MediaPipe iris landmarks: left iris center (468-473), right iris center (473-478)
  // Eye corner landmarks: left eye (33, 133), right eye (362, 263)

  // Left eye analysis
  const leftEyeInner = landmarks[133]  // Left eye inner corner
  const leftEyeOuter = landmarks[33]   // Left eye outer corner
  const leftIrisCenter = landmarks[468] // Left iris center

  // Right eye analysis
  const rightEyeInner = landmarks[362] // Right eye inner corner
  const rightEyeOuter = landmarks[263] // Right eye outer corner
  const rightIrisCenter = landmarks[473] // Right iris center

  if (!leftIrisCenter || !rightIrisCenter || !leftEyeInner || !leftEyeOuter || !rightEyeInner || !rightEyeOuter) {
    return { isLookingAtCamera: false, gazeDirection: { x: 0, y: 0 } }
  }

  // Calculate iris position relative to eye corners (normalized -1 to 1)
  // Left eye: calculate how far iris is from center of eye
  const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x)
  const leftEyeCenter = (leftEyeOuter.x + leftEyeInner.x) / 2
  const leftGazeX = leftEyeWidth > 0 ? (leftIrisCenter.x - leftEyeCenter) / (leftEyeWidth / 2) : 0

  // Right eye: calculate how far iris is from center of eye
  const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x)
  const rightEyeCenter = (rightEyeOuter.x + rightEyeInner.x) / 2
  const rightGazeX = rightEyeWidth > 0 ? (rightIrisCenter.x - rightEyeCenter) / (rightEyeWidth / 2) : 0

  // Average the two eyes for final gaze direction
  const gazeX = (leftGazeX + rightGazeX) / 2

  // Calculate vertical gaze (simplified using eye height)
  const eyeCenterY = (leftIrisCenter.y + rightIrisCenter.y) / 2
  const expectedCenterY = 0.5 // Expected center when looking at camera
  const gazeY = (eyeCenterY - expectedCenterY) * 2 // Normalize to -1..1

  // Determine if looking at camera (within threshold)
  const GAZE_THRESHOLD = 0.25 // If gaze is within ±0.25 of center, consider it "looking at camera"
  const isLookingAtCamera = Math.abs(gazeX) < GAZE_THRESHOLD && Math.abs(gazeY) < GAZE_THRESHOLD

  return {
    isLookingAtCamera,
    gazeDirection: {
      x: Math.max(-1, Math.min(1, gazeX)), // Clamp to -1..1
      y: Math.max(-1, Math.min(1, gazeY))  // Clamp to -1..1
    }
  }
}
