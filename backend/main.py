from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from supabase import create_client, Client
from pydantic import BaseModel
import datetime
import json
import asyncio

import os
from fastapi import FastAPI, Request
from fastapi.responses import Response
from twilio.twiml.voice_response import VoiceResponse
from twilio.rest import Client
from dotenv import load_dotenv

from emergency_classifier import EmergencyClassifier
from twilio_webhook import webhook_handler

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = "https://kgrgpyfhpxbeymuamndi.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtncmdweWZocHhiZXltdWFtbmRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTk0NTQsImV4cCI6MjA3Njk5NTQ1NH0.oqCw6wA45LElpZ1yQwSBWl5EHzqKzsDrdOHp1GhiFSE"

# Load environment variables
load_dotenv()

# Initialize services
emergency_classifier = EmergencyClassifier()

# Twilio client
twilio_client = Client(
    os.getenv("TWILIO_ACCOUNT_SID"),
    os.getenv("TWILIO_AUTH_TOKEN")
)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class Caller(BaseModel):
    latitude: float
    longitude: float
    severity: int
    metadata: str

@app.post("/callers/")
async def add_caller(caller: Caller):
    as_dict = caller.dict(exclude_unset=True)
    response = supabase.table("callers").insert(as_dict).execute()

    return response.data[0]

@app.get("/callers/")
async def get_callers():
    """Get all emergency calls from Supabase"""
    response = supabase.table("callers").select("*").order("created_at", desc=True).execute()
    return response.data

@app.get("/callers/stream")
async def stream_callers():
    """Server-Sent Events endpoint for real-time emergency call updates"""
    async def event_stream():
        # Track the last ID we've seen instead of timestamp (more reliable)
        last_seen_id = 0
        
        # Send initial data and get the highest ID
        initial_response = supabase.table("callers").select("*").order("created_at", desc=True).limit(10).execute()
        if initial_response.data:
            last_seen_id = max(caller['id'] for caller in initial_response.data)
            data = {
                "type": "initial",
                "callers": initial_response.data,
                "count": len(initial_response.data),
                "last_id": last_seen_id,
                "timestamp": datetime.datetime.now().isoformat()
            }
            yield f"data: {json.dumps(data)}\n\n"
        
        while True:
            try:
                # Query for records with ID greater than last seen (much more reliable than timestamps)
                response = supabase.table("callers").select("*").gt("id", last_seen_id).order("id", desc=False).execute()
                
                new_callers = response.data if response.data else []
                
                if new_callers:
                    # Update last seen ID to the highest new ID
                    last_seen_id = max(caller['id'] for caller in new_callers)
                    
                    # Only send the NEW callers
                    data = {
                        "type": "new_callers",
                        "new_callers": new_callers,
                        "count": len(new_callers),
                        "last_id": last_seen_id,
                        "timestamp": datetime.datetime.now().isoformat()
                    }
                    yield f"data: {json.dumps(data)}\n\n"
                else:
                    # Send heartbeat to keep connection alive
                    heartbeat = {
                        "type": "heartbeat",
                        "last_id": last_seen_id,
                        "timestamp": datetime.datetime.now().isoformat()
                    }
                    yield f"data: {json.dumps(heartbeat)}\n\n"
                
                # Wait 2 seconds before next check
                await asyncio.sleep(2)
            except Exception as e:
                # Send error message and continue
                error_data = {
                    "type": "error",
                    "message": str(e),
                    "timestamp": datetime.datetime.now().isoformat()
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                await asyncio.sleep(5)  # Wait longer on error
    
    return StreamingResponse(event_stream(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control"
    })

@app.get("/")
def read_root():
    return {"message": "911 Dispatch Voice Agent API"}

@app.get("/health")
def health_check():
    """Health check endpoint for debugging"""
    return {
        "status": "healthy",
        "message": "911 Dispatch Voice Agent is running",
        "endpoints": {
            "voice_webhook": "/webhook/voice",
            "process_speech": "/webhook/process-speech",
            "continue_conversation": "/webhook/continue-conversation",
            "timeout": "/webhook/timeout",
            "status": "/webhook/status"
        }
    }

@app.post("/")
async def handle_root_post(request: Request):
    """
    Handle POST requests to root endpoint (fallback for Twilio webhooks)
    """
    try:
        # Get form data properly
        form_data = await request.form()
        call_sid = form_data.get("CallSid")
        from_number = form_data.get("From")
        
        print(f"POST to root - Incoming call from {from_number}, CallSid: {call_sid}")
        
        # Redirect to the proper voice webhook
        response = VoiceResponse()
        response.redirect("/webhook/voice")
        
        return Response(content=str(response), media_type="application/xml")
        
    except Exception as e:
        print(f"Error handling root POST: {e}")
        response = VoiceResponse()
        response.say("I'm sorry, there was an error. Please try again.")
        response.hangup()
        return Response(content=str(response), media_type="application/xml")

@app.post("/webhook/voice")
async def handle_incoming_call(request: Request):
    """
    Handle incoming Twilio voice calls with proper validation
    """
    try:
        # Extract call data using proper webhook handler
        call_data = await webhook_handler.extract_call_data(request)
        
        # Log the webhook request for debugging
        await webhook_handler.log_webhook_request(request, "/webhook/voice", call_data)
        
        # Validate the webhook request (optional for development, required for production)
        if os.getenv("VALIDATE_TWILIO_WEBHOOKS", "false").lower() == "true":
            if not await webhook_handler.validate_webhook(request, "/webhook/voice"):
                print("⚠️  Invalid Twilio webhook signature - request may be malicious")
                return Response(content="Unauthorized", status_code=401)
        
        # Create proper TwiML response
        twiml_response = webhook_handler.create_voice_response(
            message="Nine one one, what is your emergency.",
            gather_config={
                'input': 'speech',
                'action': '/webhook/process-speech',
                'method': 'POST',
                'speech_timeout': 'auto',
                'timeout': 10,
                'language': 'en-US'
            }
        )
        
        return Response(content=twiml_response, media_type="application/xml")
        
    except Exception as e:
        print(f"❌ Error handling incoming call: {e}")
        # Return error response
        error_response = webhook_handler.create_hangup_response(
            "I'm sorry, there was an error. Please try again."
        )
        return Response(content=error_response, media_type="application/xml")

@app.post("/webhook/process-speech")
async def process_speech(request: Request):
    """
    Process the speech input and classify the call with proper Twilio practices
    """
    try:
        # Extract call data using proper webhook handler
        call_data = await webhook_handler.extract_call_data(request)
        speech_result = call_data.get("speech_result", "")
        
        # Log the speech processing
        await webhook_handler.log_webhook_request(request, "/webhook/process-speech", call_data)
        
        print(f"🎤 Speech result: {speech_result}")
        print(f"🎯 Confidence: {call_data.get('confidence', 'N/A')}")
        
        if not speech_result.strip():
            # No speech detected, ask again with proper TwiML
            print("⚠️  No speech detected, asking again")
            twiml_response = webhook_handler.create_voice_response(
                message="I didn't catch that. Please tell me what's happening.",
                gather_config={
                    'input': 'speech',
                    'action': '/webhook/process-speech',
                    'method': 'POST',
                    'speech_timeout': 'auto',
                    'timeout': 10,
                    'language': 'en-US'
                }
            )
            return Response(content=twiml_response, media_type="application/xml")
        
        # Classify the call using Groq
        print("🤖 Classifying call with Groq...")
        classification_result = await emergency_classifier.classify_call(speech_result)
        
        print(f"📊 Classification result: {classification_result}")
        
        # Sid's code: sending to supabase
        severity = 1 if classification_result["is_emergency"] else 0
        caller_data = {
                "latitude": 37.8029,
                "longitude": -122.44879,
                "severity": severity,
                "metadata": speech_result
                }
        response = supabase.table("callers").insert(caller_data).execute()
        print(f"saved caller to database: {response}")
        
        if classification_result["is_emergency"]:
            # Emergency call - transfer to human dispatcher
            emergency_number = os.getenv("EMERGENCY_DISPATCH_PHONE_NUMBER")
            print(f"🚨 EMERGENCY DETECTED - Transferring to {emergency_number}")
            
            twiml_response = webhook_handler.create_dial_response(
                phone_number=emergency_number,
                message="This appears to be an emergency. I'm transferring you to a human dispatcher now."
            )
        else:
            # Non-emergency call - start voice agent conversation
            print("📞 Non-emergency call - starting AI conversation")
            
            twiml_response = webhook_handler.create_voice_response(
                message="I understand this is a general inquiry. Let me help you with that. I can help you with general information about the current incident. What would you like to know?",
                gather_config={
                    'input': 'speech',
                    'action': '/webhook/continue-conversation',
                    'method': 'POST',
                    'speech_timeout': 'auto',
                    'timeout': 10,
                    'language': 'en-US'
                }
            )
        
        return Response(content=twiml_response, media_type="application/xml")
        
    except Exception as e:
        print(f"❌ Error processing speech: {e}")
        error_response = webhook_handler.create_hangup_response(
            "I'm sorry, there was an error processing your request."
        )
        return Response(content=error_response, media_type="application/xml")

@app.post("/webhook/continue-conversation")
async def continue_conversation(request: Request):
    """
    Continue the conversation for non-emergency calls
    """
    try:
        form_data = await request.form()
        speech_result = form_data.get("SpeechResult", "")
        
        if not speech_result.strip():
            response = VoiceResponse()
            response.say("I didn't catch that. Could you please repeat?")
            gather = response.gather(
                input='speech',
                action='/webhook/continue-conversation',
                method='POST',
                speech_timeout='auto',
                timeout=10
            )
            response.redirect('/webhook/timeout')
            return Response(content=str(response), media_type="application/xml")
        
        # Process with voice agent (simplified for now)
        response = VoiceResponse()
        response.say("Thank you for that information. Is there anything else I can help you with?")
        
        gather = response.gather(
            input='speech',
            action='/webhook/continue-conversation',
            method='POST',
            speech_timeout='auto',
            timeout=10
        )
        response.redirect('/webhook/timeout')
        
        return Response(content=str(response), media_type="application/xml")
        
    except Exception as e:
        print(f"Error continuing conversation: {e}")
        response = VoiceResponse()
        response.say("I'm sorry, there was an error. Let me transfer you to a human operator.")
        response.hangup()
        return Response(content=str(response), media_type="application/xml")

@app.post("/webhook/timeout")
async def handle_timeout():
    """
    Handle timeout when no speech is detected
    """
    response = VoiceResponse()
    response.say("I didn't hear anything. Please call back if you need assistance.")
    response.hangup()
    return Response(content=str(response), media_type="application/xml")

@app.post("/webhook/status")
async def handle_call_status(request: Request):
    """
    Handle call status updates from Twilio
    """
    form_data = await request.form()
    call_status = form_data.get("CallStatus")
    call_sid = form_data.get("CallSid")
    
    print(f"Call {call_sid} status: {call_status}")
    
    return {"status": "received"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

