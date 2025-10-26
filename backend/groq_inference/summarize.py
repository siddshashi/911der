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

GREETING_PROMPT = """
You are a helpful AI assistant for emergency dispatch. Generate a personalized greeting message for a caller based on their initial emergency description.

The greeting should:
1. Acknowledge their specific emergency situation briefly
2. Ask a relevant, helpful question to immediately assist with their problem
3. Be empathetic and professional
4. Keep it concise (1-2 sentences max)
5. Sound natural and conversational
6. Use only plain text - no formatting, asterisks, quotes, or special characters

Examples:
- Hey, I heard about your emergency with the car accident. Are you or anyone else injured?
- I understand you're dealing with a fire situation. Is everyone safely out of the building?
- I heard about your medical emergency. Can you tell me more about what's happening right now?

Generate a personalized greeting based on the caller's description. Respond with plain text only.
"""

async def generate_personalized_greeting(call_transcript: str) -> str:
    """
    Generate a personalized greeting message based on the caller's emergency description.

    Args:
        call_transcript: The text of the emergency call

    Returns:
        A personalized greeting message
    """
    print(f"🔍 Groq input transcript: '{call_transcript}'")
    try:
        chat_completion = await client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": GREETING_PROMPT
                },
                {
                    "role": "user",
                    "content": call_transcript,
                }
            ],
            model="openai/gpt-oss-20b",
            temperature=0.7,
            top_p=1,
            stream=False,
        )
        content = chat_completion.choices[0].message.content
        if content is None:
            print("⚠️  Groq returned None content")
            return "Hello, how can I help with your emergency?"
        result = content.strip()
        print(f"✅ Groq generated: '{result}'")
        return result
    except Exception as e:
        print(f"❌ Groq error: {e}")
        return "Hello, how can I help with your emergency?"

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
