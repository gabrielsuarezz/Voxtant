import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { JobTextForm } from '@/components/job/JobTextForm'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Voxtant
          </h1>
          <p className="text-lg text-slate-600">
            AI-powered mock interview platform. Start by pasting a job posting.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Paste Job Description</CardTitle>
            <CardDescription>
              Copy and paste the full job description to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JobTextForm />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
