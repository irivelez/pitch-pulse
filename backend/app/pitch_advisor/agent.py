import os
from pathlib import Path
from google.adk.agents import Agent
from dotenv import load_dotenv

load_dotenv()

PERSONAS_DIR = Path(__file__).parent / "personas"
MODEL_ID = os.getenv("MODEL_ID", "gemini-live-2.5-flash-native-audio")

import re


def _parse_persona_meta(filepath: Path) -> dict:
    """Extract name, tagline, and domain from a persona markdown file."""
    content = filepath.read_text()
    key = filepath.stem  # filename without .md

    # Extract name from first H1: "# Paul Graham -- Pitch Advisor" or "# Paul Graham"
    name_match = re.search(r'^#\s+(.+?)(?:\s*[-—]+.*)?$', content, re.MULTILINE)
    name = name_match.group(1).strip() if name_match else key.replace('_', ' ').title()

    # Extract domain from *Domain:* or **Domain:** line
    domain_match = re.search(r'\*{1,2}Domain:\*{1,2}\s*(.+)', content)
    tagline = domain_match.group(1).strip() if domain_match else ""

    # Fallback: extract from *Known for:* or **Known for:**
    if not tagline:
        known_match = re.search(r'\*{1,2}Known for:\*{1,2}\s*(.+)', content)
        tagline = known_match.group(1).strip() if known_match else ""

    return {"key": key, "name": name, "tagline": tagline}


def discover_personas() -> dict:
    """Auto-discover all persona .md files in the personas directory."""
    personas = {}
    if PERSONAS_DIR.exists():
        for md_file in sorted(PERSONAS_DIR.glob("*.md")):
            meta = _parse_persona_meta(md_file)
            personas[meta["key"]] = {"name": meta["name"], "tagline": meta["tagline"]}
    return personas


# Auto-discover on import — refreshed via API if needed
PERSONA_META = discover_personas()


def generate_report(
    overall_score: int,
    problem_clarity: int,
    solution_strength: int,
    market_understanding: int,
    business_model: int,
    ask_clarity: int,
    delivery_score: int,
    verdict: str,
    top_strength: str,
    top_weakness: str,
    killer_question: str,
    one_thing_to_fix: str,
) -> dict:
    """Generate board report. Call AFTER delivering verbal feedback.
    Scores 1-10. verdict: 1-2 sentences in your voice. All other fields: ONE sentence each."""
    return {
        "type": "board_report",
        "scores": {
            "overall": overall_score,
            "problem_clarity": problem_clarity,
            "solution_strength": solution_strength,
            "market_understanding": market_understanding,
            "business_model": business_model,
            "ask_clarity": ask_clarity,
            "delivery": delivery_score,
        },
        "verdict": verdict,
        "top_strength": top_strength,
        "top_weakness": top_weakness,
        "killer_question": killer_question,
        "one_thing_to_fix": one_thing_to_fix,
    }


def load_persona_content(persona_key: str) -> str:
    """Load persona content, stripping blockquote examples to reduce token count."""
    persona_file = PERSONAS_DIR / f"{persona_key}.md"
    if persona_file.exists():
        lines = persona_file.read_text().splitlines()
        # Keep everything except blockquote example lines (> "...")
        filtered = [l for l in lines if not l.strip().startswith('>')]
        return "\n".join(filtered)
    return ""


def create_agent(persona_key: str) -> Agent:
    persona_content = load_persona_content(persona_key)
    # Re-discover in case new files were added
    meta = discover_personas().get(persona_key, {"name": "Advisor", "tagline": ""})

    instruction = f"""You ARE {meta['name']}. Speak in your voice — signature phrases, tone, patterns.

## YOUR IDENTITY & FRAMEWORKS
{persona_content}

## PROTOCOL

GREETING: One sentence, max 10 words. Your name + "pitch me." Then STOP.

LISTENING: Silent. Mentally scan: problem, solution, market, business model, traction, ask, team.

ON "PITCH_COMPLETE":
1. SPEAK IMMEDIATELY — no pause, no thinking, start talking RIGHT AWAY. Under 30 seconds:
   - One gut reaction sentence
   - Name your top framework, apply it in 2 sentences
   - One hard question
   - One concrete fix
   Done. Stop.
2. AFTER you finish speaking, call generate_report tool with your scores and analysis.

## HONESTY (NON-NEGOTIABLE)
You risk millions. A 3/10 pitch gets 3/10. Never soften, never flatter. Lead with truth. If something is missing, say "You didn't mention X — dealbreaker." Reference their actual words.
"""

    return Agent(
        model=MODEL_ID,
        name="pitch_advisor",
        instruction=instruction,
        tools=[generate_report],
    )
