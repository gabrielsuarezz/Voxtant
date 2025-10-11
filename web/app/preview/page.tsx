'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/ui/logo'
import { ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react'

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
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Logo size="sm" showText={true} />
        </div>

        {/* Title Card */}
        <Card className="mb-8 glass-card border-2 animate-slide-up">
          <CardHeader>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <CardTitle className="text-2xl mb-2">{jobData.role || jobData.title}</CardTitle>
                <CardDescription className="text-base">
                  Successfully extracted job requirements
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Extracted Data Display */}
        <div className="grid gap-6 mb-8">
          {/* Core Skills */}
          {jobData.skills_core.length > 0 && (
            <Card className="glass-card border-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  Core Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 stagger-fade-in">
                  {jobData.skills_core.map((skill, index) => (
                    <Badge
                      key={index}
                      className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Nice-to-Have Skills */}
          {jobData.skills_nice.length > 0 && (
            <Card className="glass-card border-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(175, 85%, 45%)' }}></div>
                  Nice-to-Have Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 stagger-fade-in">
                  {jobData.skills_nice.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-2"
                      style={{
                        borderColor: 'hsl(175, 85%, 45%)',
                        color: 'hsl(175, 85%, 45%)',
                        backgroundColor: 'hsl(175, 85%, 45%, 0.1)'
                      }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Values */}
          {jobData.values.length > 0 && (
            <Card className="glass-card border-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(270, 80%, 60%)' }}></div>
                  Company Values
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 stagger-fade-in">
                  {jobData.values.map((value, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="border-2"
                      style={{
                        borderColor: 'hsl(270, 80%, 60%)',
                        color: 'hsl(270, 80%, 60%)',
                        backgroundColor: 'hsl(270, 80%, 60%, 0.1)'
                      }}
                    >
                      {value}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {jobData.requirements.length > 0 && (
            <Card className="glass-card border-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-foreground/60"></div>
                  Key Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {jobData.requirements.map((req, index) => (
                    <li key={req.id || index} className="flex items-start gap-3 text-sm animate-fade-in" style={{ animationDelay: `${0.1 * index}s` }}>
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground/80">{typeof req === 'string' ? req : req.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* CTA Button */}
        <Card className="glass-card border-2 animate-scale-in" style={{ animationDelay: '0.5s' }}>
          <CardContent className="py-6">
            <Button
              size="lg"
              className="w-full text-lg h-14 gap-2 shadow-lg hover:shadow-xl transition-all duration-300 animate-glow"
              onClick={() => router.push('/plan')}
            >
              <Sparkles className="w-5 h-5" />
              Generate Interview Plan
            </Button>
            <p className="text-sm text-muted-foreground text-center mt-4">
              Create AI-powered questions tailored to this role
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
