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

## Environment

Copy `.env.example` to `.env` and configure:

- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins (default: `http://localhost:3000`)
- `GEMINI_API_KEY` - Required for `/generate_plan` to use AI-generated questions
  - Get your key at https://aistudio.google.com/app/apikey
  - Without this key, `/generate_plan` returns 3 fallback questions

## Deploy to Render/Railway

1. Connect your GitHub repo
2. Set root directory to `api`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from `.env.example`
   - `ALLOWED_ORIGINS` - Comma-separated list of frontend URLs
   - `GEMINI_API_KEY` - Required for AI-generated interview questions (get from https://aistudio.google.com/app/apikey)
