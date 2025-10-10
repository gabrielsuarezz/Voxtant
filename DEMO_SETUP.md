# Demo Setup - Quick Start Guide

## Gemini API Configuration

The Gemini API key has been successfully configured in `api/.env`:

```
GEMINI_API_KEY=AIzaSyAnz0OF6onmXlriYFuhTELjHr2nKYBsWh4
```

### ✅ What's Working

1. **API Server** - Fully configured with Gemini integration
2. **Question Generation** - Generates 3-5 personalized questions using Gemini 2.0 Flash
3. **Rubric Generation** - Creates detailed evaluation rubrics for each question
4. **Demo Mode** - Works both with and without Gemini API

### Test Results

Successfully tested `/generate_plan` endpoint with Gemini API:
- Generated 5 interview questions (behavioral + technical)
- Created comprehensive rubrics with 3-5 criteria per question
- Response time: ~7 seconds (normal for AI generation)
- Server status: ✅ Working perfectly

## Starting the Demo

### Terminal 1: API Server
```bash
cd api
.venv\Scripts\activate          # Windows
source .venv/bin/activate       # macOS/Linux
uvicorn app:app --reload --port 8000
```

Verify: http://localhost:8000/healthz should return `{"status":"ok","time":"..."}`

### Terminal 2: Web App
```bash
cd web
npm run dev
```

Verify: http://localhost:3000 should show the homepage

## Demo Paths

### Path 1: Full Demo with AI Generation (/demo route)
1. Navigate to http://localhost:3000/demo
2. Click "Use Sample Job" button
3. Click "Extract Requirements"
4. Click "Generate Interview Plan" (uses Gemini API)
5. Click "Start Interview" to see simulated interview

**What happens:** Gemini generates real questions based on job requirements

### Path 2: Regular Flow with AI
1. Navigate to http://localhost:3000
2. Paste job description or enter URL
3. View extracted data at /preview
4. Generate plan at /plan (uses Gemini API)

**What happens:** Full workflow with AI-powered question generation

### Path 3: Offline Demo Mode (No API calls)
Add `?demo=true` to API calls for stable, offline demo data:
- `/extract_requirements?demo=true` - Returns sample job data
- `/generate_plan?demo=true` - Returns 4 pre-defined questions

## Troubleshooting

### Gemini API Not Working
- **Check:** Is the API key in `api/.env`?
- **Check:** Did you restart the API server after adding the key?
- **Fallback:** System automatically uses fallback questions if API fails

### Server Won't Start
```bash
cd api
.venv\Scripts\pip install google-generativeai==0.8.3
```

### Questions Look Generic
- **Expected behavior:** Fallback mode (no API key or API error)
- **Fix:** Ensure `.env` file exists with correct API key
- **Test:** Check server logs for "Gemini API error" messages

## Key Files Modified

1. `api/.env` - Added Gemini API key
2. `api/app.py` - Already configured (lines 253-339)
3. `web/lib/api-client.ts` - Supports demo mode
4. `web/app/demo/page.tsx` - Full demo interface

## Notes for Live Demo

- **First Question Generation:** May take 5-10 seconds (normal for AI)
- **Subsequent Calls:** Similar timing, Gemini doesn't cache
- **API Limits:** Free tier has limits, but sufficient for demos
- **Error Handling:** System gracefully falls back to deterministic questions if Gemini fails
- **ALTS Warning:** Ignore "ALTS creds ignored" warning in server logs (expected for local dev)

## Success Indicators

✅ `/healthz` returns 200 OK
✅ `/generate_plan` generates 3-5 unique questions
✅ Questions mention specific skills from job requirements
✅ Rubrics are detailed and relevant
✅ Response includes both behavioral and technical questions

---

**Status:** All systems ready for live demo! 🚀
