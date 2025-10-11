/**
 * Interview Coach Overlay - Brief, sleek reminders to help users maintain professional presence
 * Pops up for ~1 second as a quick reminder, then auto-dismisses
 */

import { useState, useEffect, useRef } from 'react'
import { Eye, Smile, Sparkles } from 'lucide-react'

interface InterviewCoachOverlayProps {
  isLookingAtCamera: boolean
  gazeDirection: { x: number, y: number }
  expressionVariance: number
  blinkRatePerMin: number
}

interface Tip {
  id: string
  icon: React.ReactNode
  message: string
}

const TIP_DISPLAY_DURATION = 1000 // Show for 1 second
const TIP_COOLDOWN = 4000 // Wait 4 seconds before showing again

export function InterviewCoachOverlay({
  isLookingAtCamera,
  gazeDirection,
  expressionVariance,
  blinkRatePerMin
}: InterviewCoachOverlayProps) {
  const [currentTip, setCurrentTip] = useState<Tip | null>(null)
  const [showTip, setShowTip] = useState(false)
  const cooldownRef = useRef<{ [key: string]: number }>({})

  useEffect(() => {
    const now = Date.now()

    // Check eye contact first (highest priority)
    if (!isLookingAtCamera) {
      const lastShown = cooldownRef.current['eye-contact'] || 0
      if (now - lastShown > TIP_COOLDOWN) {
        showTipBriefly({
          id: 'eye-contact',
          icon: <Eye className="w-2.5 h-2.5" />,
          message: 'Look at camera'
        })
        cooldownRef.current['eye-contact'] = now
      }
      return
    }

    // Check stress level (blink rate)
    if (blinkRatePerMin > 30) {
      const lastShown = cooldownRef.current['blink-high'] || 0
      if (now - lastShown > TIP_COOLDOWN) {
        showTipBriefly({
          id: 'blink-high',
          icon: <Sparkles className="w-2.5 h-2.5" />,
          message: 'Relax'
        })
        cooldownRef.current['blink-high'] = now
      }
      return
    }

    // Check expression variance
    if (expressionVariance < 0.15) {
      const lastShown = cooldownRef.current['expression'] || 0
      if (now - lastShown > TIP_COOLDOWN) {
        showTipBriefly({
          id: 'expression',
          icon: <Smile className="w-2.5 h-2.5" />,
          message: 'Smile'
        })
        cooldownRef.current['expression'] = now
      }
    }
  }, [isLookingAtCamera, expressionVariance, blinkRatePerMin])

  const showTipBriefly = (tip: Tip) => {
    setCurrentTip(tip)
    setShowTip(true)

    // Auto-dismiss after 1 second
    setTimeout(() => {
      setShowTip(false)
      setTimeout(() => {
        setCurrentTip(null)
      }, 150)
    }, TIP_DISPLAY_DURATION)
  }

  if (!currentTip) {
    return null
  }

  return (
    <div
      className={`absolute top-2 right-2 transition-all duration-150 ease-out ${
        showTip ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{ pointerEvents: 'none' }}
    >
      <div className="px-2 py-1 rounded-md border border-primary/40 shadow-sm backdrop-blur-sm bg-primary/10 flex items-center gap-1">
        <div className="text-primary">
          {currentTip.icon}
        </div>
        <p className="text-[10px] font-medium text-foreground whitespace-nowrap">
          {currentTip.message}
        </p>
      </div>
    </div>
  )
}
