'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { extractRequirements } from '@/lib/api-client'

export function JobTextForm() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const extractResponse = await extractRequirements(text)

      const payload = {
        raw_text: text,
        title: 'Pasted Job Description',
        source: 'paste',
        ...extractResponse,
      }

      sessionStorage.setItem('jobData', JSON.stringify(payload))

      router.push('/preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process text')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="job-text" className="sr-only">
          Job Description Text
        </label>
        <Textarea
          id="job-text"
          placeholder="Paste job description here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          disabled={loading}
          rows={10}
          aria-label="Job description text"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} className="w-full" aria-busy={loading}>
        {loading ? 'Extracting...' : 'Extract Requirements'}
      </Button>
    </form>
  )
}
