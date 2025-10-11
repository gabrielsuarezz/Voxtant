/**
 * Global state store for interview session using Zustand.
 * Manages job context, questions, plan, live session state, and settings.
 */

import { create } from 'zustand'
import type { ExtractRequirementsResponse, GeneratePlanResponse } from '@/lib/api-client'

interface LiveState {
  connected: boolean
  recording: boolean
  aiSpeaking: boolean
  transcript: string
  partial: string
  levels: number  // Audio level 0-1
}

interface InterviewSettings {
  sttFallback: boolean  // Use Web Speech API fallback
  liveInterviewer: boolean  // Enable live AI interviewer
}

interface InterviewStore {
  // Job context and plan
  jobGraph: ExtractRequirementsResponse | null
  setJobGraph: (jobGraph: ExtractRequirementsResponse) => void

  plan: GeneratePlanResponse | null
  setPlan: (plan: GeneratePlanResponse) => void

  // Live interview state
  live: LiveState
  setLive: (updates: Partial<LiveState>) => void

  // Current question tracking
  currentQuestionId: string | null
  setCurrentQuestion: (id: string | null) => void

  // Settings
  settings: InterviewSettings
  updateSettings: (updates: Partial<InterviewSettings>) => void

  // Reset function
  reset: () => void
}

const DEFAULT_LIVE_STATE: LiveState = {
  connected: false,
  recording: false,
  aiSpeaking: false,
  transcript: '',
  partial: '',
  levels: 0
}

const DEFAULT_SETTINGS: InterviewSettings = {
  sttFallback: false,
  liveInterviewer: false
}

export const useInterviewStore = create<InterviewStore>((set) => ({
  // Initial state
  jobGraph: null,
  plan: null,
  live: DEFAULT_LIVE_STATE,
  currentQuestionId: null,
  settings: DEFAULT_SETTINGS,

  // Actions
  setJobGraph: (jobGraph) => set({ jobGraph }),

  setPlan: (plan) => set({ plan }),

  setLive: (updates) => set((state) => ({
    live: { ...state.live, ...updates }
  })),

  setCurrentQuestion: (id) => set({ currentQuestionId: id }),

  updateSettings: (updates) => set((state) => ({
    settings: { ...state.settings, ...updates }
  })),

  reset: () => set({
    jobGraph: null,
    plan: null,
    live: DEFAULT_LIVE_STATE,
    currentQuestionId: null,
    settings: DEFAULT_SETTINGS
  })
}))
