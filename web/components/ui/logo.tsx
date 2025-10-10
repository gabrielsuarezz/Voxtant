import React from 'react'
import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
  clickable?: boolean
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-5xl',
}

export function Logo({ size = 'md', className = '', showText = true, clickable = true }: LogoProps) {
  const logoContent = (
    <div className={`flex items-center gap-3 ${clickable ? 'cursor-pointer transition-transform hover:scale-105 duration-200' : ''} ${className}`}>
      {/* Voice waveform icon */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Background circle with gradient */}
          <defs>
            <linearGradient id="voxtant-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(200, 100%, 45%)" />
              <stop offset="50%" stopColor="hsl(175, 75%, 45%)" />
              <stop offset="100%" stopColor="hsl(270, 65%, 55%)" />
            </linearGradient>
          </defs>

          {/* Circular background */}
          <circle
            cx="32"
            cy="32"
            r="30"
            fill="url(#voxtant-gradient)"
            opacity="0.1"
          />

          {/* Voice waveform bars - representing audio/voice */}
          <g className="animate-pulse">
            {/* Center bar - tallest */}
            <rect
              x="28"
              y="16"
              width="8"
              height="32"
              rx="4"
              fill="url(#voxtant-gradient)"
            />

            {/* Left bars */}
            <rect
              x="18"
              y="22"
              width="6"
              height="20"
              rx="3"
              fill="url(#voxtant-gradient)"
              opacity="0.8"
            />
            <rect
              x="9"
              y="26"
              width="5"
              height="12"
              rx="2.5"
              fill="url(#voxtant-gradient)"
              opacity="0.6"
            />

            {/* Right bars */}
            <rect
              x="40"
              y="22"
              width="6"
              height="20"
              rx="3"
              fill="url(#voxtant-gradient)"
              opacity="0.8"
            />
            <rect
              x="50"
              y="26"
              width="5"
              height="12"
              rx="2.5"
              fill="url(#voxtant-gradient)"
              opacity="0.6"
            />
          </g>
        </svg>
      </div>

      {/* Text logo */}
      {showText && (
        <span className={`font-bold tracking-tight gradient-text ${textSizeClasses[size]}`}>
          Voxtant
        </span>
      )}
    </div>
  )

  // Wrap in Link if clickable
  if (clickable) {
    return (
      <Link href="/" aria-label="Go to home page">
        {logoContent}
      </Link>
    )
  }

  return logoContent
}
