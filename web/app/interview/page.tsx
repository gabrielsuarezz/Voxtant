'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useInterviewStore } from '@/store/interview-store'
import { useWebcam } from '@/hooks/useWebcam'
import { useEQ } from '@/hooks/useEQ'
import { EQOverlay } from '@/components/eq/EQOverlay'
import { VolumeMeter } from '@/components/interviews/VolumeMeter'
import { InterviewCoachOverlay } from '@/components/interviews/InterviewCoachOverlay'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/ui/logo'
import { ArrowLeft, Mic, Square, CheckCircle, Loader2, Target } from 'lucide-react'
import { AudioRecorder, calculateDeliveryMetrics } from '@/lib/audio/recorder'
import { gradeAnswer } from '@/lib/api-client'
import type { GradeAnswerResponse } from '@/lib/api-client'

export default function InterviewPage() {
  const router = useRouter()
  const { plan, jobGraph, currentQuestionId, setCurrentQuestion } = useInterviewStore()
  const { videoRef, start: startWebcam, stop: stopWebcam } = useWebcam()
  const { metrics: eqMetrics, start: startEQ, stop: stopEQ } = useEQ(videoRef)

  const [audioLevel, setAudioLevel] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [startTime, setStartTime] = useState(0)
  const [grades, setGrades] = useState<Record<string, GradeAnswerResponse>>({})
  const [isGrading, setIsGrading] = useState(false)
  const [expandedRubric, setExpandedRubric] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)
  const [gradingError, setGradingError] = useState<string | null>(null)
  const [isListening, setIsListening] = useState(false)

  const audioRecorder = useRef<AudioRecorder | null>(null)
  const recognitionRef = useRef<any>(null)
  const isRecordingRef = useRef(false)

  // Redirect if no plan
  useEffect(() => {
    if (!plan || !jobGraph) {
      router.push('/plan')
      return
    }

    // Set first question as current
    if (!currentQuestionId && plan.questions.length > 0) {
      setCurrentQuestion(plan.questions[0].id)
    }
  }, [plan, jobGraph, currentQuestionId, setCurrentQuestion, router])

  // Initialize camera and EQ (separate effect to avoid re-running)
  useEffect(() => {
    const initializeEQ = async () => {
      try {
        console.log('Starting webcam and EQ...')
        await startWebcam()
        await startEQ()
        console.log('Webcam and EQ started successfully')
      } catch (err) {
        console.error('Failed to start EQ:', err)
      }
    }
    initializeEQ()

    return () => {
      console.log('Cleaning up webcam and EQ')
      stopWebcam()
      stopEQ()
    }
  }, []) // Empty deps - only run once on mount

  // Initialize audio and speech recognition (separate effect)
  useEffect(() => {
    // Initialize audio recorder
    audioRecorder.current = new AudioRecorder({
      onAudioLevel: setAudioLevel
    })

    // Initialize Web Speech API for transcription
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started')
        setIsListening(true)
        setSpeechError(null)
      }

      recognitionRef.current.onend = () => {
        console.log('Speech recognition ended')
        setIsListening(false)

        // Auto-restart if still recording (common Web Speech API behavior)
        if (isRecordingRef.current && recognitionRef.current) {
          console.log('Auto-restarting speech recognition...')
          try {
            recognitionRef.current.start()
          } catch (e) {
            console.error('Failed to restart recognition:', e)
          }
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setSpeechError(`Speech recognition error: ${event.error}`)
        setIsListening(false)
      }

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' '
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript)
        }
      }
    } else {
      setSpeechError('Web Speech API not supported in this browser. Please use Chrome or Edge.')
    }

    return () => {
      audioRecorder.current?.stop()
      recognitionRef.current?.stop()
    }
  }, []) // Empty deps - only run once on mount

  const currentQuestion = plan?.questions.find(q => q.id === currentQuestionId)
  const currentRubric = currentQuestion ? plan.rubric[currentQuestion.id] : []

  const handleStartAnswer = async () => {
    try {
      await audioRecorder.current?.initialize()
      setIsRecording(true)
      isRecordingRef.current = true
      setTranscript('')
      setStartTime(Date.now())

      // Start speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start()
          console.log('Attempting to start speech recognition...')
        } catch (error) {
          console.error('Error starting recognition:', error)
          setSpeechError('Failed to start speech recognition. Please check microphone permissions.')
        }
      } else {
        setSpeechError('Speech recognition not available')
      }
    } catch (error) {
      console.error('Failed to start recording:', error)
      setSpeechError('Failed to initialize audio recorder')
    }
  }

  const handleStopAnswer = () => {
    audioRecorder.current?.stop()
    recognitionRef.current?.stop()
    setIsRecording(false)
    isRecordingRef.current = false
  }

  const handleFinishAnswer = async () => {
    if (!currentQuestion || !jobGraph) {
      console.error('Missing question or job graph')
      setGradingError('Missing question or job data. Please try refreshing the page.')
      return
    }

    console.log('Finishing answer and grading...', {
      questionId: currentQuestion.id,
      transcriptLength: transcript.length,
      transcript: transcript.substring(0, 100) + '...'
    })

    handleStopAnswer()
    setIsGrading(true)
    setGradingError(null)

    try {
      const endTime = Date.now()
      const deliveryMetrics = calculateDeliveryMetrics(transcript, startTime, endTime)

      console.log('Calling gradeAnswer API with:', {
        qid: currentQuestion.id,
        transcriptLength: transcript.length,
        deliveryMetrics,
        eqMetrics,
        jobGraphRole: jobGraph.role
      })

      const grade = await gradeAnswer(
        currentQuestion.id,
        transcript,
        deliveryMetrics,
        eqMetrics,
        jobGraph
      )

      console.log('Received grade:', grade)
      setGrades(prev => {
        const newGrades = { ...prev, [currentQuestion.id]: grade }
        console.log('Updated grades:', newGrades)
        return newGrades
      })
    } catch (error) {
      console.error('Failed to grade answer:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setGradingError(`Failed to grade answer: ${errorMessage}. Please check that the API server is running at http://localhost:8000`)
    } finally {
      setIsGrading(false)
    }
  }

  const handleNextQuestion = () => {
    if (!plan) return

    const currentIndex = plan.questions.findIndex(q => q.id === currentQuestionId)
    if (currentIndex < plan.questions.length - 1) {
      // Move to next question
      setCurrentQuestion(plan.questions[currentIndex + 1].id)
      setTranscript('')
      setSpeechError(null)
      setGradingError(null)
      setExpandedRubric(false)
      // Keep previous grades for review
    } else {
      // All questions done - return to plan page
      router.push('/plan')
    }
  }

  const currentGrade = currentQuestion ? grades[currentQuestion.id] : null

  if (!plan || !jobGraph || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between animate-fade-in">
          <Button variant="outline" onClick={() => router.push('/plan')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Plan
          </Button>
          <Logo size="sm" showText={true} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Question & Rubric */}
          <div className="lg:col-span-1">
            <Card className="glass-card border-2 mb-4">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={
                    currentQuestion.type === 'behavioral'
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'border-2'
                  } style={
                    currentQuestion.type === 'technical'
                      ? {
                          borderColor: 'hsl(175, 85%, 45%)',
                          color: 'hsl(175, 85%, 45%)',
                          backgroundColor: 'hsl(175, 85%, 45%, 0.1)'
                        }
                      : {}
                  }>
                    {currentQuestion.type}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Question {plan.questions.findIndex(q => q.id === currentQuestionId) + 1} of {plan.questions.length}
                  </span>
                </div>
                <CardTitle className="text-lg">{currentQuestion.text}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedRubric(!expandedRubric)}
                  className="mb-3 w-full"
                >
                  {expandedRubric ? 'Hide' : 'Show'} Rubric
                </Button>
                {expandedRubric && currentRubric && (
                  <div className="glass-card p-4 rounded-lg border">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Evaluation Criteria
                    </h4>
                    <ul className="space-y-2">
                      {currentRubric.map((criterion, i) => (
                        <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                          <span className="text-primary mt-1">✓</span>
                          <span>{criterion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Camera Feed & EQ Metrics */}
            <div className="space-y-4">
              <Card className="glass-card border-2">
                <CardHeader>
                  <CardTitle className="text-sm">Camera Feed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-neutral-900 rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Live indicator */}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-red-500/90 rounded-full text-xs text-white flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      Live
                    </div>

                    {/* Coaching overlay - gentle reminders */}
                    <InterviewCoachOverlay
                      isLookingAtCamera={eqMetrics.isLookingAtCamera}
                      gazeDirection={eqMetrics.gazeDirection}
                      expressionVariance={eqMetrics.expressionVariance}
                      blinkRatePerMin={eqMetrics.blinkRatePerMin}
                    />
                  </div>
                </CardContent>
              </Card>

              <EQOverlay metrics={eqMetrics} />
            </div>
          </div>

          {/* Center: Transcript & Controls */}
          <div className="lg:col-span-2">
            <Card className="glass-card border-2 mb-4">
              <CardHeader>
                <CardTitle>Your Answer</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {isRecording ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      Recording... Speak your answer
                      {isListening && <span className="text-primary">(Listening...)</span>}
                    </>
                  ) : (
                    'Click "Start Answer" to begin'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Speech Recognition Error Display */}
                {speechError && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive font-semibold">Transcription Error:</p>
                    <p className="text-sm text-destructive">{speechError}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Make sure you're using Chrome or Edge and have granted microphone permissions.
                    </p>
                  </div>
                )}

                {/* Grading Error Display */}
                {gradingError && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive font-semibold">Grading Error:</p>
                    <p className="text-sm text-destructive">{gradingError}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Check the browser console (F12) for more details.
                    </p>
                  </div>
                )}

                {/* Transcript Display */}
                <div className="mb-4 p-4 bg-neutral-900 rounded-lg min-h-[200px] max-h-[300px] overflow-y-auto">
                  {transcript ? (
                    <p className="text-foreground/90 whitespace-pre-wrap">{transcript}</p>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[180px] text-muted-foreground">
                      <Mic className="w-12 h-12 mb-3 opacity-50" />
                      <p>Your transcript will appear here...</p>
                      {isRecording && (
                        <p className="text-sm mt-2">Start speaking to see your words transcribed</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Audio Level Meter */}
                {isRecording && (
                  <div className="mb-4">
                    <VolumeMeter level={audioLevel} />
                  </div>
                )}

                {/* Controls */}
                <div className="grid grid-cols-2 gap-3">
                  {!isRecording ? (
                    <Button
                      onClick={handleStartAnswer}
                      className="gap-2 h-12"
                      size="lg"
                    >
                      <Mic className="w-4 h-4" />
                      Start Answer
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStopAnswer}
                      variant="outline"
                      className="gap-2 h-12"
                      size="lg"
                    >
                      <Square className="w-4 h-4" />
                      Stop Recording
                    </Button>
                  )}

                  <Button
                    onClick={handleFinishAnswer}
                    disabled={!transcript.trim() || isRecording || isGrading}
                    className="gap-2 h-12"
                    size="lg"
                    variant="default"
                  >
                    {isGrading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Grading...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Finish & Grade</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Debug Info (remove in production) */}
            {process.env.NODE_ENV === 'development' && (
              <Card className="glass-card border-2 border-yellow-500/50 mb-4">
                <CardHeader>
                  <CardTitle className="text-sm text-yellow-500">Debug Info</CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div>Transcript length: {transcript.length} chars</div>
                  <div>Is recording: {isRecording ? 'Yes' : 'No'}</div>
                  <div>Is grading: {isGrading ? 'Yes' : 'No'}</div>
                  <div>Has grade: {currentGrade ? 'Yes' : 'No'}</div>
                  <div>EQ Metrics: gaze={eqMetrics.gazeStability.toFixed(2)}, blink={eqMetrics.blinkRatePerMin.toFixed(1)}, expr={eqMetrics.expressionVariance.toFixed(2)}</div>
                  {speechError && (
                    <div className="text-yellow-500">Speech Error: {speechError}</div>
                  )}
                  {gradingError && (
                    <div className="text-red-500 font-semibold">Grading Error: {gradingError}</div>
                  )}
                  <div className="text-blue-400 mt-2">
                    API URL: {process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Grading Results */}
            {currentGrade && (
              <Card className="glass-card border-2 animate-slide-up">
                <CardHeader>
                  <CardTitle>Feedback & Scoring</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Scores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground mb-1">Content Relevance</div>
                      <div className="text-2xl font-bold text-primary">
                        {Math.round(currentGrade.content_score * 100)}%
                      </div>
                    </div>
                    <div className="glass-card p-4 rounded-lg border">
                      <div className="text-sm text-muted-foreground mb-1">STAR Framework</div>
                      <div className="flex gap-2">
                        <div className="text-xs">
                          <div className="text-muted-foreground">S</div>
                          <div className="font-bold">{Math.round(currentGrade.star.S * 100)}%</div>
                        </div>
                        <div className="text-xs">
                          <div className="text-muted-foreground">T</div>
                          <div className="font-bold">{Math.round(currentGrade.star.T * 100)}%</div>
                        </div>
                        <div className="text-xs">
                          <div className="text-muted-foreground">A</div>
                          <div className="font-bold">{Math.round(currentGrade.star.A * 100)}%</div>
                        </div>
                        <div className="text-xs">
                          <div className="text-muted-foreground">R</div>
                          <div className="font-bold">{Math.round(currentGrade.star.R * 100)}%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tips */}
                  {currentGrade.tips.length > 0 && (
                    <div className="glass-card p-4 rounded-lg border">
                      <h4 className="font-semibold mb-3">💡 Tips to Improve</h4>
                      <ul className="space-y-2">
                        {currentGrade.tips.map((tip, i) => (
                          <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                            <span className="text-primary mt-1">→</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Next Question Button */}
                  <Button
                    onClick={handleNextQuestion}
                    className="w-full h-12"
                    size="lg"
                  >
                    {plan.questions.findIndex(q => q.id === currentQuestionId) < plan.questions.length - 1
                      ? 'Next Question →'
                      : 'Finish Interview'
                    }
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
