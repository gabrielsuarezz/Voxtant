'use client'

import { useEffect, useRef } from 'react'

/**
 * Animated Background with Sound Waves
 * Creates a dynamic, subtle animation in the background
 * Following 2025 best practices with Canvas API and requestAnimationFrame
 */
export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Animation variables
    let animationFrameId: number
    let time = 0

    // Wave parameters
    const waves = [
      { amplitude: 30, frequency: 0.002, speed: 0.005, offset: 0, color: 'rgba(10, 132, 255, 0.03)' },      // Electric blue
      { amplitude: 25, frequency: 0.0025, speed: 0.007, offset: 100, color: 'rgba(10, 186, 181, 0.025)' },  // Teal
      { amplitude: 20, frequency: 0.003, speed: 0.006, offset: 200, color: 'rgba(168, 85, 247, 0.02)' },    // Purple
    ]

    // Draw function
    const draw = () => {
      // Clear with fade effect for trail
      ctx.fillStyle = 'rgba(19, 21, 26, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw each wave
      waves.forEach((wave) => {
        ctx.beginPath()
        ctx.strokeStyle = wave.color
        ctx.lineWidth = 2
        ctx.lineCap = 'round'

        // Draw wave across canvas
        for (let x = 0; x < canvas.width; x += 2) {
          const y =
            canvas.height / 2 +
            Math.sin(x * wave.frequency + time * wave.speed + wave.offset) * wave.amplitude +
            Math.sin(x * wave.frequency * 2 + time * wave.speed * 1.5) * (wave.amplitude / 2)

          if (x === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.stroke()
      })

      time++
      animationFrameId = requestAnimationFrame(draw)
    }

    // Start animation
    draw()

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
      aria-hidden="true"
    />
  )
}
