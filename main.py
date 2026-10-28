import os
import asyncio
import replicate
import httpx
import secrets
import hmac
import json
from fastapi import FastAPI, HTTPException, Security, Depends, Request
from fastapi.security import APIKeyHeader
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client
import base64
import hashlib
import time
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
MASTER_API_KEY = os.getenv("MASTER_API_KEY")
PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY")
REPLICATE_WEBHOOK_SECRET = os.getenv("REPLICATE_WEBHOOK_SECRET")
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)
app = FastAPI(
    title="Movieai Studio - Commercial Video Engine",
    description="Production-grade asynchronous multi-tenant AI video processing engine.",
    version="2.0.0"
)
# SECURITY LAYER
def get_api_key(api_key: str = Depends(api_key_header)):
    if not MASTER_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="API authentication is not configured."
        )
    if not api_key or api_key != MASTER_API_KEY:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid API Key"
        )
    return api_key
class VideoRequest(BaseModel):
    prompt: str
    aspect_ratio: str = "16:9"
class PaymentInitializeRequest(BaseModel):
    package_code: str
    package_version: int
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
async def replicate_webhook(request: Request):
    if not REPLICATE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Replicate webhook verification is not configured."
        )
    webhook_id = request.headers.get("webhook-id", "")
    webhook_timestamp = request.headers.get("webhook-timestamp", "")
    webhook_signature = request.headers.get("webhook-signature", "")
    if not webhook_id or not webhook_timestamp or not webhook_signature:
        raise HTTPException(
            status_code=401,
            detail="Missing Replicate webhook signature headers."
        )
    try:
        timestamp = int(webhook_timestamp)
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Invalid webhook timestamp."
        )
    if abs(time.time() - timestamp) > 300:
        raise HTTPException(
            status_code=401,
            detail="Webhook timestamp is outside the allowed window."
        )
    if not REPLICATE_WEBHOOK_SECRET.startswith("whsec_"):
        raise HTTPException(
            status_code=503,
            detail="Replicate webhook signing secret is invalid."
        )
    try:
        signing_key = base64.b64decode(
            REPLICATE_WEBHOOK_SECRET.removeprefix("whsec_"),
            validate=True
        )
        raw_body = await request.body()
        signed_content = (
            webhook_id.encode("utf-8")
            + b"."
            + webhook_timestamp.encode("utf-8")
            + b"."
            + raw_body
        )
        expected_signature = base64.b64encode(
            hmac.new(
                signing_key,
                signed_content,
                hashlib.sha256
            ).digest()
        ).decode("utf-8")
        signature_valid = any(
            version == "v1"
            and hmac.compare_digest(
                supplied_signature,
                expected_signature
            )
            for item in webhook_signature.split()
            for version, separator, supplied_signature
            in [item.partition(",")]
            if separator
        )
        if not signature_valid:
            raise HTTPException(
                status_code=401,
                detail="Invalid Replicate webhook signature."
            )
        body = json.loads(raw_body)
    except HTTPException:
        raise
    except (ValueError, UnicodeDecodeError, TypeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid Replicate webhook payload."
        )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Could not verify Replicate webhook."
        )
    task_id = body.get("id")
    status = body.get("status")
    output = body.get("output")
    if not isinstance(task_id, str) or not task_id:
        raise HTTPException(
            status_code=400,
            detail="Webhook payload is missing a valid task ID."
        )
    if status == "succeeded":
        db_status = "completed"
        final_video_url = None
        if isinstance(output, list) and output:
            final_video_url = output[0] if isinstance(output[0], str) else None
        elif isinstance(output, str):
            final_video_url = output
        if not final_video_url:
            raise HTTPException(
                status_code=400,
                detail="Completed prediction did not contain a video URL."
            )
    elif status in ("failed", "canceled"):
        db_status = "failed"
        final_video_url = None
    elif status in ("starting", "processing"):
        db_status = "processing"
        final_video_url = None
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported Replicate prediction status."
        )
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Database is not configured."
        )
    try:
        update_result = (
            supabase.table("video_tasks")
            .update({
                "status": db_status,
                "video_url": final_video_url
            })
            .eq("task_id", task_id)
            .eq("status", "processing")
            .select("task_id, status")
            .execute()
        )
        if not update_result.data:
            existing_result = (
                supabase.table("video_tasks")
                .select("task_id, status")
                .eq("task_id", task_id)
                .limit(1)
                .execute()
            )
            # Replicate may deliver the webhook before the task row
            # finishes being inserted. Briefly wait for the row.
            if not existing_result.data:
                for attempt in range(3):
                    await asyncio.sleep(0.5 * (attempt + 1))
                    existing_result = (
                        supabase.table("video_tasks")
                        .select("task_id, status")
                        .eq("task_id", task_id)
                        .limit(1)
                        .execute()
                    )
                    if existing_result.data:
                        break
            if not existing_result.data:
                raise HTTPException(
                    status_code=404,
                    detail="Video task not found; webhook may be retried."
                )
            existing_status = existing_result.data[0].get("status")
            # A duplicate or delayed event must not overwrite a
            # task that has already reached a terminal status.
            if existing_status in ("completed", "failed"):
                return {"status": "success"}
            # The task may have appeared during the retry window.
            # Retry the conditional update while it is processing.
            if existing_status == "processing":
                retry_update_result = (
                    supabase.table("video_tasks")
                    .update({
                        "status": db_status,
                        "video_url": final_video_url
                    })
                    .eq("task_id", task_id)
                    .eq("status", "processing")
                    .select("task_id, status")
                    .execute()
                )
                if retry_update_result.data:
                    return {"status": "success"}
                # Another webhook may have completed it concurrently.
                latest_result = (
                    supabase.table("video_tasks")
                    .select("task_id, status")
                    .eq("task_id", task_id)
                    .limit(1)
                    .execute()
                )
                if latest_result.data:
                    latest_status = latest_result.data[0].get("status")
                    if latest_status in ("completed", "failed"):
                        return {"status": "success"}
            raise HTTPException(
                status_code=503,
                detail="Video task update should be retried."
            )
            existing_status = existing_result.data[0].get("status")
            if existing_status in ("completed", "failed"):
                return {"status": "success"}
            raise HTTPException(
                status_code=503,
                detail="Video task update should be retried."
            )
    except HTTPException:
        raise
    except Exception:
        print("Replicate webhook database update failed.")
        raise HTTPException(
            status_code=500,
            detail="Could not update video task."
        )

    return {"status": "success"}
class ScreenplayResponse(BaseModel):
    screenplay: str
@app.post("/v1/screenplay")
async def generate_screenplay(
    request: ScreenplayRequest,
    http_request: Request
):
       # Require a valid Supabase login session.
    auth_header = http_request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Please log in to generate a screenplay."
        )
    access_token = auth_header.removeprefix("Bearer ").strip()
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Authentication service is not configured."
        )
    try:
        auth_response = supabase.auth.get_user(access_token)
        if not auth_response or not auth_response.user:
            raise HTTPException(
                status_code=401,
                detail="Your login session is invalid or expired."
            )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Your login session is invalid or expired."
        )
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key is not configured on the server."
        )
    prompt = f"""
You are the lead screenwriter and continuity supervisor for MovieAI Studio.
Your goal is creative cinematic storytelling, but the user's original plot always comes first.
STRICT STORY PRIORITY:
1. The user's movie idea, outline, acts, character details, and scene cards are the source of truth.
2. Preserve the user's specified events, motivations, actions, locations, and intended outcomes.
3. When details differ, do not silently replace the user's explicit instructions with an invented alternative.
4. Use cinematic creativity to expand the user's story, not to rewrite its essential meaning.
5. Treat each scene card as a required part of the screenplay. Preserve its title, location, time, characters, action, dialogue when provided, and camera intent.
6. Connect the scene cards into one coherent screenplay in their supplied order. Do not skip, merge away, or contradict their key events.
7. If the user specifies why a character takes an action, preserve that reason. For example, if a character fetches water to drink, do not change the purpose to repairing a vehicle.
8. Add suspense, atmosphere, dialogue, believable complications, and cinematic detail only when these additions support rather than replace the specified story.
9. Keep this request isolated to the current project. Use only the project details included in this request; never introduce characters, events, or history from unrelated movies.
10. Maintain consistent character identities, ages, appearances, personalities, relationships, knowledge, possessions, injuries, and decisions throughout the screenplay.
11. If information is ambiguous or missing, make the smallest reasonable assumption consistent with the user's instructions. Do not invent major backstory or plot changes unnecessarily.
8. If the project type is a series, write the requested episode as part of a potentially ongoing series, not as the entire series finale unless the user explicitly requests a finale.
9. Give each episode its own distinct central conflict, meaningful stakes, character development, and dramatic progression. Do not simply repeat a previous episode's conflict.
10. Resolve the episode's main conflict within that episode when appropriate. If the story requires a continuing conflict, end with a purposeful cliffhanger or unresolved question that can carry into the next episode.
11. Preserve unresolved conflicts and established story threads when prior episode summaries or series history are provided. Do not invent prior events that are absent from the supplied history.
12. Build longer story arcs gradually across episodes and seasons, while allowing each episode to deliver meaningful progress.
13. Do not declare the whole series complete merely because one episode or season has been written. Respect the user's chosen stopping point or finale instructions when provided.
14. If season, episode, continuity history, or stopping instructions are not provided, do not pretend they were supplied. Write a coherent screenplay based on the available information.
PROJECT DETAILS:
Title: {request.title}
Idea: {request.idea}
Genre: {request.genre}
Type: {request.movie_type}
Length: {request.length}
Visual style: {request.style}
USER'S STORY OUTLINE:
{request.outline}
ACT 1 — BEGINNING:
{request.act1}
ACT 2 — CONFLICT:
{request.act2}
ACT 3 — RESOLUTION:
{request.act3}
ESTABLISHED CHARACTERS:
{request.characters}
USER-DEFINED SCENES:
{request.scenes}
OUTPUT:
Return screenplay text only. Use clear scene headings, cinematic action, and dialogue. Preserve the user's key story requirements and maintain continuity throughout.
"""
    url = (
        "https://generativelanguage.googleapis.com/v1beta/"
        "models/gemini-3.8-flash:generateContent"
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
@app.post("/webhook")
async def paystack_webhook(request: Request):
    if not PAYSTACK_SECRET_KEY or not supabase:
        raise HTTPException(
            status_code=503,
            detail="Payment verification is not configured."
        )
    raw_body = await request.body()
    signature = request.headers.get("x-paystack-signature", "")
    expected_signature = hmac.new(
        PAYSTACK_SECRET_KEY.encode("utf-8"),
        raw_body,
        digestmod="sha512"
    ).hexdigest()
    if not signature or not hmac.compare_digest(
        signature, expected_signature
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid Paystack webhook signature."
        )
    try:
        event = json.loads(raw_body)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid webhook JSON."
        )
    if not isinstance(event, dict):
        raise HTTPException(
            status_code=400,
            detail="Invalid webhook payload."
        )
    if event.get("event") != "charge.success":
        return {"status": "ignored"}
    data = event.get("data")
    if not isinstance(data, dict):
        raise HTTPException(
            status_code=400,
            detail="Invalid transaction payload."
        )
    reference = data.get("reference")
    if not isinstance(reference, str) or not reference:
        raise HTTPException(
            status_code=400,
            detail="Missing payment reference."
        )
    from urllib.parse import quote

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                "https://api.paystack.co/transaction/verify/"
                + quote(reference, safe=""),
                headers={
                    "Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"
                }
            )
        if response.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail="Could not verify payment with Paystack."
            )
        try:
            verification = response.json()
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=502,
                detail="Paystack returned an invalid verification response."
            )
        if not isinstance(verification, dict):
            raise HTTPException(
                status_code=502,
                detail="Paystack returned an invalid verification response."
            )
        verified_data = verification.get("data")
        if not isinstance(verified_data, dict):
            raise HTTPException(
                status_code=400,
                detail="Invalid verified transaction data."
            )
        if (
            not verification.get("status")
            or verified_data.get("status") != "success"
            or verified_data.get("reference") != reference
        ):
            raise HTTPException(
                status_code=400,
                detail="Paystack transaction is not successful."
            )
        amount_minor = verified_data.get("amount")
        currency = verified_data.get("currency")
        if (
            not isinstance(amount_minor, int)
            or isinstance(amount_minor, bool)
            or amount_minor <= 0
            or not isinstance(currency, str)
        ):
            raise HTTPException(
                status_code=400,
                detail="Invalid verified payment details."
            )
        result = supabase.rpc(
            "award_verified_payment",
            {
                "p_reference": reference,
                "p_amount_minor": amount_minor,
                "p_currency": currency
            }
        ).execute()
        return {
            "status": "success",
            "payment": result.data
        }
    except HTTPException:
        raise
    except Exception:
        print("Paystack verification or credit processing failed.")
        raise HTTPException(
            status_code=500,
            detail="Payment processing failed; retry safely."
        )
# 🌐 FRONTEND MOUNTING LAYER — keep this after all API routes
frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")