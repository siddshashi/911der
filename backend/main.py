from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from supabase import create_client, Client
from pydantic import BaseModel
import datetime
import json
import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

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
    return {"message": "Hello from FastAPI!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)