from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict
from datetime import datetime
import trafilatura
from readability import Document
import requests
import os
from dotenv import load_dotenv
import google.generativeai as genai
import json

load_dotenv()

app = FastAPI(title="Voxtant API", version="0.1.0")

# CORS configuration - read from environment for production deployment
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class IngestUrlRequest(BaseModel):
    url: HttpUrl


class IngestUrlResponse(BaseModel):
    raw_text: str
    title: str
    source: str = "url"


class ExtractRequirementsRequest(BaseModel):
    raw_text: str


class ExtractRequirementsResponse(BaseModel):
    role: str
    skills_core: List[str]
    skills_nice: List[str]
    values: List[str]
    requirements: List[str]


class Question(BaseModel):
    id: str
    type: str  # "behavioral" or "technical"
    text: str
    targets: List[str]  # List of skills/requirements this question assesses


class GeneratePlanRequest(BaseModel):
    extracted: ExtractRequirementsResponse
    resume_text: Optional[str] = None


class GeneratePlanResponse(BaseModel):
    questions: List[Question]
    rubric: Dict[str, List[str]]  # question_id -> list of rubric criteria


# Routes
@app.get("/healthz")
async def health_check():
    return {
        "status": "ok",
        "time": datetime.utcnow().isoformat() + "Z"
    }


@app.post("/ingest_url", response_model=IngestUrlResponse)
async def ingest_url(request: IngestUrlRequest):
    """
    Extract main text and title from a URL.
    Primary: trafilatura (strips scripts/styles/nav automatically).
    Fallback: readability-lxml.
    """
    url_str = str(request.url)

    try:
        # Fetch the page
        response = requests.get(url_str, timeout=10, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        response.raise_for_status()
        html = response.text

        # Primary: Try trafilatura first (best for stripping scripts/styles/nav)
        raw_text = trafilatura.extract(
            html,
            include_comments=False,
            include_tables=False,
            no_fallback=False
        )

        # Fallback: Use readability-lxml if trafilatura returns insufficient content
        if raw_text is None or len(raw_text.strip()) < 50:
            import re
            doc = Document(html)
            raw_text = doc.summary(html_partial=False)
            # Strip HTML tags from readability output
            raw_text = re.sub(r'<[^>]+>', '', raw_text)
            # Additional cleanup: remove extra whitespace
            raw_text = re.sub(r'\s+', ' ', raw_text)

        # Extract title
        title = trafilatura.extract(html, output_format='json', include_comments=False)
        if title:
            import json
            title_data = json.loads(title)
            title = title_data.get('title', 'Untitled')
        else:
            doc = Document(html)
            title = doc.title() or "Untitled"

        # Check if extraction returned meaningful content
        if not raw_text or len(raw_text.strip()) < 20:
            raise HTTPException(
                status_code=422,
                detail="Could not extract meaningful text from URL. Try pasting the text directly instead."
            )

        return IngestUrlResponse(
            raw_text=raw_text.strip(),
            title=title,
            source="url"
        )

    except HTTPException:
        raise
    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


@app.post("/extract_requirements", response_model=ExtractRequirementsResponse)
async def extract_requirements(request: ExtractRequirementsRequest, demo: bool = False):
    """
    Extract structured requirements from raw job posting text.
    Currently returns stub data; will be enhanced with NLP in next milestone.

    Query param ?demo=true returns stable sample data for offline demos.
    """
    if demo:
        # Return stable demo data for presentations
        return ExtractRequirementsResponse(
            role="Senior Full-Stack Engineer",
            skills_core=[
                "React",
                "TypeScript",
                "Node.js",
                "Python",
                "PostgreSQL",
                "REST APIs"
            ],
            skills_nice=[
                "GraphQL",
                "Docker",
                "AWS",
                "CI/CD",
                "Agile/Scrum"
            ],
            values=[
                "Collaboration",
                "Innovation",
                "User-centric design",
                "Continuous learning"
            ],
            requirements=[
                "5+ years of experience in full-stack development",
                "Strong understanding of frontend and backend architecture",
                "Experience with database design and optimization",
                "Excellent communication and teamwork skills",
                "Passion for building scalable, maintainable systems"
            ]
        )

    # TODO: Implement spaCy + sentence-transformers extraction
    # For now, return stub shape
    return ExtractRequirementsResponse(
        role="Unknown",
        skills_core=[],
        skills_nice=[],
        values=[],
        requirements=[]
    )


def generate_fallback_plan(extracted: ExtractRequirementsResponse) -> GeneratePlanResponse:
    """
    Generate deterministic fallback questions when no Gemini API key is available.
    """
    role = extracted.role or "this role"
    skills = extracted.skills_core + extracted.skills_nice
    requirements = extracted.requirements

    # Create a mix of behavioral and technical questions
    questions = [
        Question(
            id="q1",
            type="behavioral",
            text=f"Tell me about a time you demonstrated leadership or took initiative on a project. How did you approach it, and what was the outcome?",
            targets=["leadership", "initiative"] + (requirements[:1] if requirements else [])
        ),
        Question(
            id="q2",
            type="technical",
            text=f"Can you walk me through your experience with {skills[0] if skills else 'the core technologies'} mentioned in the job description? What projects have you used them on?",
            targets=skills[:2] if len(skills) >= 2 else skills
        ),
        Question(
            id="q3",
            type="behavioral",
            text=f"Describe a challenging situation where you had to collaborate with others to solve a problem. What was your role and how did you contribute?",
            targets=["collaboration", "problem-solving"] + (requirements[1:2] if len(requirements) > 1 else [])
        ),
    ]

    rubric = {
        "q1": [
            "Provides context (Situation/Task)",
            "Describes specific first-person actions taken",
            "Explains measurable or observable result",
            "Shows reflection or learning"
        ],
        "q2": [
            "Names specific tools, frameworks, or APIs",
            "Explains technical trade-offs or decisions",
            "Mentions testing, debugging, or optimization",
            "Demonstrates depth of understanding"
        ],
        "q3": [
            "Clearly defines the challenge",
            "Explains their specific role and contributions",
            "Describes collaboration approach",
            "Highlights positive outcome or team impact"
        ]
    }

    return GeneratePlanResponse(questions=questions, rubric=rubric)


def generate_gemini_plan(extracted: ExtractRequirementsResponse, resume_text: Optional[str], api_key: str) -> GeneratePlanResponse:
    """
    Generate interview questions and rubrics using Gemini 2.5 Flash.
    """
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash-exp')

    # Build the prompt
    role = extracted.role or "Unknown Role"
    skills_core = ", ".join(extracted.skills_core) if extracted.skills_core else "None specified"
    skills_nice = ", ".join(extracted.skills_nice) if extracted.skills_nice else "None specified"
    values = ", ".join(extracted.values) if extracted.values else "None specified"
    requirements = "\n".join(f"- {req}" for req in extracted.requirements) if extracted.requirements else "None specified"

    resume_context = ""
    if resume_text:
        resume_context = f"\n\nCandidate's Resume:\n{resume_text[:2000]}\n"  # Limit to 2000 chars

    prompt = f"""You are an expert technical interviewer creating a personalized interview plan.

Job Role: {role}
Core Skills Required: {skills_core}
Nice-to-Have Skills: {skills_nice}
Company Values: {values}
Key Requirements:
{requirements}
{resume_context}

Generate 3-5 interview questions that assess the candidate's fit for this role. Include a mix of:
1. Behavioral questions (using STAR framework) to assess soft skills and past experiences
2. Technical questions to assess hard skills and domain knowledge

For each question, specify:
- Question ID (q1, q2, etc.)
- Type (behavioral or technical)
- Question text
- Target skills/requirements it assesses

Then create a rubric for each question with 3-5 specific criteria an interviewer should look for in a strong answer.

Return your response as JSON in this exact format:
{{
  "questions": [
    {{
      "id": "q1",
      "type": "behavioral",
      "text": "Tell me about a time when...",
      "targets": ["skill1", "requirement1"]
    }}
  ],
  "rubric": {{
    "q1": [
      "Criterion 1",
      "Criterion 2",
      "Criterion 3"
    ]
  }}
}}

IMPORTANT: Return ONLY the JSON, no markdown code blocks or explanations."""

    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Remove markdown code blocks if present
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        # Parse the JSON
        data = json.loads(response_text)

        # Validate and convert to Pydantic models
        questions = [Question(**q) for q in data["questions"]]
        rubric = data["rubric"]

        return GeneratePlanResponse(questions=questions, rubric=rubric)

    except Exception as e:
        # If Gemini fails, return fallback
        print(f"Gemini API error: {str(e)}")
        return generate_fallback_plan(extracted)


@app.post("/generate_plan", response_model=GeneratePlanResponse)
async def generate_plan(request: GeneratePlanRequest, demo: bool = False):
    """
    Generate interview questions and rubrics based on job requirements.
    Uses Gemini 2.5 Flash if GEMINI_API_KEY is set, otherwise returns deterministic fallback.

    Query param ?demo=true returns stable sample data for offline demos.
    """
    if demo:
        # Return stable demo data for presentations
        demo_questions = [
            Question(
                id="q1",
                type="behavioral",
                text="Tell me about a time when you had to architect a complex full-stack feature from scratch. Walk me through your technical decisions and how you ensured code quality.",
                targets=["React", "Node.js", "System Design", "Code Quality"]
            ),
            Question(
                id="q2",
                type="technical",
                text="How would you design a REST API for a high-traffic application? What considerations would you make for scalability, security, and performance?",
                targets=["REST APIs", "PostgreSQL", "Scalability", "Security"]
            ),
            Question(
                id="q3",
                type="behavioral",
                text="Describe a situation where you had to balance competing priorities between product requirements and technical debt. How did you approach this challenge?",
                targets=["Problem-solving", "Communication", "Technical Leadership"]
            ),
            Question(
                id="q4",
                type="technical",
                text="Explain your experience with TypeScript. How do you leverage its type system to write safer, more maintainable code?",
                targets=["TypeScript", "Code Quality", "Best Practices"]
            ),
        ]

        demo_rubric = {
            "q1": [
                "Provides clear context (Situation/Task)",
                "Explains architectural decisions and trade-offs",
                "Describes specific technologies and patterns used",
                "Demonstrates consideration for maintainability and testing",
                "Shows measurable results or positive outcomes"
            ],
            "q2": [
                "Discusses RESTful principles and best practices",
                "Addresses authentication and authorization",
                "Mentions caching, rate limiting, and optimization strategies",
                "Considers database indexing and query optimization",
                "Demonstrates understanding of horizontal scaling"
            ],
            "q3": [
                "Clearly defines the competing priorities",
                "Explains their decision-making process",
                "Describes how they communicated with stakeholders",
                "Shows balance between short-term and long-term thinking",
                "Reflects on lessons learned"
            ],
            "q4": [
                "Discusses advanced TypeScript features (generics, utility types, etc.)",
                "Explains benefits of static typing",
                "Provides concrete examples from past projects",
                "Mentions integration with tooling (linters, IDE support)",
                "Demonstrates understanding of gradual typing strategies"
            ]
        }

        return GeneratePlanResponse(questions=demo_questions, rubric=demo_rubric)

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        # Return fallback questions
        return generate_fallback_plan(request.extracted)

    # Use Gemini to generate questions
    return generate_gemini_plan(request.extracted, request.resume_text, api_key)
