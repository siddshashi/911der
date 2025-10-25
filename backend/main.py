from fastapi import FastAPI
from supabase import create_client, Client
from pydantic import BaseModel

app = FastAPI()

SUPABASE_URL = "https://kgrgpyfhpxbeymuamndi.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtncmdweWZocHhiZXltdWFtbmRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTk0NTQsImV4cCI6MjA3Njk5NTQ1NH0.oqCw6wA45LElpZ1yQwSBWl5EHzqKzsDrdOHp1GhiFSE"

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

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

