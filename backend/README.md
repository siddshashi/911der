# 911 Dispatch Voice Agent

A Twilio, Deepgram, and Groq-based voice agent for 911 dispatch automation during high-call-volume incidents.

## 🎯 System Overview

This system automatically classifies incoming 911 calls as emergency or non-emergency using AI, then routes them appropriately:
- **Emergency calls** → Human dispatcher
- **Non-emergency calls** → AI voice agent for information

## 🚀 Quick Start

### 1. Install Dependencies
```bash
uv sync
```

### 2. Set Up Environment Variables
Create a `.env` file:
```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number

# API Keys
DEEPGRAM_API_KEY=your_deepgram_key
GROQ_API_KEY=your_groq_key

# Emergency Dispatch
EMERGENCY_DISPATCH_PHONE_NUMBER=+1234567890

# Server Configuration
BASE_URL=https://your-ngrok-url.ngrok.io
VALIDATE_TWILIO_WEBHOOKS=false  # Set to true for production
```

### 3. Start the Server
```bash
python3 start_server.py
```

### 4. Set Up ngrok (in another terminal)
```bash
ngrok http 8000
```

### 5. Configure Twilio Webhook
- Go to Twilio Console → Phone Numbers → Manage → Active numbers
- Set webhook URL: `https://your-ngrok-url.ngrok.io/webhook/voice`
- Set HTTP method to POST
- Save configuration

### 6. Test the System
Call your Twilio phone number to test!

## 📁 Project Structure

```
backend/
├── main.py                    # FastAPI server with webhook endpoints
├── emergency_classifier.py    # Groq-powered emergency classification
├── twilio_webhook.py        # Twilio webhook validation and TwiML generation
├── start_server.py           # Server startup script
├── test_system.py            # System test suite
└── README.md                 # This file
```

## 🔧 Core Components

### Emergency Classifier (`emergency_classifier.py`)
- Uses Groq's Mixtral model for fast classification
- Identifies emergency keywords and context
- Returns emergency/non-emergency classification

### Twilio Webhook Handler (`twilio_webhook.py`)
- Validates webhook requests from Twilio
- Generates proper TwiML responses
- Handles call routing and error responses

### Main Server (`main.py`)
- FastAPI server with webhook endpoints
- Processes incoming calls and speech
- Routes calls based on classification

## 📞 Call Flow

1. **Call comes in** → Twilio sends webhook to `/webhook/voice`
2. **System greets caller** → "Hello, this is the 911 dispatch system..."
3. **Caller speaks** → Twilio transcribes speech to text
4. **Groq classifies** → Emergency vs non-emergency
5. **Call routing**:
   - Emergency → Transfer to human dispatcher
   - Non-emergency → Continue with AI conversation

## 🧪 Testing

```bash
# Test the system
python3 test_system.py

# Test webhook validation
python3 -c "from twilio_webhook import webhook_handler; print('✅ Webhook handler ready')"
```

## 🛡️ Security

- **Webhook validation** - Validates Twilio signatures (optional in dev)
- **Error handling** - Graceful failure responses
- **Logging** - Comprehensive request logging

## 📊 Expected Logs

```
📞 Twilio Webhook: /webhook/voice
   Call SID: CA123...
   From: +1234567890
   To: +1234567890
   Status: ringing
   Valid: N/A (validation disabled)
---

🎤 Speech result: I need help, there's a fire!
🎯 Confidence: 0.95
🤖 Classifying call with Groq...
📊 Classification result: {'is_emergency': True, 'classification': 'EMERGENCY'}
🚨 EMERGENCY DETECTED - Transferring to +1234567890
```

## 🚀 Production Deployment

1. Deploy to cloud service (AWS, GCP, Azure)
2. Use proper domain name instead of ngrok
3. Set `VALIDATE_TWILIO_WEBHOOKS=true`
4. Set up SSL certificates
5. Configure monitoring and alerting

## 📋 API Endpoints

- `POST /webhook/voice` - Handle incoming calls
- `POST /webhook/process-speech` - Process speech and classify
- `POST /webhook/continue-conversation` - Continue non-emergency conversations
- `POST /webhook/timeout` - Handle timeouts
- `POST /webhook/status` - Handle call status updates
- `GET /health` - Health check endpoint

## 🎉 Success!

Your 911 dispatch voice agent is now ready for production use! 🚀
