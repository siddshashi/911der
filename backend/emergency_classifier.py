"""
Emergency Classification System using Groq LLM
Determines if a call is a serious emergency requiring human dispatch
or a general inquiry that can be handled by AI voice agent.
"""

import os
from typing import Dict, Any
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv

load_dotenv()

class EmergencyClassifier:
    def __init__(self):
        self.llm = ChatGroq(
            temperature=0,
            model_name="openai/gpt-oss-20b",
            groq_api_key=os.getenv("GROQ_API_KEY")
        )
        
        # System prompt for emergency classification
        self.classification_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an emergency dispatch classifier for 911 operations during high-call-volume incidents.
            
            Your job is to classify incoming calls into two categories:
            1. EMERGENCY: Life-threatening situations requiring immediate human dispatch
            2. NON_EMERGENCY: General inquiries, information requests, or non-critical situations

            EMERGENCY indicators include:
            - Life-threatening situations (heart attack, stroke, severe injury)
            - Active crimes in progress (robbery, assault, domestic violence)
            - Fires, explosions, or hazardous material incidents
            - Medical emergencies requiring immediate attention
            - Threats to safety or security
            - Requests for police, fire, or ambulance with urgency

            NON_EMERGENCY indicators include:
            - General information requests
            - Non-urgent medical questions
            - Status updates or inquiries
            - Administrative questions
            - Non-critical complaints
            - General safety questions

            Respond with ONLY one word: "EMERGENCY" or "NON_EMERGENCY"
            """),
            ("human", "Caller says: {transcript}")
        ])
        
        self.classification_chain = self.classification_prompt | self.llm

    async def classify_call(self, transcript: str) -> Dict[str, Any]:
        """
        Classify a call transcript as emergency or non-emergency
        
        Args:
            transcript: The transcribed speech from the caller
            
        Returns:
            Dict containing classification result and confidence
        """
        try:
            # Get classification from LLM
            response = await self.classification_chain.ainvoke({"transcript": transcript})
            classification = response.content.strip().upper()
            
            # Determine if it's an emergency
            is_emergency = classification == "EMERGENCY"
            
            return {
                "is_emergency": is_emergency,
                "classification": classification,
                "transcript": transcript,
                "confidence": "high" if classification in ["EMERGENCY", "NON_EMERGENCY"] else "low"
            }
            
        except Exception as e:
            # Default to emergency if classification fails (safety first)
            return {
                "is_emergency": True,
                "classification": "EMERGENCY",
                "transcript": transcript,
                "confidence": "low",
                "error": str(e)
            }

    def get_emergency_indicators(self, transcript: str) -> list:
        """
        Extract potential emergency indicators from transcript
        """
        emergency_keywords = [
            "emergency", "urgent", "help", "911", "ambulance", "police", "fire",
            "heart attack", "stroke", "bleeding", "unconscious", "not breathing",
            "robbery", "assault", "violence", "threat", "danger", "fire",
            "explosion", "accident", "injury", "hospital", "critical"
        ]
        
        transcript_lower = transcript.lower()
        found_indicators = [keyword for keyword in emergency_keywords if keyword in transcript_lower]
        
        return found_indicators
