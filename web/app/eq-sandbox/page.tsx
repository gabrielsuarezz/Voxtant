'use client'

import { useState } from 'react'
import { useWebcam } from '@/hooks/useWebcam'
import { useEQ } from '@/hooks/useEQ'
import { EQOverlay } from '@/components/eq/EQOverlay'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function EQSandboxPage() {
  const { videoRef, start: startWebcam, stop: stopWebcam, permissionState, error: webcamError } = useWebcam()
  const { metrics, start: startEQ, stop: stopEQ, isRunning, error: eqError } = useEQ(videoRef)
  const [isActive, setIsActive] = useState(false)

  const handleStart = async () => {
    try {
      await startWebcam()
      await startEQ()
      setIsActive(true)
    } catch (err) {
      console.error('Failed to start:', err)
    }
  }

  const handleStop = () => {
    stopEQ()
    stopWebcam()
    setIsActive(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
            EQ Sandbox
          </h1>
          <p className="text-lg text-slate-600">
            Test real-time emotional intelligence metrics using on-device analysis.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Video Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Live Video</CardTitle>
              <CardDescription>
                Camera feed for analysis (not recorded or transmitted)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-slate-900 rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!isActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50">
                    <p className="text-slate-300">Camera inactive</p>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {webcamError && (
                  <p className="text-sm text-red-600">{webcamError}</p>
                )}
                {eqError && (
                  <p className="text-sm text-red-600">{eqError}</p>
                )}
                {permissionState === 'denied' && (
                  <p className="text-sm text-amber-600">
                    Camera permission denied. Please enable camera access in your browser settings.
                  </p>
                )}
              </div>

              <div className="mt-6 flex gap-4">
                <Button
                  onClick={handleStart}
                  disabled={isActive}
                  className="flex-1"
                >
                  Start
                </Button>
                <Button
                  onClick={handleStop}
                  disabled={!isActive}
                  variant="outline"
                  className="flex-1"
                >
                  Stop
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* EQ Metrics */}
          <div>
            <EQOverlay metrics={metrics} />

            <Card className="mt-8">
              <CardHeader>
                <CardTitle>About EQ Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Gaze Stability</h4>
                  <p>
                    Measures how steady your eye position is. Higher stability indicates focused attention
                    and confidence. Low stability may suggest nervousness or distraction.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Blink Rate</h4>
                  <p>
                    Tracks blinks per minute. Normal range is 15-20 blinks/min. Higher rates may indicate
                    stress or fatigue, while lower rates suggest intense concentration.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Expression Variance</h4>
                  <p>
                    Measures facial expression diversity. Higher variance shows emotional expressiveness,
                    which often improves communication and engagement.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Privacy Note</h4>
              <p className="text-sm text-blue-800">
                All analysis happens in your browser. No video or images leave your device.
                Metrics are computed using MediaPipe and OpenCV.js running locally.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
