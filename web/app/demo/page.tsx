'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { extractRequirements, generatePlan, type ExtractRequirementsResponse, type GeneratePlanResponse } from '@/lib/api-client'
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react'

const SAMPLE_JOB_TEXT = `Senior Full-Stack Engineer

We're seeking a talented Senior Full-Stack Engineer to join our dynamic team. You'll work on building scalable web applications using modern technologies.

Requirements:
- 5+ years of experience in full-stack development
- Strong proficiency in React, TypeScript, Node.js, and Python
- Experience with PostgreSQL and REST API design
- Excellent communication and teamwork skills
- Passion for building maintainable, scalable systems

Nice to have:
- GraphQL, Docker, AWS experience
- CI/CD pipeline knowledge
- Agile/Scrum experience

We value collaboration, innovation, and user-centric design. Join us to make an impact!`

type Step = 1 | 2 | 3 | 4

export default function DemoPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [jobText, setJobText] = useState('')
  const [extracted, setExtracted] = useState<ExtractRequirementsResponse | null>(null)
  const [plan, setPlan] = useState<GeneratePlanResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [interviewStarted, setInterviewStarted] = useState(false)
  const [transcript, setTranscript] = useState<string[]>([])
  const [mockEQ, setMockEQ] = useState({ gaze: 0.82, blink: 18, expression: 0.65 })

  const useSampleData = () => {
    setJobText(SAMPLE_JOB_TEXT)
  }

  const handleExtract = async () => {
    if (!jobText.trim()) return

    setIsLoading(true)
    try {
      const result = await extractRequirements(jobText, true)
      setExtracted(result)
      setCurrentStep(2)
    } catch (error) {
      console.error('Extract failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeneratePlan = async () => {
    if (!extracted) return

    setIsLoading(true)
    try {
      const result = await generatePlan(extracted, undefined, true)
      setPlan(result)
      setCurrentStep(3)
    } catch (error) {
      console.error('Plan generation failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartInterview = () => {
    setCurrentStep(4)
    setInterviewStarted(true)

    setTimeout(() => {
      setTranscript(prev => [...prev, 'Q: Tell me about a time when you had to architect a complex full-stack feature from scratch.'])
    }, 500)

    setTimeout(() => {
      setTranscript(prev => [...prev, 'A: In my previous role, I architected a real-time notification system using WebSockets...'])
    }, 2000)

    setTimeout(() => {
      setTranscript(prev => [...prev, '[Analysis] Strong technical depth, clear context provided.'])
    }, 4000)

    // Simulate EQ metrics changing
    const interval = setInterval(() => {
      setMockEQ({
        gaze: 0.75 + Math.random() * 0.2,
        blink: 15 + Math.floor(Math.random() * 8),
        expression: 0.6 + Math.random() * 0.3
      })
    }, 2000)

    setTimeout(() => clearInterval(interval), 10000)
  }

  const resetDemo = () => {
    setCurrentStep(1)
    setJobText('')
    setExtracted(null)
    setPlan(null)
    setIsLoading(false)
    setInterviewStarted(false)
    setTranscript([])
    setMockEQ({ gaze: 0.82, blink: 18, expression: 0.65 })
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-slate-900">Voxtant Demo</h1>
            <Button variant="outline" onClick={resetDemo}>
              Reset Demo
            </Button>
          </div>
          <p className="text-slate-600">
            Experience the complete interview preparation workflow
          </p>
        </div>

        {/* Progress Indicators */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  currentStep >= step
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {currentStep > step ? <CheckCircle2 className="w-5 h-5" /> : step}
              </div>
              {step < 4 && (
                <ArrowRight
                  className={`w-6 h-6 mx-2 ${
                    currentStep > step ? 'text-primary' : 'text-slate-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Step 1: Ingest */}
          <Card className={`animate-fade-in ${currentStep === 1 ? 'ring-2 ring-primary' : 'opacity-60'}`}>
            <CardHeader>
              <CardTitle>1. Ingest Job Posting</CardTitle>
              <CardDescription>Paste a job description to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[200px] p-3 border rounded-md text-sm mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Paste job posting text here..."
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                disabled={currentStep > 1}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={useSampleData}
                  disabled={currentStep > 1}
                  className="flex-1"
                >
                  Use Sample Job
                </Button>
                <Button
                  onClick={handleExtract}
                  disabled={!jobText.trim() || isLoading || currentStep > 1}
                  className="flex-1"
                >
                  {isLoading && currentStep === 1 ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Extract Requirements'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Preview */}
          <Card className={`animate-fade-in ${currentStep === 2 ? 'ring-2 ring-primary' : currentStep < 2 ? 'opacity-30' : 'opacity-60'}`}>
            <CardHeader>
              <CardTitle>2. Preview Extracted Data</CardTitle>
              <CardDescription>Structured requirements and skills</CardDescription>
            </CardHeader>
            <CardContent>
              {extracted ? (
                <div className="space-y-4 animate-slide-up">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Role</h4>
                    <Badge variant="secondary">{extracted.role}</Badge>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Core Skills</h4>
                    <div className="flex flex-wrap gap-2 animate-scale-in">
                      {extracted.skills_core.map((skill, i) => (
                        <Badge key={i} className="animate-scale-in" style={{ animationDelay: `${i * 50}ms` }}>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Nice-to-Have</h4>
                    <div className="flex flex-wrap gap-2">
                      {extracted.skills_nice.map((skill, i) => (
                        <Badge key={i} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={handleGeneratePlan}
                    disabled={isLoading || currentStep > 2}
                    className="w-full mt-4"
                  >
                    {isLoading && currentStep === 2 ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      'Generate Interview Plan'
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Waiting for job data...</p>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Plan */}
          <Card className={`animate-fade-in ${currentStep === 3 ? 'ring-2 ring-primary' : currentStep < 3 ? 'opacity-30' : 'opacity-60'}`}>
            <CardHeader>
              <CardTitle>3. Interview Questions</CardTitle>
              <CardDescription>AI-generated questions with rubrics</CardDescription>
            </CardHeader>
            <CardContent>
              {plan ? (
                <div className="space-y-4 animate-slide-up max-h-[400px] overflow-y-auto">
                  {plan.questions.slice(0, 2).map((q, i) => (
                    <div key={q.id} className="border-b pb-3 last:border-b-0">
                      <div className="flex items-start gap-2 mb-2">
                        <Badge variant={q.type === 'behavioral' ? 'default' : 'secondary'}>
                          {q.type}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium mb-2">{q.text}</p>
                      <div className="bg-slate-50 rounded p-2 text-xs">
                        <strong>Rubric:</strong>
                        <ul className="mt-1 space-y-1">
                          {plan.rubric[q.id]?.slice(0, 2).map((criterion, idx) => (
                            <li key={idx} className="text-slate-600">• {criterion}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                  <Button
                    onClick={handleStartInterview}
                    disabled={currentStep > 3}
                    className="w-full mt-4"
                  >
                    Start Interview
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Waiting for plan generation...</p>
              )}
            </CardContent>
          </Card>

          {/* Step 4: Interview */}
          <Card className={`animate-fade-in ${currentStep === 4 ? 'ring-2 ring-primary' : 'opacity-30'}`}>
            <CardHeader>
              <CardTitle>4. Live Interview</CardTitle>
              <CardDescription>Real-time transcript and EQ metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {interviewStarted ? (
                <div className="space-y-4 animate-slide-up">
                  {/* Transcript */}
                  <div className="bg-slate-50 rounded-lg p-3 min-h-[180px] max-h-[180px] overflow-y-auto">
                    <h4 className="font-semibold text-xs mb-2">Transcript</h4>
                    <div className="space-y-2">
                      {transcript.map((line, i) => (
                        <p key={i} className="text-xs text-slate-700 animate-slide-up">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* EQ Metrics */}
                  <div className="bg-surface-elevated rounded-lg p-3">
                    <h4 className="font-semibold text-xs mb-3">EQ Metrics</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Gaze Stability</span>
                          <span className="font-mono">{mockEQ.gaze.toFixed(2)}</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-green transition-all duration-500 animate-meter-fill"
                            style={{ width: `${mockEQ.gaze * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Blink Rate</span>
                          <span className="font-mono">{mockEQ.blink}/min</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-blue transition-all duration-500 animate-meter-fill"
                            style={{ width: `${(mockEQ.blink / 30) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Expression Variance</span>
                          <span className="font-mono">{mockEQ.expression.toFixed(2)}</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent-purple transition-all duration-500 animate-meter-fill"
                            style={{ width: `${mockEQ.expression * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" disabled>
                    End Interview
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Interview not started yet...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
