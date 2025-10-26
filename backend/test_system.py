"""
Test suite for the 911 Dispatch Voice Agent system
Tests emergency classification and system configuration
"""

import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from emergency_classifier import EmergencyClassifier

load_dotenv()

class SystemTester:
    """Test the voice agent system"""
    
    def __init__(self):
        self.classifier = EmergencyClassifier()
    
    async def test_emergency_classification(self):
        """Test emergency classification with various scenarios"""
        print("🧪 Testing Emergency Classification")
        print("=" * 40)
        
        test_cases = [
            {
                "transcript": "I need help, there's a fire in my building!",
                "expected": "EMERGENCY",
                "description": "Fire emergency"
            },
            {
                "transcript": "Someone is having a heart attack, please send an ambulance!",
                "expected": "EMERGENCY", 
                "description": "Medical emergency"
            },
            {
                "transcript": "I want to know about the current incident in downtown",
                "expected": "NON_EMERGENCY",
                "description": "Information request"
            },
            {
                "transcript": "What's the status of the traffic situation?",
                "expected": "NON_EMERGENCY",
                "description": "Status inquiry"
            },
            {
                "transcript": "There's been a robbery at the bank, send police now!",
                "expected": "EMERGENCY",
                "description": "Crime in progress"
            }
        ]
        
        passed = 0
        total = len(test_cases)
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\nTest {i}: {test_case['description']}")
            print(f"Transcript: \"{test_case['transcript']}\"")
            
            try:
                result = await self.classifier.classify_call(test_case['transcript'])
                is_emergency = result['is_emergency']
                classification = result['classification']
                confidence = result['confidence']
                
                print(f"Result: {classification} (Emergency: {is_emergency})")
                print(f"Confidence: {confidence}")
                
                # Check if result matches expected
                expected_emergency = test_case['expected'] == 'EMERGENCY'
                if is_emergency == expected_emergency:
                    print("✅ PASS")
                    passed += 1
                else:
                    print("❌ FAIL - Classification mismatch")
                    
            except Exception as e:
                print(f"❌ ERROR: {e}")
        
        print(f"\n📊 Results: {passed}/{total} tests passed")
        return passed == total
    
    def test_environment_configuration(self):
        """Test environment configuration"""
        print("\n🔧 Testing Environment Configuration")
        print("=" * 40)
        
        # Check required environment variables
        required_vars = [
            "DEEPGRAM_API_KEY",
            "TWILIO_ACCOUNT_SID",
            "TWILIO_AUTH_TOKEN", 
            "GROQ_API_KEY",
            "VOICE_AGENT_WS_URL"
        ]
        
        missing_vars = []
        for var in required_vars:
            value = os.getenv(var)
            if not value:
                missing_vars.append(var)
                print(f"❌ {var}: Not set")
            elif "your-ngrok-url" in value:
                missing_vars.append(var)
                print(f"⚠️  {var}: {value} (needs to be updated)")
            else:
                print(f"✅ {var}: Set")
        
        if missing_vars:
            print(f"\n❌ Missing or invalid variables: {', '.join(missing_vars)}")
            return False
        else:
            print("\n✅ All environment variables configured")
            return True
    
    def test_websocket_url(self):
        """Test WebSocket URL format"""
        print("\n🔌 Testing WebSocket URL")
        print("=" * 40)
        
        url = os.getenv("VOICE_AGENT_WS_URL")
        if not url:
            print("❌ VOICE_AGENT_WS_URL not set")
            return False
        
        if url.startswith("wss://"):
            print("✅ URL uses secure WebSocket (wss://)")
        elif url.startswith("ws://"):
            print("⚠️  URL uses unsecured WebSocket (ws://) - not recommended for production")
        else:
            print("❌ URL should start with wss:// or ws://")
            return False
        
        if "/twilio" in url:
            print("✅ URL includes /twilio path")
        else:
            print("⚠️  URL should end with /twilio")
        
        print(f"Full URL: {url}")
        return True
    
    async def run_all_tests(self):
        """Run all tests"""
        print("🏥 911 Dispatch Voice Agent System Test")
        print("=" * 50)
        
        # Test 1: Emergency Classification
        classification_ok = await self.test_emergency_classification()
        
        # Test 2: Environment Configuration
        config_ok = self.test_environment_configuration()
        
        # Test 3: WebSocket URL
        url_ok = self.test_websocket_url()
        
        # Summary
        print("\n📊 Test Summary")
        print("=" * 50)
        
        all_passed = classification_ok and config_ok and url_ok
        
        if all_passed:
            print("✅ All tests passed! System is ready for testing.")
            print("\nNext steps:")
            print("1. Start ngrok: ngrok http 8000")
            print("2. Update VOICE_AGENT_WS_URL in .env")
            print("3. Run: python server.py")
            print("4. Call your Twilio number to test")
        else:
            print("❌ Some tests failed. Please fix the issues above.")
        
        return all_passed

async def main():
    """Run the test suite"""
    tester = SystemTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())