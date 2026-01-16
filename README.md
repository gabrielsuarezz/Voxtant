# Voxtant

AI-powered mock interview platform for job seeker's.

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+

### Development

**Web (Next.js)**
```bash
cd web
npm install
npm run dev
```
Access at http://localhost:3000

**API (FastAPI)**
```bash
cd api
python -m venv .venv

# On Window's
.venv\Scripts\activate
# On macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```
Access at http://localhost:8000/docs

### Test Flow
1. Start both web and api servers
2. Visit http://localhost:3000
3. Try pasting a job description or entering a URL
4. View extracted data at /preview

## Structure

```
voxtant/
├── web/          Next.js frontend
├── api/          FastAPI backend
└── README.md     This file
```

## Presentation Checklist

Use this checklist before live demos or presentations:

### Pre-Demo Setup
- [ ] **Start both servers**
  - API: `cd api && uvicorn app:app --reload --port 8000`
  - Web: `cd web && npm run dev`
  - Verify API health: http://localhost:8000/healthz
  - Verify web access: http://localhost:3000

- [ ] **Configure demo mode (optional for offline demos)**
  - API endpoints support `?demo=true` query parameter
  - Returns stable sample data without requiring Gemini API key
  - Test: `POST http://localhost:8000/extract_requirements?demo=true`

- [ ] **Browser permissions**
  - Grant camera access for EQ metrics (if demoing /eq-sandbox)
  - Grant microphone access (if demoing interview features)
  - Test webcam at http://localhost:3000/eq-sandbox

### Demo Flow
1. **Navigate to /demo route** (http://localhost:3000/demo)
   - Shows complete 4-step workflow in one page
   - Click "Use Sample Job" for quick demo
   - All animations and transitions enabled

2. **Alternative: Manual flow**
   - Home (/) → Paste job text → Preview (/preview) → Plan (/plan)
   - EQ Sandbox (/eq-sandbox) for live facial analysis demo

### Troubleshooting
- **API connection issues**: Check CORS settings in `api/.env`
- **No questions generated**: Verify `GEMINI_API_KEY` in `api/.env` or use `?demo=true`
- **Webcam not working**: Check browser permissions, try HTTPS in production
- **Animations not smooth**: Close other browser tabs, check GPU acceleration

### Visual Polish Checklist
- [ ] Animations: Fade-in, slide-up, scale-in effects working
- [ ] Focus states: Visible rings on Tab navigation
- [ ] Color palette: Consistent use of design tokens
- [ ] Button labels: Clear verb + object pattern (e.g., "Generate Plan")
- [ ] Loading states: Spinners visible during async operations
- [ ] Error messages: Clear, accessible with role="alert"

### Post-Demo
- [ ] Reset demo state: Click "Reset Demo" button on /demo page
- [ ] Clear sessionStorage (if needed): DevTools → Application → Storage
- [ ] Review console for any errors or warnings

## Deployment

**Web (Vercel)**
- Connect GitHub repo to Vercel
- Set root directory to `web`
- Add env var: `NEXT_PUBLIC_API_BASE_URL` (your deployed API URL)

**API (Render/Railway)**
- Deploy from `api` directory
- Build command: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
- Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- Add env vars from `.env.example`

## License

MIT
