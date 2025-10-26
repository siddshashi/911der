"""
911 Dispatch Voice Agent Server
Handles emergency call classification and AI voice agent for non-emergencies
"""

import asyncio
import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from twilio.twiml.voice_response import VoiceResponse
import uvicorn
from dotenv import load_dotenv
from supabase import create_client, Client
from pydantic import BaseModel

from emergency_classifier import EmergencyClassifier
from twilio_webhook import webhook_handler
from voice_agent import DeepgramVoiceAgent
from groq_inference import get_call_summary, get_criticality_level

load_dotenv()

# Initialize services
emergency_classifier = EmergencyClassifier()

class Caller(BaseModel):
    latitude: float
    longitude: float
    severity: int
    metadata: str

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    print("🎤 Voice Agent WebSocket available on /twilio")
    yield

app = FastAPI(
    title="911 Dispatch Voice Agent",
    description="Emergency call classification and AI voice agent system",
    version="1.0.0",
    lifespan=lifespan
)

@app.get("/")
def root():
    """Root endpoint"""
    return {"message": "911 Dispatch Voice Agent API"}

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "911 Dispatch Voice Agent is running",
        "endpoints": {
            "voice_webhook": "/webhook/voice",
            "process_speech": "/webhook/process-speech",
            "voice_agent_websocket": "/twilio"
        }
    }

@app.post("/")
async def handle_root_post(request: Request):
    """Handle POST requests to root endpoint (fallback for Twilio webhooks)"""
    try:
        form_data = await request.form()
        call_sid = form_data.get("CallSid")
        from_number = form_data.get("From")
        
        print(f"📞 Incoming call from {from_number}, CallSid: {call_sid}")
        
        response = VoiceResponse()
        response.redirect("/webhook/voice")
        return Response(content=str(response), media_type="application/xml")
        
    except Exception as e:
        print(f"❌ Error handling root POST: {e}")
        response = VoiceResponse()
        response.say("I'm sorry, there was an error. Please try again.")
        response.hangup()
        return Response(content=str(response), media_type="application/xml")

@app.post("/webhook/voice")
async def handle_incoming_call(request: Request):
    """Handle incoming Twilio voice calls"""
    try:
        call_data = await webhook_handler.extract_call_data(request)
        await webhook_handler.log_webhook_request(request, "/webhook/voice", call_data)
        
        twiml_response = webhook_handler.create_voice_response(
            message="Nine one one, what is your emergency.",
            gather_config={
                'input': 'speech',
                'action': '/webhook/process-speech',
                'method': 'POST',
                'speech_timeout': 2,
                'timeout': 15,
                'language': 'en-US'
            }
        )
        
        return Response(content=twiml_response, media_type="application/xml")
        
    except Exception as e:
        print(f"❌ Error handling incoming call: {e}")
        error_response = webhook_handler.create_hangup_response(
            "I'm sorry, there was an error. Please try again."
        )
        return Response(content=error_response, media_type="application/xml")

@app.post("/webhook/process-speech")
async def process_speech(request: Request):
    """Process speech input and classify emergency vs non-emergency"""
    try:
        call_data = await webhook_handler.extract_call_data(request)
        speech_result = call_data.get("speech_result", "")
        
        await webhook_handler.log_webhook_request(request, "/webhook/process-speech", call_data)
        
        print(f"🎤 Speech: {speech_result}")
        print(f"🎯 Confidence: {call_data.get('confidence', 'N/A')}")
        
        if not speech_result.strip():
            print("⚠️  No speech detected, asking again")
            twiml_response = webhook_handler.create_voice_response(
                message="I didn't catch that. Please tell me what's happening.",
                gather_config={
                    'input': 'speech',
                    'action': '/webhook/process-speech',
                    'method': 'POST',
                    'speech_timeout': 2,
                    'timeout': 15,
                    'language': 'en-US'
                }
            )
            return Response(content=twiml_response, media_type="application/xml")
        
        # Classify the call using AI
        print("🤖 Classifying call...")
        classification_result = await emergency_classifier.classify_call(speech_result)
        speech_summary = await get_call_summary(speech_result)
        severity_as_enum = await get_criticality_level(speech_result)
        print("Speech Summary", speech_summary)
        enum_to_int = {"CRITICAL": 4, "HIGH":3, "MEDIUM":2, "LOW":1}
        if severity_as_enum not in enum_to_int:
            print("Severity errored, defaulting to HIGH")
            severity_as_enum = "HIGH"
        else:
            print("Severity:", severity_as_enum)
        
        print(f"📊 Classification: {classification_result}")
        
        # Sid's code: sending to supabase
        
        severity = enum_to_int[severity_as_enum]
        caller_data = {
                "latitude": 37.8029,
                "longitude": -122.44879,
                "severity": severity,
                "metadata": speech_summary
                }
        response = supabase.table("callers").insert(caller_data).execute()
        print(f"saved caller to database: {response}")
        
        if classification_result["is_emergency"]:
            # Emergency - transfer to human dispatcher
            emergency_number = os.getenv("EMERGENCY_DISPATCH_PHONE_NUMBER")
            print(f"🚨 EMERGENCY - Transferring to {emergency_number}")
            
            twiml_response = webhook_handler.create_dial_response(
                phone_number=emergency_number,
                message="This appears to be an emergency. I'm transferring you to a human dispatcher now."
            )
        else:
            # Non-emergency - connect to AI voice agent
            print("📞 Non-emergency - connecting to AI voice agent")
            
            voice_agent_url = os.getenv("VOICE_AGENT_WS_URL", "wss://your-ngrok-url.ngrok.io/twilio")
            
            response = VoiceResponse()
            response.say("Connecting you to an assistant now.")
            response.connect().stream(url=voice_agent_url)
            
            twiml_response = str(response)
        
        return Response(content=twiml_response, media_type="application/xml")
        
    except Exception as e:
        print(f"❌ Error processing speech: {e}")
        error_response = webhook_handler.create_hangup_response(
            "I'm sorry, there was an error processing your request."
        )
        return Response(content=error_response, media_type="application/xml")

@app.websocket("/twilio")
async def voice_agent_websocket(websocket: WebSocket):
    """WebSocket endpoint for Deepgram voice agent"""
    print("🎤 WebSocket connection received on /twilio")
    await websocket.accept()
    print("✅ WebSocket connection accepted")
    
    try:
        # Create compatibility wrapper for FastAPI WebSocket
        class FastAPIWebSocketWrapper:
            def __init__(self, websocket):
                self.websocket = websocket
                self.closed = False
            
            async def send(self, data):
                if isinstance(data, str):
                    await self.websocket.send_text(data)
                else:
                    await self.websocket.send_bytes(data)
            
            async def recv(self):
                return await self.websocket.receive_text()
            
            async def close(self, code=None, reason=None):
                self.closed = True
                await self.websocket.close(code=code, reason=reason)
            
            def __aiter__(self):
                return self
            
            async def __anext__(self):
                if self.closed:
                    raise StopAsyncIteration
                try:
                    return await self.websocket.receive_text()
                except WebSocketDisconnect:
                    self.closed = True
                    raise StopAsyncIteration
        
        # Use the voice agent
        wrapped_websocket = FastAPIWebSocketWrapper(websocket)
        voice_agent = DeepgramVoiceAgent()
        await voice_agent.twilio_handler(wrapped_websocket)
        
    except WebSocketDisconnect:
        print("🔌 WebSocket disconnected")
    except Exception as e:
        print(f"❌ Error in voice agent: {e}")
        try:
            await websocket.close(code=1011, reason="Voice agent error")
        except:
            pass

def main():
    """Start the server"""
    print("🏥 911 Dispatch Voice Agent System")
    print("=" * 40)
    
    # Check required environment variables
    required_vars = [
        "DEEPGRAM_API_KEY",
        "TWILIO_ACCOUNT_SID", 
        "TWILIO_AUTH_TOKEN",
        "GROQ_API_KEY"
    ]
    
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        print(f"❌ Missing environment variables: {', '.join(missing_vars)}")
        print("Please set these in your .env file")
        sys.exit(1)
    
    # Check voice agent URL
    voice_agent_url = os.getenv("VOICE_AGENT_WS_URL")
    if not voice_agent_url or "your-ngrok-url" in voice_agent_url:
        print("⚠️  VOICE_AGENT_WS_URL not configured")
        print("Please set VOICE_AGENT_WS_URL to your ngrok WebSocket URL")
        print("Example: wss://abc123.ngrok.io/twilio")
    
    print("✅ Environment configured")
    print("🚀 Starting server on port 8000...")
    print()
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

if __name__ == "__main__":
    main()
