# 911 Dispatch Voice Agent Setup Guide (Updated for Latest Deepgram SDK)

This guide will walk you through setting up a Twilio, Deepgram, and Groq-based voice agent for 911 dispatch automation during high-call-volume incidents using the **latest Deepgram SDK v5.0.0**.

## 🆕 What's New in This Update

- **Latest Deepgram SDK v5.0.0** - Updated API usage and improved performance
- **New Event System** - Uses `EventType` for better event handling
- **Improved TTS** - Latest Deepgram TTS with more voice options
- **Better Error Handling** - Enhanced error handling and logging
- **Streaming Improvements** - Better real-time audio processing

## System Architecture

```
Incoming Call → Twilio → FastAPI Server → Groq Classification → Route Decision
                                                      ↓
                                            Emergency → Human Dispatcher
                                            Non-Emergency → AI Voice Agent (Latest Deepgram)
```

## Prerequisites

- Python 3.13+
- Twilio account with phone number
- Deepgram API key (latest version)
- Groq API key
- ngrok (for local development)

## Step 1: Install Dependencies

```bash
# Install dependencies with latest Deepgram SDK
uv sync

# Or with pip
pip install deepgram-sdk>=5.0.0 fastapi groq twilio langchain-groq requests websockets
```

## Step 2: Set Up Environment Variables

Create a `.env` file in the backend directory:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Deepgram Configuration (Latest API)
DEEPGRAM_API_KEY=your_deepgram_api_key

# Groq Configuration
GROQ_API_KEY=your_groq_api_key

# Emergency Dispatch Configuration
EMERGENCY_DISPATCH_PHONE_NUMBER=+1234567890

# Server Configuration
BASE_URL=https://your-ngrok-url.ngrok.io
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

## Step 3: Set Up Twilio

### 3.1 Create Twilio Account
1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a new account
3. Get your Account SID and Auth Token from the dashboard

### 3.2 Purchase a Phone Number
1. In Twilio Console, go to Phone Numbers → Manage → Buy a number
2. Choose a number with voice capabilities
3. Note down your phone number

### 3.3 Configure Webhook
1. Go to Phone Numbers → Manage → Active numbers
2. Click on your phone number
3. Set the webhook URL to: `https://your-ngrok-url.ngrok.io/webhook/voice`
4. Set HTTP method to POST
5. Save configuration

## Step 4: Set Up ngrok (for local development)

```bash
# Install ngrok
brew install ngrok  # macOS
# or download from https://ngrok.com/

# Start ngrok tunnel
ngrok http 8000

# Note the HTTPS URL (e.g., https://abc123.ngrok.io)
```

## Step 5: Start the Server

```bash
cd backend
python start_server.py
```

## Step 6: Test the System

```bash
# Test the updated system
python test_system.py

# Call your Twilio phone number to test end-to-end
```

## 🆕 New Deepgram SDK Features

### Latest API Usage:

```python
# New client initialization
from deepgram import DeepgramClient
from deepgram.core.events import EventType

deepgram = DeepgramClient(api_key="YOUR_API_KEY")

# Real-time streaming with new event system
with deepgram.listen.v1.connect(
    model="nova-2",
    encoding="linear16",
    sample_rate=16000
) as connection:
    connection.on(EventType.OPEN, on_open)
    connection.on(EventType.MESSAGE, on_message)
    connection.on(EventType.CLOSE, on_close)
    connection.on(EventType.ERROR, on_error)
```

### New TTS Features:

```python
# Latest TTS with more voice options
tts = TextToSpeech()
audio_data = tts.speak("Hello, this is the 911 dispatch system")

# Available voices include:
# - aura-helios-en (male)
# - aura-luna-en (female)
# - aura-stella-en (female)
# - aura-athena-en (female)
# - aura-orion-en (male)
# And many more...
```

## API Endpoints

- `POST /webhook/voice` - Handle incoming calls
- `POST /webhook/process-speech` - Process speech and classify
- `POST /webhook/continue-conversation` - Continue non-emergency conversations
- `POST /webhook/timeout` - Handle timeouts
- `POST /webhook/status` - Handle call status updates

## Emergency Classification

The system uses Groq's Mixtral model to classify calls:

**Emergency Indicators:**
- Life-threatening situations
- Active crimes in progress
- Fires, explosions, hazardous materials
- Medical emergencies
- Threats to safety

**Non-Emergency Indicators:**
- General information requests
- Status updates
- Administrative questions
- Non-critical complaints

## 🆕 New Features in This Update

1. **Latest Deepgram SDK v5.0.0** - Improved performance and reliability
2. **Enhanced Event Handling** - Better real-time audio processing
3. **More Voice Options** - 12+ different voice models for TTS
4. **Improved Error Handling** - Better error recovery and logging
5. **Streaming Optimizations** - Faster audio processing
6. **Better Memory Management** - More efficient resource usage

## Troubleshooting

### Common Issues:

1. **Webhook not receiving calls**: Check ngrok URL and Twilio webhook configuration
2. **API key errors**: Verify all environment variables are set correctly
3. **Speech not recognized**: Check Deepgram API key and model configuration
4. **Classification errors**: Verify Groq API key and model access
5. **TTS not working**: Check Deepgram TTS API key and voice model

### Debug Mode:
Set `DEBUG=true` in your `.env` file to enable detailed logging.

## Production Deployment

For production deployment:

1. Deploy to a cloud service (AWS, GCP, Azure)
2. Use a proper domain name instead of ngrok
3. Set up SSL certificates
4. Configure proper logging and monitoring
5. Set up database for call logs and analytics

## Security Considerations

- Keep API keys secure and never commit them to version control
- Use environment variables for all sensitive configuration
- Implement proper authentication for production
- Set up rate limiting and monitoring
- Consider encryption for call data

## Monitoring and Analytics

Consider implementing:
- Call volume tracking
- Classification accuracy metrics
- Response time monitoring
- Error rate tracking
- Call quality metrics
- Deepgram usage analytics

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
uv sync

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 3. Start the server
python start_server.py

# 4. In another terminal, start ngrok
ngrok http 8000

# 5. Test the system
python test_system.py

# 6. Configure Twilio webhook with your ngrok URL
# 7. Call your Twilio phone number to test!
```

The system is now updated with the latest Deepgram SDK v5.0.0 and includes all the improvements and new features!