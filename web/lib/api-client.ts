const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export interface ExtractRequirementsResponse {
  role: string
  skills_core: string[]
  skills_nice: string[]
  values: string[]
  requirements: string[]
}

export interface Question {
  id: string
  type: 'behavioral' | 'technical'
  text: string
  targets: string[]
}

export interface GeneratePlanResponse {
  questions: Question[]
  rubric: Record<string, string[]>
}

export interface ConversationMessage {
  role: 'interviewer' | 'candidate'
  text: string
}

export interface InterviewFeedbackResponse {
  feedback: string
  strengths: string[]
  areas_for_improvement: string[]
}

export async function extractRequirements(
  raw_text: string,
  demo?: boolean
): Promise<ExtractRequirementsResponse> {
  const url = new URL(`${API_BASE_URL}/extract_requirements`)
  if (demo) {
    url.searchParams.set('demo', 'true')
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw_text }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to extract requirements')
  }

  return response.json()
}

export async function generatePlan(
  extracted: ExtractRequirementsResponse,
  resume_text?: string,
  demo?: boolean
): Promise<GeneratePlanResponse> {
  const url = new URL(`${API_BASE_URL}/generate_plan`)
  if (demo) {
    url.searchParams.set('demo', 'true')
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ extracted, resume_text }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to generate plan')
  }

  return response.json()
}

export async function generateInterviewFeedback(
  conversation: ConversationMessage[],
  role: string,
  company?: string
): Promise<InterviewFeedbackResponse> {
  const response = await fetch(`${API_BASE_URL}/interview/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ conversation, role, company }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Failed to generate feedback')
  }

  return response.json()
}
