'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWebcam } from '@/hooks/useWebcam'
import { useEQ } from '@/hooks/useEQ'
import { EQOverlay } from '@/components/eq/EQOverlay'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/ui/logo'
import { Play, Square, Eye, Activity, Shield, ArrowLeft } from 'lucide-react'

export default function EQSandboxPage() {
  const router = useRouter()
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
    <main className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between animate-fade-in">
          <Button variant="outline" onClick={() => router.push('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Home
          </Button>
          <Logo size="sm" showText={true} />
        </div>

        {/* Title */}
        <div className="mb-10 text-center animate-slide-up">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            <span className="gradient-text">EQ Metrics Sandbox</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Test real-time emotional intelligence analysis using advanced computer vision
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Video Preview */}
          <div className="animate-scale-in">
            <Card className="glass-card border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Live Camera Feed
                </CardTitle>
                <CardDescription>
                  All processing happens in-browser - nothing is recorded or sent anywhere
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl overflow-hidden aspect-video border-2 border-neutral-700">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!isActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/70 backdrop-blur-sm">
                      <Activity className="w-12 h-12 text-neutral-400 mb-3" />
                      <p className="text-neutral-300 font-medium">Camera inactive</p>
                      <p className="text-neutral-400 text-sm mt-1">Click Start to begin analysis</p>
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/90 backdrop-blur-sm animate-pulse">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <span className="text-white text-sm font-medium">Live</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {webcamError && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive font-medium">{webcamError}</p>
                    </div>
                  )}
                  {eqError && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive font-medium">{eqError}</p>
                    </div>
                  )}
                  {permissionState === 'denied' && (
                    <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="text-sm text-foreground">
                        Camera permission denied. Please enable camera access in your browser settings.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleStart}
                    disabled={isActive}
                    className="gap-2 h-12"
                    size="lg"
                  >
                    <Play className="w-4 h-4" />
                    Start
                  </Button>
                  <Button
                    onClick={handleStop}
                    disabled={!isActive}
                    variant="outline"
                    className="gap-2 h-12"
                    size="lg"
                  >
                    <Square className="w-4 h-4" />
                    Stop
                  </Button>
                </div>

                {/* Privacy Note */}
                <div className="mt-6 p-4 rounded-lg glass-card border flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Privacy First</h4>
                    <p className="text-xs text-muted-foreground">
                      All analysis runs locally in your browser using MediaPipe and OpenCV.js.
                      No video or images leave your device.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
