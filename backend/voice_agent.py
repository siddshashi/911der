"""
Deepgram Voice Agent for Non-Emergency Calls
Handles real-time voice conversations with callers
"""

import asyncio
import base64
import json
import os
import websockets
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class DeepgramVoiceAgent:
    """Voice agent that handles non-emergency calls using Deepgram's Voice Agent API"""
    
    def __init__(self, call_transcript: Optional[str] = None):
        self.api_key = os.getenv('DEEPGRAM_API_KEY')
        if not self.api_key:
            raise ValueError("DEEPGRAM_API_KEY environment variable is not set")
        self.call_transcript = call_transcript
        self.personalized_greeting = None
        self.conversation_history = []  # Store conversation messages for memory
    
    def _connect_to_deepgram(self):
        """Establish WebSocket connection to Deepgram's agent service"""
        return websockets.connect(
            "wss://agent.deepgram.com/v1/agent/converse",
            subprotocols=["token", self.api_key]
        )
    
    async def _generate_personalized_greeting(self) -> str:
        """Generate a personalized greeting based on the call transcript"""
        print(f"🔍 Voice agent transcript: '{self.call_transcript}'")
        if not self.call_transcript:
            print("⚠️  No transcript available, using default greeting")
            return "Hello, how can I help with your emergency?"
        
        try:
            from groq_inference import generate_personalized_greeting
            print("🤖 Generating personalized greeting with Groq...")
            greeting = await generate_personalized_greeting(self.call_transcript)
            print(f"✅ Generated greeting: {greeting}")
            return greeting
        except Exception as e:
            print(f"❌ Error generating personalized greeting: {e}")
            return "Hello, how can I help with your emergency?"
    
    def _add_to_conversation_history(self, role: str, content: str):
        """Add a message to the conversation history"""
        message = {
            "role": role,
            "content": content
        }
        self.conversation_history.append(message)
        print(f"📝 Added to history ({role}): {content[:100]}...")
    
    def _get_conversation_context(self) -> list:
        """Get conversation history formatted for Deepgram context"""
        # Include the initial call transcript as the first user message
        context = []
        if self.call_transcript:
            context.append({
                "role": "user",
                "content": f"Initial emergency description: {self.call_transcript}"
            })
        
        # Add conversation history (limit to last 10 messages to avoid token limits)
        context.extend(self.conversation_history[-10:])
        return context
    
    async def twilio_handler(self, twilio_ws):
        """Handle WebSocket connection from Twilio and manage voice agent conversation"""
        audio_queue = asyncio.Queue()
        streamsid_queue = asyncio.Queue()
        
        # Generate personalized greeting based on call transcript
        greeting_message = await self._generate_personalized_greeting()
        print(f"🎤 Generated personalized greeting: {greeting_message}")
        
        async with self._connect_to_deepgram() as sts_ws:
            # Get conversation context for memory
            conversation_context = self._get_conversation_context()
            print(f"🧠 Conversation context: {len(conversation_context)} messages")
            
            # Configure the voice agent for emergency dispatch context
            config_message = {
                "type": "Settings",
                "audio": {
                    "input": {
                        "encoding": "mulaw",
                        "sample_rate": 8000,
                    },
                    "output": {
                        "encoding": "mulaw",
                        "sample_rate": 8000,
                        "container": "none",
                    },
                },
                "agent": {
                    "language": "en",
                    "context": conversation_context,  # Add conversation memory
                    "listen": {
                        "provider": {
                            "type": "deepgram",
                            "model": "nova-3",
                            "keyterms": ["emergency", "help", "police", "fire", "ambulance", "urgent"]
                        }
                    },
                    "think": {
                        "provider": {
                            "type": "open_ai",
                            "model": "gpt-4o-mini",
                            "temperature": 0.7
                        },
                        "prompt": f"""You are a helpful AI assistant for emergency dispatch during high-call-volume incidents. 
                        
                        IMPORTANT CONTEXT: The caller previously described their situation as: "{self.call_transcript or 'No initial description provided'}"
                        
                        Your role is to assist callers with non-emergency inquiries and provide guidance. You should:
                        
                        1. Be empathetic and professional
                        2. Reference their initial situation when appropriate
                        3. Provide helpful information about the current incident if available
                        4. Offer guidance on what callers should do
                        5. Escalate to human operators if the situation becomes urgent
                        6. Keep responses concise and clear
                        7. Remember details from the conversation and reference them when relevant
                        
                        If the caller mentions anything that sounds like an emergency (life-threatening situations, 
                        active crimes, medical emergencies, fires, etc.), immediately advise them to hang up and 
                        call 911 directly for immediate assistance.
                        
                        Focus on being helpful while maintaining safety as the top priority."""
                    },
                    "speak": {
                        "provider": {
                            "type": "deepgram",
                            "model": "aura-2-thalia-en"
                        }
                    },
                    "greeting": greeting_message
                }
            }
            
            await sts_ws.send(json.dumps(config_message))
            
            # Start async tasks
            await asyncio.wait([
                asyncio.ensure_future(self._sts_sender(sts_ws, audio_queue)),
                asyncio.ensure_future(self._sts_receiver(sts_ws, twilio_ws, streamsid_queue)),
                asyncio.ensure_future(self._twilio_receiver(twilio_ws, audio_queue, streamsid_queue)),
            ])
            
            await twilio_ws.close()
    
    async def _sts_sender(self, sts_ws, audio_queue):
        """Send audio from Twilio to Deepgram"""
        print("🎤 Deepgram sender started")
        while True:
            chunk = await audio_queue.get()
            await sts_ws.send(chunk)
    
    async def _sts_receiver(self, sts_ws, twilio_ws, streamsid_queue):
        """Receive responses from Deepgram and send to Twilio"""
        print("🎤 Deepgram receiver started")
        # Wait for stream SID from Twilio
        streamsid = await streamsid_queue.get()
        
        async for message in sts_ws:
            if type(message) is str:
                print(f"Deepgram response: {message}")
                # Handle barge-in (user started speaking)
                try:
                    decoded = json.loads(message)
                    if decoded.get('type') == 'UserStartedSpeaking':
                        clear_message = {
                            "event": "clear",
                            "streamSid": streamsid
                        }
                        await twilio_ws.send(json.dumps(clear_message))
                    elif decoded.get('type') == 'ConversationText':
                        # Capture conversation messages for memory
                        role = decoded.get('role', 'assistant')
                        content = decoded.get('content', '')
                        if content:
                            self._add_to_conversation_history(role, content)
                except Exception as e:
                    print(f"Error processing Deepgram message: {e}")
                continue
            
            # Send audio response to Twilio
            if isinstance(message, bytes):
                media_message = {
                    "event": "media",
                    "streamSid": streamsid,
                    "media": {"payload": base64.b64encode(message).decode("ascii")},
                }
                await twilio_ws.send(json.dumps(media_message))
    
    async def _twilio_receiver(self, twilio_ws, audio_queue, streamsid_queue):
        """Receive audio from Twilio and buffer for Deepgram"""
        print("🎤 Twilio receiver started")
        # Twilio sends 160-byte messages (20ms of audio each)
        # Buffer 20 messages (0.4 seconds) for better performance
        BUFFER_SIZE = 20 * 160
        inbuffer = bytearray(b"")
        
        async for message in twilio_ws:
            try:
                data = json.loads(message)
                if data["event"] == "start":
                    print("✅ Got stream SID from Twilio")
                    start = data["start"]
                    streamsid = start["streamSid"]
                    streamsid_queue.put_nowait(streamsid)
                elif data["event"] == "connected":
                    continue
                elif data["event"] == "media":
                    media = data["media"]
                    chunk = base64.b64decode(media["payload"])
                    if media["track"] == "inbound":
                        inbuffer.extend(chunk)
                elif data["event"] == "stop":
                    break
                
                # Send buffered audio to Deepgram
                while len(inbuffer) >= BUFFER_SIZE:
                    chunk = inbuffer[:BUFFER_SIZE]
                    audio_queue.put_nowait(chunk)
                    inbuffer = inbuffer[BUFFER_SIZE:]
            except Exception as e:
                print(f"Error in twilio_receiver: {e}")
                break