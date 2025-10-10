'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/ui/logo'
import { generatePlan, type ExtractRequirementsResponse, type GeneratePlanResponse } from '@/lib/api-client'
import { Loader2, ArrowLeft, Sparkles, Target, PlayCircle } from 'lucide-react'

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

export default function PlanPage() {
  const [jobData, setJobData] = useState<JobData | null>(null)
  const [plan, setPlan] = useState<GeneratePlanResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedRubric, setExpandedRubric] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const loadDataAndGeneratePlan = async () => {
      const data = sessionStorage.getItem('jobData')
      if (!data) {
        router.push('/')
        return
      }

      const parsedData: JobData = JSON.parse(data)
      setJobData(parsedData)

      setIsLoading(true)
      setError(null)

      try {
        const extracted: ExtractRequirementsResponse = {
          role: parsedData.role,
          skills_core: parsedData.skills_core,
          skills_nice: parsedData.skills_nice,
          values: parsedData.values,
          requirements: parsedData.requirements,
        }

        const generatedPlan = await generatePlan(extracted)
        setPlan(generatedPlan)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate plan')
      } finally {
        setIsLoading(false)
      }
    }

    loadDataAndGeneratePlan()
  }, [router])

  if (!jobData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Logo size="lg" showText={false} />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between animate-fade-in">
          <Button variant="outline" onClick={() => router.push('/preview')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Logo size="sm" showText={true} />
        </div>

        {/* Title Card */}
        <Card className="mb-8 glass-card border-2 animate-slide-up">
          <CardHeader>
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <CardTitle className="text-2xl mb-2">Interview Plan</CardTitle>
                <CardDescription className="text-base">
                  Role: {jobData.role || jobData.title}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card className="glass-card border-2 animate-scale-in">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <span className="text-lg font-medium">Generating interview questions...</span>
              <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-2 border-destructive/50 bg-destructive/5 animate-slide-down">
            <CardContent className="py-6">
              <p className="text-destructive font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Questions Display */}
        {plan && (
          <>
            <Card className="mb-8 glass-card border-2 animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Interview Questions</CardTitle>
                    <CardDescription className="text-base mt-1">
                      {plan.questions.length} questions tailored to this role
                    </CardDescription>
                  </div>
                  <Target className="w-6 h-6 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {plan.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="border-b last:border-b-0 pb-6 last:pb-0 animate-slide-up"
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary text-lg">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge
                            className={
                              question.type === 'behavioral'
                                ? 'bg-primary/10 text-primary border-primary/20'
                                : 'border-2'
                            }
                            style={
                              question.type === 'technical'
                                ? {
                                    borderColor: 'hsl(175, 85%, 45%)',
                                    color: 'hsl(175, 85%, 45%)',
                                    backgroundColor: 'hsl(175, 85%, 45%, 0.1)'
                                  }
                                : {}
                            }
                          >
                            {question.type}
                          </Badge>
                        </div>
                        <p className="text-foreground font-medium mb-4 text-lg leading-relaxed">
                          {question.text}
                        </p>
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-sm text-muted-foreground font-medium">Targets:</span>
                          {question.targets.map((target, i) => (
                            <Badge key={i} variant="outline" className="text-sm">
                              {target}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Rubric */}
                    {plan.rubric[question.id] && (
                      <div className="ml-14">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedRubric(expandedRubric === question.id ? null : question.id)}
                          className="mb-3"
                        >
                          {expandedRubric === question.id ? 'Hide' : 'Show'} Evaluation Rubric
                        </Button>
                        {expandedRubric === question.id && (
                          <div className="glass-card p-5 rounded-lg animate-slide-down border">
                            <h4 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
                              <Target className="w-4 h-4" />
                              Evaluation Criteria
                            </h4>
                            <ul className="space-y-2">
                              {plan.rubric[question.id].map((criterion, i) => (
                                <li
                                  key={i}
                                  className="text-sm text-foreground/80 flex items-start gap-2 animate-fade-in"
                                  style={{ animationDelay: `${0.05 * i}s` }}
                                >
                                  <span className="text-primary mt-1">✓</span>
                                  <span>{criterion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* CTA Button */}
            <Card className="glass-card border-2 animate-scale-in" style={{ animationDelay: '0.5s' }}>
              <CardContent className="py-6">
                <Button
                  size="lg"
                  className="w-full text-lg h-14 gap-3 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => {
                    alert('Interview feature coming soon!')
                  }}
                >
                  <PlayCircle className="w-5 h-5" />
                  Start Mock Interview
                </Button>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Launch AI-powered interview session with real-time feedback
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  )
}
