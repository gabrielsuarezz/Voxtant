'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAudioStream } from '@/hooks/useAudioStream'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/ui/logo'
import { Mic, MicOff, Phone, PhoneOff, ArrowLeft, Radio, Shield } from 'lucide-react'

interface JobData {
  raw_text: string
  title: string
  source: string
  role: string
  skills_core: string[]
  skills_nice: string[]
  values: string[]
  requirements: string[]
}

export default function InterviewPage() {
  const router = useRouter()
  const { connect, disconnect, connectionState, error, isSpeaking } = useAudioStream()
  const [isActive, setIsActive] = useState(false)
  const [jobData, setJobData] = useState<JobData | null>(null)

  useEffect(() => {
    // Load job data from sessionStorage
    const data = sessionStorage.getItem('jobData')
    if (data) {
      setJobData(JSON.parse(data))
    }
  }, [])

  const handleStart = async () => {
    try {
      await connect(jobData)
      setIsActive(true)
    } catch (err) {
      console.error('Failed to start interview:', err)
    }
  }

  const handleStop = () => {
    disconnect()
    setIsActive(false)
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between animate-fade-in">
          <Button variant="outline" onClick={() => router.push('/plan')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Plan
          </Button>
          <Logo size="sm" showText={true} />
        </div>

        {/* Title */}
        <div className="mb-10 text-center animate-slide-up">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            <span className="gradient-text">Live Interview Practice</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Practice with an AI interviewer in real-time conversation
          </p>
        </div>

        {/* Main Interview Card */}
        <div className="animate-scale-in">
          <Card className="glass-card border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-primary" />
                Audio Interview Session
              </CardTitle>
              <CardDescription>
                Speak naturally with the AI interviewer - your responses will be evaluated in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Connection Status */}
              <div className="relative bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-xl overflow-hidden aspect-video border-2 border-neutral-700 flex flex-col items-center justify-center">
                {connectionState === 'disconnected' && (
                  <div className="text-center">
                    <Mic className="w-16 h-16 text-neutral-400 mb-4 mx-auto" />
                    <p className="text-neutral-300 font-medium text-lg">Ready to start</p>
                    <p className="text-neutral-400 text-sm mt-2">Click Start Interview to begin</p>
                  </div>
                )}

                {connectionState === 'connecting' && (
                  <div className="text-center">
                    <div className="relative">
                      <Radio className="w-16 h-16 text-primary animate-pulse mb-4 mx-auto" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                      </div>
                    </div>
                    <p className="text-neutral-300 font-medium text-lg">Connecting...</p>
                    <p className="text-neutral-400 text-sm mt-2">Setting up audio stream</p>
                  </div>
                )}

                {connectionState === 'connected' && (
                  <div className="text-center">
                    <div className="relative mb-4">
                      {isSpeaking ? (
                        <Mic className="w-16 h-16 text-green-500 mx-auto" />
                      ) : (
                        <Mic className="w-16 h-16 text-primary mx-auto" />
                      )}
                      {isSpeaking && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 bg-green-500/20 rounded-full animate-ping"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-green-400 font-medium text-lg flex items-center gap-2 justify-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      Interview Active
                    </p>
                    <p className="text-neutral-400 text-sm mt-2">
                      {isSpeaking ? 'Listening...' : 'Speak to answer questions'}
                    </p>
                  </div>
                )}

                {connectionState === 'error' && (
                  <div className="text-center">
                    <MicOff className="w-16 h-16 text-red-400 mb-4 mx-auto" />
                    <p className="text-red-400 font-medium text-lg">Connection Error</p>
                    <p className="text-neutral-400 text-sm mt-2">Please try again</p>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              {/* Controls */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Button
                  onClick={handleStart}
                  disabled={isActive || connectionState === 'connecting'}
                  className="gap-2 h-12"
                  size="lg"
                >
                  <Phone className="w-4 h-4" />
                  Start Interview
                </Button>
                <Button
                  onClick={handleStop}
                  disabled={!isActive}
                  variant="destructive"
                  className="gap-2 h-12"
                  size="lg"
                >
                  <PhoneOff className="w-4 h-4" />
                  End Interview
                </Button>
              </div>

              {/* Privacy Note */}
              <div className="mt-6 p-4 rounded-lg glass-card border flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm mb-1">Secure Connection</h4>
                  <p className="text-xs text-muted-foreground">
                    Audio is transmitted securely via WebSocket. Your responses are used only for interview practice and evaluation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tips Card */}
        <Card className="mt-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle>Interview Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Use the STAR Method</h4>
              <p>
                Structure behavioral answers with Situation, Task, Action, and Result to provide clear, compelling responses.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Speak Clearly</h4>
              <p>
                Take your time and articulate your thoughts. The AI will wait for you to finish before responding.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Be Specific</h4>
              <p>
                Provide concrete examples and details. Mention specific technologies, metrics, and outcomes when possible.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Ask Questions</h4>
              <p>
                Feel free to ask the interviewer to clarify questions or provide more context. This shows engagement.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
