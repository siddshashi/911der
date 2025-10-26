import os
from fastapi import FastAPI, Request
from fastapi.responses import Response
from twilio.twiml.voice_response import VoiceResponse
from twilio.rest import Client
from dotenv import load_dotenv

from emergency_classifier import EmergencyClassifier
from twilio_webhook import webhook_handler

# Load environment variables
load_dotenv()

app = FastAPI()

# Initialize services
emergency_classifier = EmergencyClassifier()

# Twilio client
twilio_client = Client(
    os.getenv("TWILIO_ACCOUNT_SID"),
    os.getenv("TWILIO_AUTH_TOKEN")
)

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

