'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { generatePlan, type ExtractRequirementsResponse, type GeneratePlanResponse } from '@/lib/api-client'
import { Loader2 } from 'lucide-react'

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
  const router = useRouter()

  useEffect(() => {
    const loadDataAndGeneratePlan = async () => {
      // Load job data from sessionStorage
      const data = sessionStorage.getItem('jobData')
      if (!data) {
        router.push('/')
        return
      }

      const parsedData: JobData = JSON.parse(data)
      setJobData(parsedData)

      // Generate plan
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
        <p className="text-slate-600">Loading...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/preview')}>
            Back to Preview
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Interview Plan</h1>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{jobData.title}</CardTitle>
            <CardDescription>
              Role: {jobData.role || 'Unknown'}
            </CardDescription>
          </CardHeader>
        </Card>

        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
              <span className="ml-3 text-slate-600">Generating interview questions...</span>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="py-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {plan && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Interview Questions</CardTitle>
                <CardDescription>
                  {plan.questions.length} questions tailored to this role
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {plan.questions.map((question, index) => (
                  <div key={question.id} className="border-b last:border-b-0 pb-6 last:pb-0">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="font-semibold text-slate-900 text-lg">
                        Q{index + 1}.
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={question.type === 'behavioral' ? 'default' : 'secondary'}>
                            {question.type}
                          </Badge>
                        </div>
                        <p className="text-slate-900 font-medium mb-3">{question.text}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs text-slate-500">Targets:</span>
                          {question.targets.map((target, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {target}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {plan.rubric[question.id] && (
                      <div className="ml-8 mt-4 bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-700 text-sm mb-2">
                          Evaluation Rubric:
                        </h4>
                        <ul className="space-y-1">
                          {plan.rubric[question.id].map((criterion, i) => (
                            <li key={i} className="text-sm text-slate-600 flex items-start">
                              <span className="mr-2">•</span>
                              <span>{criterion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-6">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    // TODO: Implement /interview route
                    alert('Interview feature coming soon!')
                  }}
                >
                  Start Interview
                </Button>
                <p className="text-xs text-slate-500 text-center mt-3">
                  This will launch the AI-powered mock interview session
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  )
}
