from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

client = AsyncGroq()

SUMMARY_PROMPT = """
You are a 911 dispatch assistant summarizing emergency calls for quick review by operators.

Your task is to create a concise 2-3 sentence summary of the call transcript that captures:
1. The nature of the emergency or request
2. Key details (location, injuries, hazards, etc.)
3. Any immediate action needed or concerns expressed

Be clear, factual, and concise. Focus on information that helps dispatchers quickly understand the situation.
"""

async def get_call_summary(call_transcript: str) -> str:
    """
    Generate a 2-3 sentence summary of a 911 call transcript.

    Args:
        call_transcript: The text of the emergency call

    Returns:
        A concise 2-3 sentence summary of the call
    """
    chat_completion = await client.chat.completions.create(
        messages=[
            {
                "role": "system",
                "content": SUMMARY_PROMPT
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
