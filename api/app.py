from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
import os
from dotenv import load_dotenv
import google.generativeai as genai
import json
import asyncio
import websockets
import base64

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


def extract_with_gemini(raw_text: str, api_key: str) -> ExtractRequirementsResponse:
    """Use Gemini AI to intelligently extract structured data from job posting."""
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash-exp')

    prompt = f"""You are an expert at analyzing job postings. Extract the following information from the job posting below:

1. **Role/Title**: The job title or position name
2. **Core Skills**: Required technical skills, tools, or technologies (list up to 10)
3. **Nice-to-Have Skills**: Preferred/bonus skills mentioned (list up to 8)
4. **Company Values**: Cultural values or soft skills emphasized (list up to 6)
5. **Key Requirements**: Specific qualifications or experience requirements (list up to 10)

Job Posting:
{raw_text[:4000]}

Return your response as JSON in this exact format:
{{
  "role": "Job Title Here",
  "skills_core": ["skill1", "skill2", "skill3"],
  "skills_nice": ["skill1", "skill2"],
  "values": ["value1", "value2"],
  "requirements": ["requirement1", "requirement2"]
}}

Guidelines:
- For skills, extract specific technologies, programming languages, frameworks, tools
- For values, look for soft skills, cultural fit, teamwork mentions
- For requirements, extract concrete qualifications like years of experience, education, certifications
- If a field cannot be determined, use an empty array
- Return ONLY the JSON, no markdown code blocks or explanations"""

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

        return ExtractRequirementsResponse(
            role=data.get("role", "Unknown Role"),
            skills_core=data.get("skills_core", []),
            skills_nice=data.get("skills_nice", []),
            values=data.get("values", []),
            requirements=data.get("requirements", [])
        )

    except Exception as e:
        # Fallback to basic extraction if Gemini fails
        print(f"Gemini extraction error: {str(e)}")
        return ExtractRequirementsResponse(
            role="Unknown Role",
            skills_core=[],
            skills_nice=[],
            values=[],
            requirements=[]
        )


@app.post("/extract_requirements", response_model=ExtractRequirementsResponse)
async def extract_requirements(request: ExtractRequirementsRequest, demo: bool = False):
    """
    Extract structured requirements from raw job posting text.
    Uses Gemini AI for intelligent, context-aware extraction.

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

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY not configured. Please add your API key to api/.env file."
        )

    # Use Gemini AI to extract structured data
    return extract_with_gemini(request.raw_text, api_key)


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


@app.websocket("/ws/interview")
async def websocket_interview(websocket: WebSocket):
    """
    WebSocket endpoint for live audio interview streaming.
    Proxies audio between client and Gemini Live API.
    """
    await websocket.accept()
    print("WebSocket connection accepted")

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        await websocket.close(code=1008, reason="GEMINI_API_KEY not configured")
        return

    gemini_ws = None

    try:
        # Connect to Gemini Live API
        gemini_url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={api_key}"

        print("Connecting to Gemini Live API...")
        gemini_ws = await websockets.connect(gemini_url)
        print("Connected to Gemini Live API")

        # Send initial setup message to Gemini
        setup_message = {
            "setup": {
                "model": "models/gemini-2.0-flash-exp",
                "generation_config": {
                    "response_modalities": ["AUDIO"],
                    "speech_config": {
                        "voice_config": {
                            "prebuilt_voice_config": {
                                "voice_name": "Puck"
                            }
                        }
                    }
                },
                "system_instruction": {
                    "parts": [{
                        "text": "You are an AI interviewer conducting a mock job interview. Your role is to:\n1. Greet the candidate warmly and introduce yourself\n2. Ask interview questions ONE AT A TIME and wait for responses\n3. Listen carefully to each answer before asking the next question\n4. Provide brief follow-up questions when appropriate\n5. Be professional but conversational\n6. Keep your responses concise and clear\n\nAlways speak your questions out loud - do not just list them. Ask one question, wait for the answer, then ask the next."
                    }]
                }
            }
        }

        await gemini_ws.send(json.dumps(setup_message))
        print("Sent setup message to Gemini")

        # Task to forward audio from client to Gemini
        async def client_to_gemini():
            try:
                while True:
                    audio_chunk = await websocket.receive_bytes()

                    # Convert to base64 and send to Gemini
                    audio_b64 = base64.b64encode(audio_chunk).decode('utf-8')
                    message = {
                        "realtime_input": {
                            "media_chunks": [{
                                "mime_type": "audio/pcm",
                                "data": audio_b64
                            }]
                        }
                    }
                    await gemini_ws.send(json.dumps(message))

            except WebSocketDisconnect:
                print("Client disconnected")
            except Exception as e:
                print(f"Error client->gemini: {e}")

        # Task to forward audio from Gemini to client
        async def gemini_to_client():
            try:
                async for message in gemini_ws:
                    data = json.loads(message)

                    # Check for audio in response
                    if "serverContent" in data:
                        server_content = data["serverContent"]
                        if "modelTurn" in server_content:
                            parts = server_content["modelTurn"].get("parts", [])
                            for part in parts:
                                if "inlineData" in part:
                                    audio_b64 = part["inlineData"].get("data", "")
                                    if audio_b64:
                                        # Decode and send to client
                                        audio_bytes = base64.b64decode(audio_b64)
                                        await websocket.send_bytes(audio_bytes)

                    # Log other message types
                    if "setupComplete" in data:
                        print("Gemini setup complete")

                        # Send initial prompt to start the interview
                        initial_message = {
                            "client_content": {
                                "turns": [{
                                    "role": "user",
                                    "parts": [{
                                        "text": "Hello! I'm ready to start the mock interview. Please begin by introducing yourself and asking me the first question."
                                    }]
                                }],
                                "turn_complete": True
                            }
                        }
                        await gemini_ws.send(json.dumps(initial_message))
                        print("Sent initial prompt to Gemini")

            except Exception as e:
                print(f"Error gemini->client: {e}")

        # Run both tasks concurrently
        await asyncio.gather(
            client_to_gemini(),
            gemini_to_client()
        )

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        await websocket.close(code=1011, reason=str(e))
    finally:
        if gemini_ws:
            await gemini_ws.close()
            print("Closed Gemini connection")
