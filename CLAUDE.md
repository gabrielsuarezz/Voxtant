# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Voxtant is an AI-powered mock interview platform for job seekers. The system extracts job posting data, structures requirements, generates personalized interview questions with rubrics using Gemini AI, provides real-time EQ (emotional intelligence) metrics during practice interviews, and will facilitate AI-driven interview practice.

**Tech Stack:**
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Backend: FastAPI (Python)
- AI: Google Gemini 2.5 Flash (for question/rubric generation)
- Computer Vision: MediaPipe FaceLandmarker (Web), OpenCV.js
- Architecture: Monorepo with separate web and API workspaces
- Privacy: All EQ analysis runs in-browser; no video leaves device

## Development Commands

### Prerequisites
- Node.js >= 18.0.0
- Python 3.8+

### Web (Frontend)
```bash
# From project root
npm run dev:web
npm run build:web

# From web directory
cd web
npm install
npm run dev       # Start dev server on http://localhost:3000
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

### API (Backend)
```bash
cd api

# First time setup
python -m venv .venv
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # macOS/Linux
pip install -r requirements.txt

# Development
uvicorn app:app --reload --port 8000    # Start dev server
# API docs available at http://localhost:8000/docs

# Production
uvicorn app:app --host 0.0.0.0 --port $PORT
```

### Environment Setup
Copy `.env.example` to `.env` (API) or `.env.local` (Web) and configure:
- **API** (`api/.env`):
  - `ALLOWED_ORIGINS` - Comma-separated CORS origins (default: `http://localhost:3000`)
  - `GEMINI_API_KEY` - Required for AI-powered features (get from https://aistudio.google.com/app/apikey)
    - Required for `/extract_requirements` (returns 500 error without key, unless `?demo=true`)
    - Required for `/generate_plan` (returns 3 fallback questions without key)
- **Web** (`web/.env.local`):
  - `NEXT_PUBLIC_API_BASE_URL` - FastAPI backend URL (default: `http://localhost:8000`)

### Testing EQ Sandbox
```bash
# Terminal 1: Start API
cd api && uvicorn app:app --reload --port 8000

# Terminal 2: Start web
cd web && npm run dev

# Browser: Navigate to http://localhost:3000/eq-sandbox
# Click "Start" and allow camera access
```

## Architecture

### Data Flow
1. **Input Stage**: User provides job posting by pasting text
   - JobTextForm directly calls `/extract_requirements` endpoint with raw text
   - Note: URL ingestion was removed to focus on text paste functionality

2. **Processing Stage**: Raw text → structured requirements
   - `/extract_requirements` endpoint uses Gemini AI for intelligent extraction
   - Response: role, skills_core, skills_nice, values, requirements

3. **Preview Stage**: Structured data stored in sessionStorage → rendered at `/preview`

4. **Plan Generation Stage**: Structured requirements → interview questions + rubrics
   - `/plan` page calls `/generate_plan` endpoint with extracted job data
   - Gemini 2.5 Flash generates 3-5 tailored questions (behavioral + technical)
   - Each question includes evaluation rubric (3-5 criteria)
   - Response: questions[], rubric{} mapped by question ID
   - Fallback: Returns 3 deterministic questions if no GEMINI_API_KEY

### API Architecture (api/app.py)
- **Endpoints:**
  - `GET /healthz` - Health check (returns `{ status: "ok", time: ISO8601 }`)
  - `POST /extract_requirements` - Extract structured data using Gemini AI
    - Input: `{ raw_text: string }`
    - Query param `?demo=true` - Returns stable sample data for offline demos
    - Uses Gemini 2.5 Flash (`gemini-2.0-flash-exp`) to extract role, skills, values, requirements
    - Returns 500 error if GEMINI_API_KEY not configured (unless `?demo=true`)
    - Fallback: Returns empty arrays on Gemini API failure
  - `POST /generate_plan` - Generate interview questions and rubrics
    - Input: `{ extracted: ExtractRequirementsResponse, resume_text?: string }`
    - Query param `?demo=true` - Returns 4 stable demo questions with rubrics
    - Uses Gemini 2.5 Flash (`gemini-2.0-flash-exp`) with few-shot prompting
    - Generates 3-5 questions (mix of behavioral STAR + technical)
    - Each question has: id, type, text, targets[]
    - Returns rubric with 3-5 evaluation criteria per question
    - Fallback: Returns 3 deterministic questions if GEMINI_API_KEY not set
  - `WS /ws/interview` - Live audio interview streaming (WebSocket)
    - Proxies bidirectional audio between client and Gemini Live API
    - Connects to: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`
    - Uses `gemini-2.0-flash-exp` model with AUDIO response modality
    - Client sends: PCM audio chunks at native sample rate (44.1/48kHz)
    - Gemini returns: PCM audio at 24kHz (base64-encoded in JSON messages)
    - Initial prompt auto-sent after setup to trigger conversation start
    - System instruction: Ask questions one at a time, speak out loud, be conversational

- **CORS Configuration:**
  - Defaults to `http://localhost:3000` if `ALLOWED_ORIGINS` not set
  - Supports comma-separated origins for multi-domain deployments
  - Configured in `api/.env.example`

### Web Architecture
- **App Router Structure:**
  - `/` - Home page with text paste input for job postings
  - `/preview` - Display extracted job data (sessionStorage-based)
  - `/plan` - Generate and display interview questions with rubrics
  - `/interview` - Live audio interview with Gemini AI via WebSocket
  - `/eq-sandbox` - EQ metrics testing sandbox with live webcam analysis
  - `/demo` - Presentation-ready demo mode with 4-step workflow

- **Component Organization:**
  - `components/job/` - Job input forms (JobTextForm)
  - `components/eq/` - EQ overlay and metrics display
  - `components/ui/` - shadcn/ui primitives
  - `lib/api-client.ts` - Typed FastAPI client functions
  - `lib/eq/faceLandmarker.ts` - MediaPipe wrapper for facial analysis
  - `lib/cv/loadOpenCV.ts` - Singleton OpenCV.js loader
  - `lib/utils.ts` - Tailwind utility functions (cn helper)
  - `lib/tokens.ts` - Design tokens (colors, spacing, radius, shadows, transitions)

- **Custom Hooks:**
  - `hooks/useWebcam.ts` - getUserMedia management, permission handling
  - `hooks/useEQ.ts` - rAF loop (~15 FPS) for video analysis, smoothing, OpenCV filtering
  - `hooks/useAudioStream.ts` - WebSocket audio streaming, microphone capture, playback queueing

- **State Management:**
  - Client-side only (useState, useRouter)
  - sessionStorage for job data transfer between pages
  - No video data stored or transmitted

- **Design System:**
  - Design tokens defined in `lib/tokens.ts` and `app/globals.css`
  - Extended Tailwind color palette: success, warning, accent-blue/green/purple/orange
  - Animations: fade-in, slide-up, slide-down, scale-in, meter-fill
  - Global focus states with ring-2 ring-ring ring-offset-2
  - Accessible form labels with sr-only class and aria-label attributes
  - Button labels follow verb + object pattern (e.g., "Extract Requirements", "Generate Plan")

### EQ Metrics Architecture
Real-time emotional intelligence analysis using on-device computer vision:

1. **Video Capture Flow:**
   - `useWebcam` hook manages getUserMedia, handles permissions, provides video ref
   - Hidden `<video>` element (playsinline, muted) for processing
   - Stream cleanup on unmount, auto-pause on tab blur

2. **Analysis Pipeline (useEQ hook):**
   - requestAnimationFrame loop throttled to ~15 FPS
   - Calls `faceLandmarker.analyzeVideoFrame()` each cycle
   - Rolling buffer (10 frames) for simple moving average smoothing
   - Optional OpenCV.js box filtering for advanced time-series smoothing

3. **MediaPipe Integration (lib/eq/faceLandmarker.ts):**
   - FaceLandmarker (Web) in VIDEO mode, GPU delegate
   - Model: `face_landmarker.task` from Google CDN
   - Outputs: faceLandmarks (478 points), faceBlendshapes (52 categories)
   - Metrics extraction:
     - **Gaze Stability**: Eye landmark variance (0-1)
     - **Blink Rate**: Rising edge detection on eyeBlink blendshapes, extrapolated to blinks/min
     - **Expression Variance**: Categorical diversity across smile/frown/brow blendshapes (0-1)

4. **OpenCV.js Integration (lib/cv/loadOpenCV.ts):**
   - Singleton loader, CDN script injection
   - Polls for `window.cv.Mat` availability
   - Graceful degradation if loading fails
   - Used for optional box filter on metric time series

5. **Privacy & Performance:**
   - All processing client-side, no network transmission
   - Models loaded once per session
   - Processing pauses when tab not visible
   - Target 15 FPS to balance responsiveness and CPU usage

### Plan Generation Architecture
AI-powered interview question and rubric generation:

1. **API Integration (api/app.py):**
   - `generate_gemini_plan()` - Uses Gemini 2.5 Flash (`gemini-2.0-flash-exp`)
   - `generate_fallback_plan()` - Deterministic 3-question fallback
   - Prompt engineering: Few-shot approach with STAR framework guidance
   - Input: ExtractRequirementsResponse + optional resume_text (truncated to 2000 chars)
   - JSON parsing with markdown code block cleanup
   - Error handling: Falls back to deterministic questions on API failure

2. **Question Generation Strategy:**
   - Mix of behavioral (STAR framework) and technical questions
   - Target 3-5 questions total
   - Each question includes:
     - Unique ID (q1, q2, etc.)
     - Type (behavioral or technical)
     - Question text
     - Target skills/requirements being assessed
   - Fallback questions cover: leadership, technical skills, collaboration

3. **Rubric Generation:**
   - 3-5 evaluation criteria per question
   - Behavioral rubrics focus on: context (S/T), actions, results, reflection
   - Technical rubrics focus on: specific tools, trade-offs, testing, depth
   - Stored as dictionary mapping question ID to criteria array

4. **Web Integration (app/plan/page.tsx):**
   - Loads job data from sessionStorage
   - Calls `/generate_plan` on mount
   - Displays loading state with spinner
   - Renders questions with Badge components (type, targets)
   - Expandable rubric per question
   - "Start Interview" button (placeholder for future implementation)

### Demo Mode Architecture
Presentation-ready demo workflow for offline/live presentations:

1. **API Demo Mode (api/app.py):**
   - `?demo=true` query parameter on `/extract_requirements` and `/generate_plan`
   - Returns stable, non-LLM sample payloads for consistent demos
   - Demo data includes realistic Senior Full-Stack Engineer job requirements
   - 4 detailed questions with comprehensive rubrics
   - No GEMINI_API_KEY required in demo mode

2. **Demo Page (app/demo/page.tsx):**
   - Single-page 4-step workflow with progress indicators
   - Step 1: Ingest - Preloaded sample job text, "Use Sample Job" button
   - Step 2: Preview - Animated skill chips, structured data display
   - Step 3: Plan - Questions with rubrics (scrollable)
   - Step 4: Interview - Simulated transcript + live EQ metrics with animated bars
   - "Reset Demo" button clears all state
   - All animations enabled: fade-in, slide-up, scale-in, meter-fill
   - Visual ring indicators highlight current step

3. **Presentation Features:**
   - Progress tracking with checkmarks for completed steps
   - Consistent color-coded badges (behavioral=primary, technical=secondary)
   - Responsive 2-column grid layout (mobile-friendly)
   - Staggered chip animations (50ms delay per item)
   - Mock EQ metrics that update every 2 seconds
   - Simulated transcript with realistic timing

### Live Interview Architecture
Real-time audio conversation with Gemini AI using WebSocket streaming:

1. **WebSocket Flow (api/app.py `/ws/interview`):**
   - Accept client WebSocket connection
   - Connect to Gemini Live API via `websockets` library
   - Send setup message with model config, voice (Puck), and system instruction
   - Wait for `setupComplete` response from Gemini
   - Send initial text prompt to trigger Gemini to start talking
   - Run two concurrent tasks: `client_to_gemini()` and `gemini_to_client()`

2. **Audio Format Handling:**
   - **Client → Server**: Binary PCM chunks (Int16) at browser's native rate (48kHz typical)
   - **Server → Gemini**: Base64-encoded PCM in JSON `realtime_input.media_chunks` messages
   - **Gemini → Server**: Base64-encoded PCM at 24kHz in JSON `serverContent.modelTurn.parts.inlineData`
   - **Server → Client**: Binary PCM chunks decoded from base64

3. **Frontend Audio Streaming (hooks/useAudioStream.ts):**
   - Creates AudioContext with browser's default sample rate (no forced 16kHz)
   - Captures microphone via getUserMedia with echo cancellation, noise suppression
   - Uses ScriptProcessorNode (deprecated but functional) to process audio in 4096-sample chunks
   - Converts Float32 audio to Int16 PCM and sends via WebSocket
   - Receives 24kHz PCM from server and queues playback sequentially
   - Uses `nextPlayTimeRef` to schedule audio buffers without gaps/overlaps
   - Volume detection triggers `isSpeaking` indicator

4. **Interview Page (app/interview/page.tsx):**
   - Visual states: disconnected, connecting, connected, error
   - Speaking indicator with animated pulse when user talks
   - Start/End interview controls
   - Privacy notice about secure WebSocket connection
   - Interview tips card with STAR method guidance

5. **Key Technical Decisions:**
   - No forced sample rate on microphone - use browser's native rate to avoid compatibility issues
   - Audio buffers created at 24kHz (Gemini's output) for correct playback speed
   - Sequential audio queueing prevents choppy/sped-up playback
   - Initial prompt required to make Gemini start conversation proactively
   - System instruction emphasizes "ask ONE question at a time" and "speak out loud"

### Type System
- TypeScript interfaces defined in `web/lib/api-client.ts`
- Pydantic models in `api/app.py` (BaseModel subclasses)
- Shared schemas:
  - `ExtractRequirementsRequest` - Raw job posting text input
  - `ExtractRequirementsResponse` - Structured job requirements
  - `Question` - Interview question with id, type, text, targets[]
  - `GeneratePlanRequest` - Extracted data + optional resume text
  - `GeneratePlanResponse` - questions[] + rubric{} mapping
- EQ metrics: `{ gazeStability: number, blinkRatePerMin: number, expressionVariance: number }`

## Important Notes

### Recent Changes
- Removed URL ingestion functionality - now focused on text paste only
- Implemented Gemini AI extraction in `/extract_requirements` endpoint
- Both `/extract_requirements` and `/generate_plan` now use `gemini-2.0-flash-exp` model
- Added fallback behavior: `/extract_requirements` returns empty arrays on failure, `/generate_plan` returns deterministic questions
- Implemented live audio interview via WebSocket proxy to Gemini Live API
- Added `useAudioStream` hook for bidirectional audio streaming with proper queueing
- Created `/interview` page with real-time conversation UI

### Git Commit Style
Per `.claude.md` preferences:
- NO "Co-Authored-By: Claude" attribution
- NO "Generated with Claude Code" footer
- NO emojis in commits or code
- User should be sole contributor on GitHub

### Current Limitations
- Requires GEMINI_API_KEY for full functionality (or use `?demo=true` for presentations)
- No database/persistence layer (sessionStorage only for job data)
- EQ metrics use simplified algorithms (gaze via eye landmark variance, expression via blendshape categories)
- FaceLandmarker supports 1 face max in current configuration
- OpenCV.js loaded from CDN (no offline fallback)
- Interview questions from `/plan` not yet passed to `/interview` - Gemini generates questions on the fly
- No interview transcript recording or evaluation scoring yet
- ScriptProcessorNode deprecated (works but should migrate to AudioWorklet in future)

### Deployment
- **Web**: Vercel (set root to `web/`, configure `NEXT_PUBLIC_API_BASE_URL`)
- **API**: Render/Railway (build: `pip install -r requirements.txt`, start: `uvicorn app:app --host 0.0.0.0 --port $PORT`)
