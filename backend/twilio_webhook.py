"""
Proper Twilio Webhook Implementation following Twilio best practices
Based on official Twilio documentation and security guidelines
"""

import os
import hmac
import hashlib
import base64
from urllib.parse import urlencode
from typing import Dict, Any, Optional
from fastapi import Request, HTTPException
from twilio.twiml.voice_response import VoiceResponse
from twilio.twiml.messaging_response import MessagingResponse
from dotenv import load_dotenv

load_dotenv()

class TwilioWebhookValidator:
    """
    Validates Twilio webhook requests using X-Twilio-Signature header
    Following Twilio security best practices
    """
    
    def __init__(self, auth_token: str):
        self.auth_token = auth_token
    
    async def validate_request(self, request: Request, webhook_url: str) -> bool:
        """
        Validate that the request is actually from Twilio
        
        Args:
            request: FastAPI Request object
            webhook_url: The webhook URL that Twilio is calling
            
        Returns:
            True if request is valid, False otherwise
        """
        try:
            # Get the signature from the request headers
            signature = request.headers.get("X-Twilio-Signature", "")
            if not signature:
                print("Warning: No X-Twilio-Signature header found")
                return False
            
            # Get the request body
            body = await request.body()
            
            # Create the expected signature
            expected_signature = self._compute_signature(webhook_url, body)
            
            # Compare signatures using constant-time comparison
            return hmac.compare_digest(signature, expected_signature)
            
        except Exception as e:
            print(f"Error validating Twilio request: {e}")
            return False
    
    def _compute_signature(self, url: str, body: bytes) -> str:
        """
        Compute the expected signature for the request
        
        Args:
            url: The webhook URL
            body: The request body
            
        Returns:
            Base64-encoded signature
        """
        # Create the string to sign
        string_to_sign = url + body.decode('utf-8')
        
        # Create HMAC signature
        signature = hmac.new(
            self.auth_token.encode('utf-8'),
            string_to_sign.encode('utf-8'),
            hashlib.sha1
        ).digest()
        
        # Return base64-encoded signature
        return base64.b64encode(signature).decode('utf-8')

class TwilioWebhookHandler:
    """
    Handles Twilio webhook requests with proper validation and response formatting
    """
    
    def __init__(self):
        self.validator = TwilioWebhookValidator(os.getenv("TWILIO_AUTH_TOKEN"))
        self.webhook_base_url = os.getenv("BASE_URL", "https://your-ngrok-url.ngrok.io")
    
    async def validate_webhook(self, request: Request, endpoint: str) -> bool:
        """
        Validate a webhook request
        
        Args:
            request: FastAPI Request object
            endpoint: The webhook endpoint being called
            
        Returns:
            True if valid, False otherwise
        """
        webhook_url = f"{self.webhook_base_url}{endpoint}"
        return await self.validator.validate_request(request, webhook_url)
    
    def create_voice_response(self, message: str, gather_config: Optional[Dict[str, Any]] = None) -> str:
        """
        Create a proper TwiML voice response
        
        Args:
            message: Message to say to the caller
            gather_config: Optional configuration for speech gathering
            
        Returns:
            TwiML XML string
        """
        response = VoiceResponse()
        
        # Add the message
        response.say(message)
        
        # Add speech gathering if configured
        if gather_config:
            gather = response.gather(
                input=gather_config.get('input', 'speech'),
                action=gather_config.get('action', '/webhook/process-speech'),
                method=gather_config.get('method', 'POST'),
                speech_timeout=gather_config.get('speech_timeout', 'auto'),
                timeout=gather_config.get('timeout', 10),
                language=gather_config.get('language', 'en-US')
            )
        
        # Add fallback for timeout
        response.redirect('/webhook/timeout')
        
        return str(response)
    
    def create_messaging_response(self, message: str) -> str:
        """
        Create a proper TwiML messaging response
        
        Args:
            message: Message to send
            
        Returns:
            TwiML XML string
        """
        response = MessagingResponse()
        response.message(message)
        return str(response)
    
    def create_dial_response(self, phone_number: str, message: str = None) -> str:
        """
        Create a TwiML response that dials another number
        
        Args:
            phone_number: Number to dial
            message: Optional message to say before dialing
            
        Returns:
            TwiML XML string
        """
        response = VoiceResponse()
        
        if message:
            response.say(message)
        
        response.dial(phone_number)
        
        return str(response)
    
    def create_hangup_response(self, message: str = None) -> str:
        """
        Create a TwiML response that hangs up the call
        
        Args:
            message: Optional message to say before hanging up
            
        Returns:
            TwiML XML string
        """
        response = VoiceResponse()
        
        if message:
            response.say(message)
        
        response.hangup()
        
        return str(response)
    
    async def extract_call_data(self, request: Request) -> Dict[str, Any]:
        """
        Extract relevant call data from the webhook request
        
        Args:
            request: FastAPI Request object
            
        Returns:
            Dictionary containing call information
        """
        form_data = await request.form()
        
        return {
            "call_sid": form_data.get("CallSid"),
            "from_number": form_data.get("From"),
            "to_number": form_data.get("To"),
            "call_status": form_data.get("CallStatus"),
            "direction": form_data.get("Direction"),
            "speech_result": form_data.get("SpeechResult", ""),
            "confidence": form_data.get("Confidence", ""),
            "raw_data": dict(form_data)
        }
    
    async def log_webhook_request(self, request: Request, endpoint: str, call_data: Dict[str, Any]):
        """
        Log webhook request for debugging and monitoring
        
        Args:
            request: FastAPI Request object
            endpoint: The webhook endpoint
            call_data: Extracted call data
        """
        print(f"📞 Twilio Webhook: {endpoint}")
        print(f"   Call SID: {call_data.get('call_sid', 'N/A')}")
        print(f"   From: {call_data.get('from_number', 'N/A')}")
        print(f"   To: {call_data.get('to_number', 'N/A')}")
        print(f"   Status: {call_data.get('call_status', 'N/A')}")
        print(f"   Speech: {call_data.get('speech_result', 'N/A')}")
        print(f"   Confidence: {call_data.get('confidence', 'N/A')}")
        
        # Only validate if validation is enabled
        if os.getenv("VALIDATE_TWILIO_WEBHOOKS", "false").lower() == "true":
            is_valid = await self.validate_webhook(request, endpoint)
            print(f"   Valid: {is_valid}")
        else:
            print(f"   Valid: N/A (validation disabled)")
        print("---")

# Global webhook handler instance
webhook_handler = TwilioWebhookHandler()
