from groq import AsyncGroq
from dotenv import load_dotenv
import asyncio

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

if __name__ == "__main__":
    # Sample usage
    sample_transcripts = [
        "My house is on fire and my family is trapped inside! We're on the second floor and the stairs are blocked. Please hurry, there's smoke everywhere!",
        "I need help, my neighbor fell off a ladder and he's not moving. He's bleeding from his head. We're at 123 Main Street.",
        "There's been a car accident on Highway 101 near the exit to downtown. Multiple cars involved, I can see people injured."
    ]

    async def demo():
        print("911 Call Summary Generator Demo")
        print("=" * 60)

        for i, transcript in enumerate(sample_transcripts, 1):
            print(f"\nCall #{i}:")
            print(f"Transcript: {transcript}")
            print("\nGenerating summary...")

            summary = await get_call_summary(transcript)
            print(f"Summary: {summary}")
            print("-" * 60)

    asyncio.run(demo())
