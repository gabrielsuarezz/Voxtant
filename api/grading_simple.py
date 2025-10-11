# api/grading_simple.py
from __future__ import annotations
from typing import List, Dict, Any, Tuple
import re, math
import os
import google.generativeai as genai
import json

_EMBEDDER = None
_EMBED_ERR = None

def _load_embedder():
    global _EMBEDDER, _EMBED_ERR
    if _EMBEDDER is not None or _EMBED_ERR is not None:
        return
    try:
        from sentence_transformers import SentenceTransformer
        _EMBEDDER = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    except Exception as e:
        _EMBED_ERR = e

def _embed(texts: List[str]) -> List[List[float]]:
    _load_embedder()
    if _EMBEDDER is None:
        return [[0.0]*384 for _ in texts]
    return _EMBEDDER.encode(texts, normalize_embeddings=True).tolist()

def _cosine(a: List[float], b: List[float]) -> float:
    if not a or not b: return 0.0
    s = sum(x*y for x,y in zip(a,b))
    return max(min(s, 1.0), -1.0)

_SENT_SPLIT = re.compile(r'(?<=[\.\?!])\s+|\n+')
def _split_sentences(t: str) -> List[str]:
    t = (t or "").strip()
    if not t: return []
    parts = _SENT_SPLIT.split(t)
    return [p.strip() for p in parts if len(p.strip()) >= 3]

# STAR pattern matchers
_ACTION_VERBS = r"\b(led|built|designed|implemented|debugged|owned|drove|coordinated|launched|migrated|architected|optimized|shipped|improved|reduced|increased|automated|refactored|mentored|collaborated|created|developed|established|managed|executed|delivered)\b"
_CONTEXT_TRIGGERS = r"\b(when|while|as part of|at [A-Za-z]|during|on a project|in my (course|role|internship|position)|for a client|back when|at the time)\b"
_TASK_TRIGGERS = r"\b(needed to|had to|was tasked|was responsible|was asked|goal was|objective was|challenge was|problem was|required to)\b"
_RESULT_TRIGGERS = r"(\b\d+(\.\d+)?(%|x| percent| times)\b|\$\d+|\b(improved|reduced|increased|grew|saved|achieved|delivered|completed).*\d+)"

def extract_star_components(transcript: str) -> Dict[str, List[str]]:
    """Extract actual STAR components from transcript with quotes."""
    t = transcript
    t_lower = transcript.lower()

    components = {
        "situation": [],
        "task": [],
        "action": [],
        "result": []
    }

    sentences = _split_sentences(t)

    for sent in sentences:
        sent_lower = sent.lower()

        # Situation: context-setting sentences
        if re.search(_CONTEXT_TRIGGERS, sent_lower):
            components["situation"].append(sent[:100])  # Truncate long sentences

        # Task: goal/objective mentions
        if re.search(_TASK_TRIGGERS, sent_lower):
            components["task"].append(sent[:100])

        # Action: first-person action verbs
        if re.search(r"\bI\b", sent) and re.search(_ACTION_VERBS, sent_lower):
            components["action"].append(sent[:100])

        # Result: metrics and outcomes
        if re.search(_RESULT_TRIGGERS, sent_lower):
            components["result"].append(sent[:100])

    return components

def star_flags(transcript: str) -> Dict[str,int]:
    t = (transcript or "").lower()
    if not t: return {"S":0,"T":0,"A":0,"R":0}
    has_context = 1 if re.search(_CONTEXT_TRIGGERS, t) else 0
    has_action  = 1 if re.search(_ACTION_VERBS, t) else 0
    has_result  = 1 if re.search(_RESULT_TRIGGERS,  t) else 0
    return {"S":has_context, "T":has_context, "A":has_action, "R":has_result}

def find_missing_skills(transcript: str, job_graph: Dict[str,Any]) -> Tuple[List[str], List[str]]:
    """Identify which job skills were mentioned and which were missed."""
    t_lower = transcript.lower()
    skills = job_graph.get("skills_core", []) + job_graph.get("skills_nice", [])

    mentioned = []
    missed = []

    for skill in skills[:10]:  # Check top 10 skills
        # Check for skill mentions (with some fuzzy matching)
        skill_pattern = re.escape(skill.lower()).replace(r'\ ', r'[\s\-]?')
        if re.search(skill_pattern, t_lower):
            mentioned.append(skill)
        else:
            missed.append(skill)

    return mentioned, missed

def content_score(transcript: str, job_graph: Dict[str,Any]) -> float:
    sents = _split_sentences(transcript)
    if not sents: return 0.0
    reqs   = [r.get("text","") for r in (job_graph.get("requirements") or []) if r.get("text")]
    skills = list(job_graph.get("skills_core") or [])
    tgts   = [*reqs, *skills]
    if not tgts: return 0.5  # neutral if we have no targets

    E_s = _embed(sents)
    E_t = _embed(tgts)

    per_sent = []
    for es in E_s:
        sims = [_cosine(es, et) for et in E_t]
        per_sent.append(max(sims) if sims else 0.0)

    k = max(1, math.ceil(len(per_sent)*0.3))  # top 30% sentences
    topk = sorted(per_sent, reverse=True)[:k]
    return max(0.0, min(sum(topk)/len(topk), 1.0))

def generate_ai_tips(transcript: str, job_graph: Dict[str,Any], star: Dict[str,int],
                     star_components: Dict[str, List[str]], cscore: float) -> List[str]:
    """Use Gemini AI to generate truly personalized, context-aware tips."""
    api_key = os.getenv("GEMINI_API_KEY")

    # Fallback to template tips if no API key
    if not api_key:
        return generate_fallback_tips(transcript, job_graph, star, star_components, cscore)

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-exp')

        # Prepare context
        role = job_graph.get("role", "this role")
        skills_core = ", ".join(job_graph.get("skills_core", [])[:5])
        requirements = "\n".join([f"- {r.get('text', '')}" for r in job_graph.get("requirements", [])[:3]])

        mentioned_skills, missed_skills = find_missing_skills(transcript, job_graph)

        # Build analysis context
        star_analysis = f"""
STAR Framework Detection:
- Situation/Context: {"✓ Present" if star.get("S", 0) == 1 else "✗ Missing"}
- Task/Goal: {"✓ Present" if star.get("T", 0) == 1 else "✗ Missing"}
- Action: {"✓ Present" if star.get("A", 0) == 1 else "✗ Missing"}
- Result/Metrics: {"✓ Present" if star.get("R", 0) == 1 else "✗ Missing"}

Skills Mentioned: {', '.join(mentioned_skills[:5]) if mentioned_skills else "None identified"}
Skills Missed: {', '.join(missed_skills[:5]) if missed_skills else "None"}
Content Relevance Score: {cscore:.2f} (0-1 scale)
"""

        prompt = f"""You are an expert interview coach providing personalized feedback. Analyze this candidate's answer and generate 3-4 specific, actionable tips.

**Job Context:**
Role: {role}
Required Skills: {skills_core}
Key Requirements:
{requirements}

**Candidate's Answer:**
"{transcript}"

**Analysis:**
{star_analysis}

**Your Task:**
Generate 3-4 personalized improvement tips that:
1. QUOTE specific phrases the candidate said (use "You said '...'")
2. Acknowledge what they did well before suggesting improvements
3. Reference specific skills/requirements from the job that are relevant
4. Are encouraging yet actionable
5. Feel personal and conversational, not generic

Return ONLY a JSON array of tip strings:
["tip 1", "tip 2", "tip 3"]

Example good tips:
- "You mentioned 'I led the migration' which shows initiative. Now add: WHAT specific technologies did you use and WHY did you choose them?"
- "When you said 'reduced costs', that's great! Add a specific metric: 'by 30%' or 'saving $50K annually' to make the impact clear."
- "You haven't mentioned [specific missing skill] yet - explain how you used it in THIS specific project to connect your experience to the role."

IMPORTANT: Reference the actual transcript content. Make it feel like you really read and understood their answer."""

        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Parse JSON response
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        tips = json.loads(response_text)

        # Validate it's a list of strings
        if isinstance(tips, list) and len(tips) > 0 and all(isinstance(t, str) for t in tips):
            return tips[:4]
        else:
            print(f"Invalid tips format from Gemini: {tips}")
            return generate_fallback_tips(transcript, job_graph, star, star_components, cscore)

    except Exception as e:
        print(f"Error generating AI tips: {str(e)}")
        return generate_fallback_tips(transcript, job_graph, star, star_components, cscore)


def generate_fallback_tips(transcript: str, job_graph: Dict[str,Any], star: Dict[str,int],
                           star_components: Dict[str, List[str]], cscore: float) -> List[str]:
    """Fallback tips when Gemini is unavailable."""
    tips = []

    if not transcript or len(transcript.strip()) < 20:
        return ["Your answer was too short. Aim for 1-2 minutes to fully demonstrate your experience."]

    if star.get("S", 0) == 0 and star.get("T", 0) == 0:
        tips.append("Start with context: Where and when did this happen? For example, 'When I was working at X company on Y project...'")

    if star.get("A", 0) == 0:
        tips.append("Use strong first-person action verbs. Instead of 'we did', say 'I led', 'I implemented', or 'I designed'.")

    if star.get("R", 0) == 0:
        tips.append("Add measurable results! Quantify your impact with metrics like '30% faster', 'saved $50k', or 'reduced errors by 80%'.")

    mentioned_skills, missed_skills = find_missing_skills(transcript, job_graph)
    if cscore < 0.5 and missed_skills[:2]:
        tips.append(f"Connect your answer to required skills: {', '.join(missed_skills[:2])}.")

    if not tips:
        tips.append("Good structure! To strengthen further, add specific metrics and mention more technical details.")

    return tips[:3]

def grade_answer(payload: Dict[str,Any]) -> Dict[str,Any]:
    transcript = (payload.get("transcript") or "").strip()
    timings = payload.get("timings") or {}
    def _g(*keys, default=None):
        for k in keys:
            if k in timings: return timings[k]
        return default
    wpm   = _g("wordsPerMin","words_per_min", default=0)
    pause = _g("pauseRatio","pause_ratio", default=0.0)
    filler= _g("fillerPerMin","filler_per_min", default=0.0)
    job   = payload.get("job_graph") or {}

    star = star_flags(transcript)
    star_components = extract_star_components(transcript)
    c    = content_score(transcript, job)

    return {
        "content_score": round(c,3),
        "star": star,
        "delivery": {"wpm":wpm, "pauseRatio":pause, "fillerPerMin":filler},
        "tips": generate_ai_tips(transcript, job, star, star_components, c)
    }
