/**
 * Audio recording utilities with level metering and PCM chunking.
 * Provides getUserMedia access and audio processing for interview sessions.
 */

export interface AudioRecorderOptions {
  sampleRate?: number
  onAudioLevel?: (level: number) => void
  onAudioChunk?: (chunk: Float32Array) => void
}

export class AudioRecorder {
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private analyser: AnalyserNode | null = null
  private processor: ScriptProcessorNode | null = null
  private animationFrameId: number | null = null
  private options: AudioRecorderOptions

  constructor(options: AudioRecorderOptions = {}) {
    this.options = {
      sampleRate: 16000,
      ...options
    }
  }

  /**
   * Initialize audio with microphone access
   */
  async initialize(): Promise<MediaStream> {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: this.options.sampleRate
        }
      })

      // Create audio context
      this.audioContext = new AudioContext({
        sampleRate: this.options.sampleRate
      })

      const source = this.audioContext.createMediaStreamSource(this.mediaStream)

      // Create analyser for level metering
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.3

      // Create processor for audio chunks
      this.processor = this.audioContext.createScriptProcessor(2048, 1, 1)

      this.processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0)
        const chunk = new Float32Array(inputData)

        if (this.options.onAudioChunk) {
          this.options.onAudioChunk(chunk)
        }
      }

      // Connect nodes
      source.connect(this.analyser)
      source.connect(this.processor)
      this.processor.connect(this.audioContext.destination)

      // Start level metering
      this.startMeteringLoop()

      return this.mediaStream
    } catch (error) {
      console.error('Failed to initialize audio:', error)
      throw error
    }
  }

  /**
   * Start metering loop for audio levels
   */
  private startMeteringLoop() {
    if (!this.analyser) return

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount)

    const meter = () => {
      if (!this.analyser || !this.options.onAudioLevel) return

      this.analyser.getByteFrequencyData(dataArray)

      // Calculate average level (0-1 range)
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
      const level = average / 255

      this.options.onAudioLevel(level)

      this.animationFrameId = requestAnimationFrame(meter)
    }

    meter()
  }

  /**
   * Stop recording and cleanup
   */
  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    if (this.processor) {
      this.processor.disconnect()
      this.processor = null
    }

    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }

  /**
   * Get current media stream
   */
  getStream(): MediaStream | null {
    return this.mediaStream
  }

  /**
   * Check if recording
   */
  isRecording(): boolean {
    return this.mediaStream !== null && this.mediaStream.active
  }
}

/**
 * Calculate delivery metrics from transcript and audio data
 */
export function calculateDeliveryMetrics(
  transcript: string,
  startTime: number,
  endTime: number
): { wordsPerMin: number; pauseRatio: number; fillerPerMin: number } {
  const durationMin = (endTime - startTime) / 60000  // Convert ms to minutes

  // Word count
  const words = transcript.trim().split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length
  const wordsPerMin = durationMin > 0 ? wordCount / durationMin : 0

  // Filler words detection
  const fillerWords = ['um', 'uh', 'like', 'you know', 'sort of', 'kind of', 'i mean', 'actually', 'basically']
  const fillerCount = words.filter(word =>
    fillerWords.some(filler => word.toLowerCase().includes(filler))
  ).length
  const fillerPerMin = durationMin > 0 ? fillerCount / durationMin : 0

  // Pause ratio (simplified - based on transcript gaps)
  // In real implementation, this would analyze actual audio silence
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0
  const pauseRatio = avgWordsPerSentence < 8 ? 0.3 : avgWordsPerSentence > 20 ? 0.1 : 0.2

  return {
    wordsPerMin: Math.round(wordsPerMin),
    pauseRatio: Math.round(pauseRatio * 100) / 100,
    fillerPerMin: Math.round(fillerPerMin * 10) / 10
  }
}
