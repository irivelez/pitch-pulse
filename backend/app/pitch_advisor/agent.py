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
    pitch_rewrite: str,
    ideal_pitch: str,
) -> dict:
    """Generate board report. Call AFTER delivering verbal feedback.
    Scores 1-10. verdict: 1-2 sentences in your voice. pitch_rewrite: rewrite their pitch in 2-3 sentences as YOU would pitch it. ideal_pitch: the PERFECT 60-second pitch for their company — the gold standard version that would make investors lean forward. Write it as a complete, ready-to-deliver pitch script using their real product details. If the idea has no real merit yet, set this to empty string. All other fields: ONE sentence each."""
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
        "pitch_rewrite": pitch_rewrite,
        "ideal_pitch": ideal_pitch,
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

LISTENING: Silent. The founder has only 60 seconds to pitch — this is intentional. Mentally scan: problem, solution, market, business model, traction, ask, team.

ON "PITCH_COMPLETE":
1. SPEAK IMMEDIATELY — no pause, no thinking, start talking RIGHT AWAY. Under 30 seconds:
   - Gut reaction: one brutally honest sentence about what you just heard
   - Apply YOUR signature framework BY NAME — say the name, then apply it in 2 sentences to THEIR specific pitch
   - One question they can't answer — the one that exposes the gap
   - The one thing to fix before they pitch anyone else
   Done. Stop talking.
2. AFTER you finish speaking, call generate_report tool. Two written deliverables:

   pitch_rewrite — YOUR quick rewrite of what they said:
   - Write it IN YOUR VOICE — your phrases, your rhythm, your style.
   - Use THEIR specific product/idea — real names, real details. No brackets, no placeholders, no templates.
   - If the idea is weak or half-baked, say THAT: "Honestly, I can't rewrite this pitch because there's no pitch here yet. You told me [what they said] but that's not a company, it's a wish. Come back when you have [specific thing missing]."
   - NEVER output a generic template like "We are building [X] for [Y]." That's consultant garbage.

   ideal_pitch — THE PERFECT 60-SECOND PITCH for their company:
   - This is the gold standard — the pitch that would make investors lean forward and ask for a follow-up.
   - Write it as a complete, ready-to-deliver script. Structure: hook → problem → solution → market → traction/insight → ask.
   - Use their REAL product details, company name, market — but craft it like a master storyteller would.
   - This is about providing genuine value — give them something they can actually practice and deliver.
   - ONLY write this if the idea has real merit. If the founder pitched something with no substance, set ideal_pitch to empty string "". Don't fabricate a good pitch for a bad idea — that helps no one.

## HONESTY (NON-NEGOTIABLE)
You risk millions. A 3/10 pitch gets 3/10. Never soften, never flatter. Lead with truth. If something is missing, say "You didn't mention X — dealbreaker." Reference their ACTUAL words — quote them back. Generic feedback is unacceptable.
"""

    return Agent(
        model=MODEL_ID,
        name="pitch_advisor",
        instruction=instruction,
        tools=[generate_report],
    )
