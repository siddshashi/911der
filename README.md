### to run backend from home directory: 
```
uv run uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### To test sentiment analysis from home directory:
```
uv run python backend/sentiment_analysis.py
```


# 911 Dispatch Voice Agent System

An intelligent emergency dispatch system that uses AI to classify incoming calls and route them appropriately - emergencies to human dispatchers, non-emergencies to an AI voice agent.

## 🎯 Overview

This system automatically:
- **Classifies calls** as emergency or non-emergency using AI
- **Routes emergencies** to human dispatchers for immediate response
- **Handles non-emergencies** with an AI voice agent for information and guidance
- **Scales efficiently** during high-call-volume incidents

## 🏗️ System Architecture

```
Incoming Call → FastAPI Server → AI Classification
                                    ↓
                            Emergency? → Human Dispatcher
                                    ↓
                            Non-Emergency? → Deepgram Voice Agent
```

## 📁 Project Structure

```
backend/
├── server.py                 # Main FastAPI server
├── voice_agent.py           # Deepgram voice agent
├── emergency_classifier.py  # AI call classification
├── twilio_webhook.py        # Twilio webhook handlers
├── test_system.py          # System test suite
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## 🚀 Quick Start

### 1. Prerequisites

- Python 3.8+
- Twilio account with phone number
- Deepgram API key
- Groq API key
- ngrok (for local development)

### 2. Installation

```bash
# Clone and navigate to project
cd 911der

# Install dependencies with uv
uv sync
```

### 3. Configuration

Create a `.env` file in the project root:

```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# AI Services
DEEPGRAM_API_KEY=your_deepgram_api_key
GROQ_API_KEY=your_groq_api_key

# Server Configuration
BASE_URL=https://your-ngrok-url.ngrok.io
VOICE_AGENT_WS_URL=wss://your-ngrok-url.ngrok.io/twilio

# Optional: Emergency dispatch number
EMERGENCY_DISPATCH_PHONE_NUMBER=+1234567890
```

### 4. Start ngrok

```bash
# In a separate terminal
ngrok http 8000
```

Copy the ngrok URL and update your `.env` file.

### 5. Run the System

```bash
# Test the system first
uv run python backend/test_system.py

# Start the server
uv run python backend/server.py
```

### 6. Configure Twilio

In your Twilio Console:
1. Go to Phone Numbers → Manage → Active Numbers
2. Click your phone number
3. Set "A call comes in" to "Webhook"
4. Enter: `https://your-ngrok-url.ngrok.io/webhook/voice`
5. Set HTTP method to "POST"
6. Save configuration

## 🧪 Testing

### Run Test Suite

```bash
uv run python backend/test_system.py
```

### Manual Testing

1. **Emergency Call Test:**
   - Call your Twilio number
   - Say: "I need help, there's a fire!"
   - Should transfer to human dispatcher

2. **Non-Emergency Call Test:**
   - Call your Twilio number
   - Say: "I want information about the current incident"
   - Should connect to AI voice agent

## 📋 API Endpoints

### Webhooks (Twilio)
- `POST /webhook/voice` - Handle incoming calls
- `POST /webhook/process-speech` - Process speech input
- `POST /webhook/status` - Call status updates

### WebSocket
- `WS /twilio` - Deepgram voice agent connection

### Health Check
- `GET /health` - System health status

## 🔧 Core Components

### 1. Emergency Classifier (`emergency_classifier.py`)

Uses Groq LLM to classify calls as emergency or non-emergency:

```python
class EmergencyClassifier:
    async def classify_call(self, transcript: str) -> Dict[str, Any]:
        # Returns: {"is_emergency": bool, "classification": str, "confidence": str}
```

**Emergency indicators:**
- Life-threatening situations
- Active crimes in progress
- Medical emergencies
- Fires, explosions, hazardous materials
- Threats to safety

**Non-emergency indicators:**
- General information requests
- Status updates
- Administrative questions
- Non-urgent medical questions

### 2. Voice Agent (`voice_agent.py`)

Handles non-emergency calls using Deepgram's Voice Agent API:

```python
class DeepgramVoiceAgent:
    async def twilio_handler(self, websocket):
        # Manages real-time voice conversation
```

**Features:**
- Real-time speech-to-text and text-to-speech
- Contextual responses for emergency dispatch
- Automatic escalation detection
- Professional, empathetic tone

### 3. Main Server (`server.py`)

FastAPI server that handles:
- Twilio webhook processing
- Emergency classification routing
- WebSocket voice agent connections
- Health monitoring

## 🔒 Security Features

- **Webhook validation** (optional, configurable)
- **Environment-based configuration**
- **Error handling and logging**
- **Emergency classification safety net**

## 📊 Monitoring

The system provides comprehensive logging:

```
📞 Twilio Webhook: /webhook/voice
   Call SID: CA1234567890
   From: +1234567890
   Speech: I need help, there's a fire!
   Classification: EMERGENCY
   Action: Transferring to human dispatcher
```

## 🚀 Production Deployment

### Recommended Platforms
- **AWS EC2** with public IP
- **Heroku** with WebSocket support
- **DigitalOcean** droplet
- **Google Cloud Run**

### Environment Variables
Set all required environment variables in your production environment.

### Security Considerations
- Enable webhook validation
- Use HTTPS/WSS for all connections
- Monitor API usage and costs
- Implement rate limiting
- Log all conversations for compliance

## 🛠️ Development

### Adding New Features

1. **New Emergency Indicators:**
   - Update `emergency_classifier.py`
   - Add keywords to classification prompt
   - Test with various scenarios

2. **Voice Agent Improvements:**
   - Modify prompts in `voice_agent.py`
   - Adjust AI model parameters
   - Add new conversation flows

3. **New Webhook Endpoints:**
   - Add routes to `server.py`
   - Update Twilio configuration
   - Test with Twilio webhook simulator

### Testing

```bash
# Run all tests
uv run python backend/test_system.py

# Test specific components
uv run python -c "from backend.emergency_classifier import EmergencyClassifier; print('OK')"
```

## 📞 Support

### Common Issues

1. **WebSocket Connection Failed:**
   - Check `VOICE_AGENT_WS_URL` format (should be `wss://...`)
   - Verify ngrok is running
   - Check server logs for errors

2. **Emergency Classification Not Working:**
   - Verify `GROQ_API_KEY` is set
   - Check API quota and billing
   - Review classification prompts

3. **Twilio Webhook Issues:**
   - Verify `BASE_URL` is correct
   - Check webhook URL in Twilio Console
   - Ensure ngrok is accessible

### Debugging

Enable debug logging by setting:
```bash
export LOG_LEVEL=debug
```

## 📄 License

This project is for educational and demonstration purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

**⚠️ Important:** This system is designed for demonstration purposes. For production emergency dispatch systems, ensure compliance with local regulations and implement appropriate safety measures.
