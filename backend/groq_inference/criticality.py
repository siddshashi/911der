from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

client = AsyncGroq()

SYSTEM_PROMPT = """
You are a 911 switch operator receiving calls immediately after a large-scale disaster event. Resources are severely limited and you must prioritize which calls need immediate response versus those that can wait.

Your ONLY task is to assess the criticality level of each call and respond with EXACTLY ONE WORD: LOW, MEDIUM, HIGH, or CRITICAL

Classification criteria:

CRITICAL - Immediate life-threatening emergency requiring instant response:
  • Confirmed active fire with people trapped
  • Building collapse with victims underneath
  • People not breathing, unconscious, or severe bleeding
  • Imminent explosions or hazardous material exposure
  • Multiple casualties confirmed

HIGH - Urgent and potentially life-threatening, needs rapid attention:
  • Spreading fires approaching occupied structures
  • Serious injuries with active bleeding
  • Downed power lines near people
  • Structural damage with potential collapse risk

MEDIUM - Distressing situation but no immediate confirmed danger:
  • Smell of smoke without visible fire
  • Welfare checks on missing neighbors
  • People trapped but currently safe
  • Uncertain threats or unconfirmed hazards

LOW - Minor issues, information requests, can wait:
  • Questions about evacuation centers or safe zones
  • General safety inquiries without specific threat
  • Property damage without immediate danger
  • Resource location requests (water, supplies)

When in doubt between two levels, consider: Is there confirmed immediate danger to life? If yes, escalate. If uncertain, choose the lower level.

Output ONLY the classification level, nothing else.
"""

async def get_criticality_level(call_transcript: str) -> str:
    """
    Assess the criticality level of a 911 call transcript.

    Args:
        call_transcript: The text of the emergency call

    Returns:
        The criticality level: LOW, MEDIUM, HIGH, or CRITICAL
    """
    chat_completion = await client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": call_transcript,
            }
        ],
        model="openai/gpt-oss-20b",
        temperature=0.5,
        top_p=1,
        stream=False,
    )
    content = chat_completion.choices[0].message.content
    if content is None:
        return "ERROR: No content returned"
    return content.strip()
