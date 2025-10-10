/**
 * Singleton utility to load OpenCV.js from CDN.
 * Only loads once and returns the same promise for subsequent calls.
 */

interface OpenCVResult {
  available: boolean
  cv?: any
}

let loadPromise: Promise<OpenCVResult> | null = null

export function loadOpenCV(): Promise<OpenCVResult> {
  if (loadPromise) {
    return loadPromise
  }

  loadPromise = new Promise<OpenCVResult>((resolve) => {
    // Check if OpenCV is already loaded
    if (typeof window !== 'undefined' && (window as any).cv) {
      const cv = (window as any).cv
      if (cv.Mat) {
        resolve({ available: true, cv })
        return
      }
    }

    // Create script element
    const script = document.createElement('script')
    script.src = 'https://docs.opencv.org/4.x/opencv.js'
    script.async = true

    // Set up timeout for loading failure
    const timeout = setTimeout(() => {
      console.warn('OpenCV.js loading timeout')
      resolve({ available: false })
    }, 30000) // 30 second timeout

    // Handle successful load
    script.onload = () => {
      // Poll for cv.ready
      const checkReady = () => {
        if (typeof window !== 'undefined' && (window as any).cv?.Mat) {
          clearTimeout(timeout)
          resolve({ available: true, cv: (window as any).cv })
        } else {
          setTimeout(checkReady, 100)
        }
      }
      checkReady()
    }

    // Handle load error
    script.onerror = () => {
      clearTimeout(timeout)
      console.error('Failed to load OpenCV.js')
      resolve({ available: false })
    }

    // Append script to document
    if (typeof document !== 'undefined') {
      document.head.appendChild(script)
    } else {
      resolve({ available: false })
    }
  })

  return loadPromise
}
