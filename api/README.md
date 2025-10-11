# Voxtant API

FastAPI backend for job posting ingestion and requirement extraction.

## How to Run Locally

```bash
# 1. Create virtual environment
python -m venv .venv

# 2. Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment (optional)
cp .env.example .env
# Edit .env to customize CORS origins if needed

# 5. Start development server
uvicorn app:app --reload --port 8000
```

API docs available at http://localhost:8000/docs

Interactive API documentation (Swagger UI) at http://localhost:8000/docs

## Endpoints

- `GET /healthz` - Health check (returns status and ISO timestamp)
- `POST /ingest_url` - Extract text and title from URL (trafilatura → readability fallback)
- `POST /extract_requirements` - Parse job requirements (stub implementation, NLP pending)
- `POST /generate_plan` - Generate interview questions and rubrics using Gemini AI
  - Input: `{ extracted: ExtractRequirementsResponse, resume_text?: string }`
  - Output: `{ questions: Question[], rubric: Record<string, string[]> }`
  - Uses Gemini 2.5 Flash if `GEMINI_API_KEY` is set, otherwise returns deterministic fallback
- `POST /grade_answer` - Grade interview answer with content coverage, STAR, delivery, and tips
  - Input: `{ qid?: string, transcript: string, timings?: {wordsPerMin, pauseRatio, fillerPerMin}, eq?: {...}, job_graph?: ExtractRequirementsResponse }`
  - Output: `{ content_score: float, star: {S,T,A,R}, delivery: {...}, tips: string[] }`
  - Resilient: returns neutral scores on errors, never fails with 500

## Environment

Copy `.env.example` to `.env` and configure:

- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins (default: `http://localhost:3000`)
- `GEMINI_API_KEY` - Required for `/generate_plan` to use AI-generated questions
  - Get your key at https://aistudio.google.com/app/apikey
  - Without this key, `/generate_plan` returns 3 fallback questions

## Testing

### Quick Grading Test (curl)

```bash
curl -s -X POST http://localhost:8000/grade_answer \
 -H "Content-Type: application/json" \
 -d '{"qid":"q1","transcript":"When I joined, I led a migration to AWS and reduced costs by 22% using Terraform.","timings":{"wordsPerMin":140,"pauseRatio":0.12,"fillerPerMin":0.2},"job_graph":{"skills_core":["AWS","Terraform","CI/CD"],"requirements":[{"id":"r1","text":"Migrate services to AWS and reduce costs"},{"id":"r2","text":"Design and maintain CI/CD pipelines"}]}}'
```

Expected: 200 OK with JSON containing:
- `content_score` > 0 (should be higher when transcript mentions job skills)
- `star.R` = 1 (Result detected due to "22%")
- `tips` array with ≤3 actionable suggestions

### Verifying in Swagger UI

1. Visit http://localhost:8000/docs
2. Expand `POST /grade_answer`
3. Click "Try it out"
4. Paste the sample payload above
5. Click "Execute" and verify 200 response

## Deploy to Render/Railway

1. Connect your GitHub repo
2. Set root directory to `api`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from `.env.example`
   - `ALLOWED_ORIGINS` - Comma-separated list of frontend URLs
   - `GEMINI_API_KEY` - Required for AI-generated interview questions (get from https://aistudio.google.com/app/apikey)
