'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ingestUrl, extractRequirements } from '@/lib/api-client'

export function JobUrlForm() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const ingestResponse = await ingestUrl(url)

      const extractResponse = await extractRequirements(ingestResponse.raw_text)

      const payload = {
        ...ingestResponse,
        ...extractResponse,
      }

      sessionStorage.setItem('jobData', JSON.stringify(payload))

      router.push('/preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process URL')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="job-url" className="sr-only">
          Job Posting URL
        </label>
        <Input
          id="job-url"
          type="url"
          placeholder="https://example.com/job-posting"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          disabled={loading}
          aria-label="Job posting URL"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} className="w-full" aria-busy={loading}>
        {loading ? 'Extracting...' : 'Extract From URL'}
      </Button>
    </form>
  )
}
