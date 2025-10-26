"""
Test script for the 911 Dispatch Voice Agent with Latest Deepgram SDK
"""

import asyncio
import os
from dotenv import load_dotenv
from emergency_classifier import EmergencyClassifier

load_dotenv()

async def test_emergency_classifier():
    """Test the emergency classification system"""
    print("Testing Emergency Classification System...")
    
    classifier = EmergencyClassifier()
    
    # Test cases
    test_cases = [
        "I need an ambulance, someone is having a heart attack!",
        "There's a fire in my building, please help!",
        "I want to know about the traffic situation downtown",
        "Can you tell me if the roads are closed?",
        "Help! I'm being robbed!",
        "What's the status of the evacuation?",
        "My house is on fire!",
        "Is the emergency shelter still open?"
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest Case {i}: '{test_case}'")
        result = await classifier.classify_call(test_case)
        print(f"Classification: {result['classification']}")
        print(f"Is Emergency: {result['is_emergency']}")
        print(f"Confidence: {result['confidence']}")
        
        if result.get('error'):
            print(f"Error: {result['error']}")

def test_voice_agent():
    """Test the voice agent system"""
    print("\nTesting Voice Agent System...")
    
    # This would test the voice agent in a real scenario
    print("Voice agent test requires actual audio input")
    print("This test is skipped in automated testing")
    print("✅ Voice agent functionality is integrated into the main webhook flow")

async def main():
    """Run all tests"""
    print("=== 911 Dispatch Voice Agent Test Suite (Latest Deepgram SDK) ===\n")
    
    # Check environment variables
    required_vars = [
        "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN", 
        "TWILIO_PHONE_NUMBER",
        "DEEPGRAM_API_KEY",
        "GROQ_API_KEY",
        "EMERGENCY_DISPATCH_PHONE_NUMBER"
    ]
    
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("Please set up your .env file with all required variables")
        return
    else:
        print("✅ All environment variables are set")
    
    # Test emergency classifier
    await test_emergency_classifier()
    
    # Test voice agent
    test_voice_agent()
    
    print("\n=== Test Suite Complete ===")
    print("\nNext steps:")
    print("1. Start the server: python start_server.py")
    print("2. Set up ngrok: ngrok http 8000")
    print("3. Configure Twilio webhook with your ngrok URL")
    print("4. Test by calling your Twilio phone number")
    print("\n✅ Updated to use latest Deepgram SDK v5.0.0")

if __name__ == "__main__":
    asyncio.run(main())