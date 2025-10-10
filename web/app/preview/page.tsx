'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

export default function PreviewPage() {
  const [jobData, setJobData] = useState<JobData | null>(null)
  const router = useRouter()

  useEffect(() => {
    const data = sessionStorage.getItem('jobData')
    if (data) {
      setJobData(JSON.parse(data))
    } else {
      router.push('/')
    }
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
        <div className="mb-8">
          <Button variant="outline" onClick={() => router.push('/')}>
            Back to Import
          </Button>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{jobData.title}</CardTitle>
            <CardDescription>
              Source: {jobData.source === 'url' ? 'URL' : 'Pasted Text'}
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Extracted Data</CardTitle>
            <CardDescription>
              JSON representation of extracted job requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(jobData, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6">
            <Button
              size="lg"
              className="w-full"
              onClick={() => router.push('/plan')}
            >
              Generate Interview Plan
            </Button>
            <p className="text-xs text-slate-500 text-center mt-3">
              Create tailored interview questions and rubrics
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
