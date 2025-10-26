# Backend Components

This directory contains the core backend components for the 911 Dispatch Voice Agent system.

## Files

- **`server.py`** - Main FastAPI server that handles webhooks and WebSocket connections
- **`voice_agent.py`** - Deepgram voice agent for non-emergency calls
- **`emergency_classifier.py`** - AI-powered emergency call classification
- **`twilio_webhook.py`** - Twilio webhook handlers and utilities
- **`test_system.py`** - System test suite
- **`pyproject.toml`** - Project dependencies (managed by uv)

## Groq Inference Module

The `groq_inference/` directory contains AI-powered analysis functions:

- **`groq_inference/criticality.py`** - Assesses emergency call criticality (LOW, MEDIUM, HIGH, CRITICAL)
- **`groq_inference/summarize.py`** - Generates 2-3 sentence summaries of call transcripts
- **`groq_inference/test_criticality.py`** - Test suite for criticality classification

## Quick Start

```bash
# Install dependencies (from project root)
uv sync

# Test the system
uv run python test_system.py

# Test the criticality classifier
uv run python backend/groq_inference/test_criticality.py

# Start the server
uv run python server.py
```

## Usage Examples

```python
from groq_inference import get_criticality_level, get_call_summary

# Assess criticality of a call
criticality = await get_criticality_level("My house is on fire!")
# Returns: "CRITICAL"

# Generate a summary of a call
summary = await get_call_summary("My house is on fire and my family is trapped inside!")
# Returns: A 2-3 sentence summary of the emergency
```

See the main [README.md](../README.md) for complete setup instructions.