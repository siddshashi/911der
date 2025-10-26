# Backend Components

This directory contains the core backend components for the 911 Dispatch Voice Agent system.

## Files

- **`server.py`** - Main FastAPI server that handles webhooks and WebSocket connections
- **`voice_agent.py`** - Deepgram voice agent for non-emergency calls
- **`emergency_classifier.py`** - AI-powered emergency call classification
- **`twilio_webhook.py`** - Twilio webhook handlers and utilities
- **`test_system.py`** - System test suite
- **`pyproject.toml`** - Project dependencies (managed by uv)

## Quick Start

```bash
# Install dependencies (from project root)
uv sync

# Test the system
uv run python test_system.py

# Start the server
uv run python server.py
```

See the main [README.md](../README.md) for complete setup instructions.