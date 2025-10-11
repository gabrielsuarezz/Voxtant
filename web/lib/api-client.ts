const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export interface Requirement {
  id: string
  text: string
}

export interface ExtractRequirementsResponse {
  role: string
  skills_core: string[]
  skills_nice: string[]
  values: string[]
  requirements: Requirement[]
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

export interface DeliveryMetrics {
  wordsPerMin: number
  pauseRatio: number
  fillerPerMin: number
}

export interface EQMetrics {
  gazeStability: number
  blinkRatePerMin: number
  expressionVariance: number
  isLookingAtCamera: boolean
  gazeDirection: { x: number, y: number }
}

export interface STARScore {
  S: number
  T: number
  A: number
  R: number
}

export interface GradeAnswerResponse {
  content_score: number
  star: STARScore
  delivery: DeliveryMetrics
  eq: EQMetrics
  tips: string[]
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

export async function gradeAnswer(
  qid: string,
  transcript: string,
  timings: DeliveryMetrics,
  eq: EQMetrics,
  job_graph: ExtractRequirementsResponse
): Promise<GradeAnswerResponse> {
  const url = `${API_BASE_URL}/grade_answer`
  console.log('Grading answer at:', url)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      qid,
      transcript,
      timings,
      eq,
      job_graph
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    console.error(`Grading failed: ${response.status} ${response.statusText}`, text)
    throw new Error(`Failed to grade: ${response.status} ${response.statusText} ${text}`)
  }

  return response.json()
}
