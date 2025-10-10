import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { JobUrlForm } from '@/components/job/JobUrlForm'
import { JobTextForm } from '@/components/job/JobTextForm'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Voxtant
          </h1>
          <p className="text-lg text-slate-600">
            AI-powered mock interview platform. Start by importing a job posting.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Import from URL</CardTitle>
              <CardDescription>
                Paste a link to a job posting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JobUrlForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paste Job Description</CardTitle>
              <CardDescription>
                Copy and paste the full job description
              </CardDescription>
            </CardHeader>
            <CardContent>
              <JobTextForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
