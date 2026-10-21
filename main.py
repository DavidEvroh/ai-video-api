import os
import asyncio
import replicate
import httpx
from fastapi import FastAPI, HTTPException, Security, Depends, Request
from fastapi.security import APIKeyHeader
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client
load_dotenv()
# --- Cloud Database Configuration ---
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ DATABASE NOTICE: Supabase credentials missing. Queue tracking offline.")
    supabase = None
else:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
# --- Security Gate ---
MASTER_API_KEY = os.getenv("MASTER_API_KEY", "super_secret_test_key_123")
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)
app = FastAPI(
    title="Movieai Studio - Commercial Video Engine",
    description="Production-grade asynchronous multi-tenant AI video processing engine.",
    version="2.0.0"
)
# 🔒 SECURITY LAYER
def get_api_key(api_key: str = Depends(api_key_header)):
    if api_key == MASTER_API_KEY or os.getenv("ENVIRONMENT") == "marketplace":
        return api_key
    raise HTTPException(status_code=401, detail="Unauthorized: Invalid API Key")
class VideoRequest(BaseModel):
    prompt: str
    aspect_ratio: str = "16:9"
class ScreenplayRequest(BaseModel):
    title: str = ""
    idea: str = ""
    genre: str = ""
    movie_type: str = "Movie"
    length: str = "Medium"
    style: str = "Cinematic"
    outline: str = ""
    act1: str = ""
    act2: str = ""
    act3: str = ""
    characters: list = []
    scenes: list = []
@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "database_connected": supabase is not None}
@app.post("/v1/videos")
async def create_video_task(request: VideoRequest, api_key: str = Depends(get_api_key)):
    try:
        # Ensure our target public routing link is clean
        public_server_url = os.getenv("PUBLIC_SERVER_URL", "").rstrip("/")
        if not public_server_url:
            raise HTTPException(status_code=500, detail="PUBLIC_SERVER_URL is missing in configuration")
        # 1. Fire the request directly to Replicate with pristine formatting
        prediction = replicate.predictions.create(
            model="wavespeedai/wan-2.1-t2v-480p",
            input={
                "prompt": request.prompt,
                "aspect_ratio": request.aspect_ratio.strip(),
                "duration": 5,
            },
            webhook=f"{public_server_url}/v1/webhooks/replicate",
            webhook_events_filter=["completed"]
        )
        # 2. Log the task cleanly inside your secure Supabase cloud table
        if supabase:
            supabase.table("video_tasks").insert({
                "task_id": prediction.id,
                "status": "processing",
                "prompt": request.prompt,
                "aspect_ratio": request.aspect_ratio.strip(),
                "video_url": None
            }).execute()
        # 3. Return the success payload back to your client script
        return {
            "status": "queued",
            "task_id": prediction.id,
            "check_status_url": f"/v1/videos/{prediction.id}",
            "message": "AI generation job started successfully."
        }
    except Exception as e:
        print(f"Error starting task: {str(e)}")

        raise HTTPException(status_code=500, detail=f"Engine Deployment Failure: {str(e)}")
@app.get("/v1/videos/{task_id}")
async def get_video_status(task_id: str, api_key: str = Depends(get_api_key)):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database Engine offline.")
    try:
        result = supabase.table("video_tasks").select("*").eq("task_id", task_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Requested video task not found.")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database Retrieval Failure: {str(e)}")

@app.post("/v1/webhooks/replicate")
async def replicate_webhook(body: dict): # <-- Changed this line to expect a dict body
    try:
        # Remove or comment out: body = await request.json()
        task_id = body.get("id")
        status = body.get("status")
        output = body.get("output")
        print(f"📡 Webhook intercepted! Task ID: {task_id} | Status: {status}")
        if not task_id:
            return {"status": "ignored", "message": "No Task ID found in payload."}
        db_status = "processing"
        final_video_url = None
        if status == "succeeded":
            db_status = "completed"
            if isinstance(output, list) and len(output) > 0:
                final_video_url = output[0]
            elif isinstance(output, str):
                final_video_url = output
        elif status in ["failed", "canceled"]:
            db_status = "failed"
        if supabase:
            supabase.table("video_tasks").update({
                "status": db_status,
                "video_url": final_video_url
            }).eq("task_id", task_id).execute()
            print(f"💾 Cloud database updated successfully for Task: {task_id}")
        return {"status": "success", "message": "Webhook processed cleanly."}
    except Exception as e:
        print(f"❌ Webhook parsing failure: {str(e)}")
        return {"status": "error", "message": str(e)}
        
@app.post("/webhook")
async def paystack_webhook(request: Request):
    try:
        data = await request.json()
        if data.get("event") == "charge.success":
            customer_email = data["data"]["customer"]["email"]
            amount_paid = data["data"]["amount"] / 100 # Convert kobo back to Naira
            print(f"💰 PAYMENT VERIFIED! {customer_email} successfully paid ₦{amount_paid}.")
            # 🚀 DATABASE SYNCHRONIZATION: Update your user data table
            user_record = supabase.table("profiles").select("credits").eq("email", customer_email).execute()
            if user_record.data:
                # Fixed to parse the array object properly
                current_credits = user_record.data[0].get("credits", 0)
                new_credits = current_credits + 10 # Award 10 video generation credits per payment
                supabase.table("profiles").update({"credits": new_credits}).eq("email", customer_email).execute()
                print(f"💳 CREDITS UPDATED! Added 10 credits to {customer_email}. Total: {new_credits}")
            else:
                print(f"⚠️ User record not found for {customer_email}. Creating new entry...")
                supabase.table("profiles").insert({"email": customer_email, "credits": 10}).execute()
            return {"status": "success", "message": "Credits successfully provisioned"}    
    except Exception as e:
        print(f"❌ Paystack Webhook Database Error: {str(e)}")
        return {"status": "error", "message": str(e)}
    return {"status": "ignored"}

class ScreenplayResponse(BaseModel):
    screenplay: str

@app.post("/v1/screenplay")
async def generate_screenplay(request: ScreenplayRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key is not configured on the server."
        )
    prompt = f"""
You are a professional screenwriter for MovieAI Studio.
Create a detailed, coherent screenplay using the user's project details.
Keep character identities and story continuity consistent.
Return screenplay text only, with scene headings, action, and dialogue.
Title: {request.title}
Idea: {request.idea}
Genre: {request.genre}
Type: {request.movie_type}
Length: {request.length}
Visual style: {request.style}
Story outline:
{request.outline}
Act 1:
{request.act1}
Act 2:
{request.act2}
Act 3:
{request.act3}
Characters:
{request.characters}
Existing scenes:
{request.scenes}
"""
    url = (
        "https://generativelanguage.googleapis.com/v1beta/"
       "models/gemini-3.7-flash:generateContent"
    )

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = None
            for attempt in range(3):
                response = await client.post(
                    url,
                    params={"key": api_key},
                    json={
                        "contents": [
                            {"parts": [{"text": prompt}]}
                        ]
                    },
                )
                if response.status_code != 503:
                    break
                if attempt < 2:
                    wait_seconds = 2 ** (attempt + 1)
                    print(
                        f"Gemini returned HTTP 503. "
                        f"Retrying in {wait_seconds} seconds "
                        f"(attempt {attempt + 2} of 3)."
                    )
                    await asyncio.sleep(wait_seconds)
        if response.status_code >= 400:
            print(
                f"Gemini API returned HTTP "
                f"{response.status_code}: {response.text}"
            )
            raise HTTPException(
                status_code=502,
                detail=(
                    "Gemini could not generate the screenplay. "
                    "Check the server logs."
                )
            )
        data = response.json()
        screenplay = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
        )
        if not screenplay:
            raise HTTPException(
                status_code=502,
                detail="Gemini returned an empty screenplay."
            )
        return {"screenplay": screenplay}
    except HTTPException:
        raise
    except Exception:
        print("Gemini screenplay request failed.")
        raise HTTPException(
            status_code=502,
            detail="Unable to contact Gemini. Please try again."
        )
# 🌐 FRONTEND MOUNTING LAYER — keep this after all API routes
frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")