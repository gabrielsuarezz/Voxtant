/**
 * EQ Overlay component to display real-time emotional intelligence metrics.
 * Shows gaze stability, blink rate, and expression variance with visual meters.
 */

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
    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">
        EQ Metrics
      </h3>

      <div className="space-y-4">
        {/* Gaze Stability */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-slate-700">
              Gaze Stability
            </label>
            <span className="text-sm text-slate-600">
              {(metrics.gazeStability * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${metrics.gazeStability * 100}%` }}
            />
          </div>
        </div>

        {/* Blink Rate */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-slate-700">
              Blink Rate
            </label>
            <span className="text-sm text-slate-600">
              {metrics.blinkRatePerMin.toFixed(0)} /min
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div
              className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (metrics.blinkRatePerMin / 30) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">Normal: 15-20 blinks/min</p>
        </div>

        {/* Expression Variance */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-slate-700">
              Expression Variance
            </label>
            <span className="text-sm text-slate-600">
              {(metrics.expressionVariance * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div
              className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${metrics.expressionVariance * 100}%` }}
            />
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-slate-500 italic border-t border-slate-200 pt-4">
        These metrics are for coaching, not judgment. They help you understand your non-verbal communication patterns.
      </p>
    </div>
  )
}
