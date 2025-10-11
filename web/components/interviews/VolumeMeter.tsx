/**
 * Volume meter component for displaying audio input levels.
 * Shows real-time microphone activity during interview recording.
 */

interface VolumeMeterProps {
  level: number  // 0-1 range
  className?: string
}

export function VolumeMeter({ level, className = '' }: VolumeMeterProps) {
  // Convert 0-1 level to percentage
  const percentage = Math.min(100, Math.max(0, level * 100))

  // Determine color based on level
  const getColor = () => {
    if (percentage < 20) return 'bg-neutral-500'
    if (percentage < 50) return 'bg-primary'
    if (percentage < 80) return 'bg-primary'
    return 'bg-primary'
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-100 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm text-muted-foreground font-mono w-12 text-right">
        {Math.round(percentage)}%
      </span>
    </div>
  )
}

/**
 * Compact dot-based volume indicator
 */
interface VolumeDotsProps {
  level: number  // 0-1 range
  dotCount?: number
}

export function VolumeDots({ level, dotCount = 10 }: VolumeDotsProps) {
  const activeDots = Math.round(level * dotCount)

  return (
    <div className="flex gap-1">
      {Array.from({ length: dotCount }).map((_, i) => {
        const isActive = i < activeDots
        const opacity = isActive ? 1 : 0.2
        const color = i < dotCount * 0.6 ? 'bg-primary' : i < dotCount * 0.8 ? 'bg-teal-500' : 'bg-red-500'

        return (
          <div
            key={i}
            className={`w-1 h-4 rounded-full transition-opacity duration-100 ${color}`}
            style={{ opacity }}
          />
        )
      })}
    </div>
  )
}
