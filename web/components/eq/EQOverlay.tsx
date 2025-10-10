/**
 * EQ Overlay component to display real-time emotional intelligence metrics.
 * Shows gaze stability, blink rate, and expression variance with visual meters.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Eye, Smile } from 'lucide-react'

interface EQMetrics {
  gazeStability: number
  blinkRatePerMin: number
  expressionVariance: number
}

interface EQOverlayProps {
  metrics: EQMetrics
}

export function EQOverlay({ metrics }: EQOverlayProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Gaze Stability */}
      <Card className="glass-card border-2 hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Gaze Stability</CardTitle>
            </div>
            <span className="text-2xl font-bold text-primary">
              {(metrics.gazeStability * 100).toFixed(0)}%
            </span>
          </div>
          <CardDescription className="text-xs mt-1">
            Measures focus and confidence through eye position steadiness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out animate-meter-fill"
              style={{
                width: `${metrics.gazeStability * 100}%`,
                background: 'linear-gradient(90deg, hsl(200, 100%, 45%), hsl(175, 75%, 45%))'
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Blink Rate */}
      <Card className="glass-card border-2 hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" style={{ color: 'hsl(175, 85%, 45%)' }} />
              <CardTitle className="text-lg">Blink Rate</CardTitle>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'hsl(175, 85%, 45%)' }}>
              {metrics.blinkRatePerMin.toFixed(0)}
              <span className="text-sm text-muted-foreground ml-1">/min</span>
            </span>
          </div>
          <CardDescription className="text-xs mt-1">
            Normal range: 15-20 blinks/min · Indicates stress or concentration levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full bg-neutral-800 rounded-full h-3 overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out animate-meter-fill"
              style={{
                width: `${Math.min(100, (metrics.blinkRatePerMin / 30) * 100)}%`,
                backgroundColor: 'hsl(175, 85%, 45%)'
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Expression Variance */}
      <Card className="glass-card border-2 hover:shadow-lg transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smile className="w-5 h-5" style={{ color: 'hsl(270, 80%, 60%)' }} />
              <CardTitle className="text-lg">Expression Variance</CardTitle>
            </div>
            <span className="text-2xl font-bold" style={{ color: 'hsl(270, 80%, 60%)' }}>
              {(metrics.expressionVariance * 100).toFixed(0)}%
            </span>
          </div>
          <CardDescription className="text-xs mt-1">
            Facial expression diversity · Higher values show better engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full bg-neutral-800 rounded-full h-3 overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out animate-meter-fill"
              style={{
                width: `${metrics.expressionVariance * 100}%`,
                backgroundColor: 'hsl(270, 80%, 60%)'
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info Note */}
      <div className="p-4 rounded-lg glass-card border text-center">
        <p className="text-sm text-muted-foreground">
          These metrics provide coaching insights to help you improve your non-verbal communication
        </p>
      </div>
    </div>
  )
}
