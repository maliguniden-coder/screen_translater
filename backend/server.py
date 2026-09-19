from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import json
import logging
import uuid
from pathlib import Path
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import List

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
GEMINI_MODEL = "gemini-3.1-pro-preview"

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

LANG_NAMES = {
    "auto": "auto-detect the source language",
    "en": "English",
    "ja": "Japanese",
    "zh": "Chinese",
    "tr": "Turkish",
    "ru": "Russian",
    "ko": "Korean",
}


class Box(BaseModel):
    x: float
    y: float
    w: float
    h: float


class Region(BaseModel):
    original: str
    translated: str
    box: Box


class TranslateRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"
    source_lang: str = "auto"
    target_lang: str = "en"


class TranslateResponse(BaseModel):
    id: str
    detected_source: str
    regions: List[Region]


def _build_prompt(source_lang: str, target_lang: str) -> str:
    src = LANG_NAMES.get(source_lang, "auto-detect the source language")
    tgt = LANG_NAMES.get(target_lang, "English")
    source_clause = (
        "Automatically detect the source language of the text."
        if source_lang == "auto"
        else f"The source text is in {src}."
    )
    return f"""You are a precise OCR + translation engine for comics, manga, webtoons, games, movies and screenshots.

Task:
1. Find EVERY block of readable text in the image (speech bubbles, captions, sound effects, on-screen UI, signs, subtitles). Group text that belongs together (e.g. one speech bubble) into a single block.
2. {source_clause}
3. Translate each block into {tgt}. Keep it natural and concise.
4. For each block give a tight bounding box.

Return ONLY valid JSON, no markdown, no explanation, in EXACTLY this shape:
{{
  "detected_source": "<language name you detected, e.g. Japanese>",
  "regions": [
    {{
      "original": "<the original text exactly as written>",
      "translated": "<the {tgt} translation>",
      "box": {{ "x": <number>, "y": <number>, "w": <number>, "h": <number> }}
    }}
  ]
}}

Box coordinates are PERCENTAGES of the image size (0 to 100):
- x = left edge of the box as a percentage of image width
- y = top edge of the box as a percentage of image height
- w = box width as a percentage of image width
- h = box height as a percentage of image height

If there is no readable text, return {{"detected_source": "unknown", "regions": []}}."""


def _extract_json(text: str) -> dict:
    text = text.strip()
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL)
    if fence:
        text = fence.group(1).strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start:end + 1]
    return json.loads(text)


def _clamp(v, lo=0.0, hi=100.0):
    try:
        v = float(v)
    except (TypeError, ValueError):
        return lo
    return max(lo, min(hi, v))


@api_router.get("/")
async def root():
    return {"message": "LensTranslate API"}


@api_router.post("/translate", response_model=TranslateResponse)
async def translate_image(req: TranslateRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="LLM key not configured")

    prompt = _build_prompt(req.source_lang, req.target_lang)

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"translate-{uuid.uuid4()}",
        system_message="You output only strict JSON. Never add commentary.",
    ).with_model("gemini", GEMINI_MODEL)

    image = ImageContent(image_base64=req.image_base64)
    message = UserMessage(text=prompt, file_contents=[image])

    try:
        raw = await chat.send_message(message)
    except Exception as e:
        logger.error(f"Gemini call failed: {e}")
        raise HTTPException(status_code=502, detail="Translation service error")

    try:
        data = _extract_json(raw if isinstance(raw, str) else str(raw))
    except Exception as e:
        logger.error(f"Failed to parse model output: {e} | raw={raw!r}")
        raise HTTPException(status_code=502, detail="Could not parse translation")

    regions: List[Region] = []
    for r in data.get("regions", []) or []:
        box = r.get("box", {}) or {}
        translated = (r.get("translated") or "").strip()
        original = (r.get("original") or "").strip()
        if not translated and not original:
            continue
        regions.append(Region(
            original=original,
            translated=translated or original,
            box=Box(
                x=_clamp(box.get("x", 0)),
                y=_clamp(box.get("y", 0)),
                w=_clamp(box.get("w", 0)),
                h=_clamp(box.get("h", 0)),
            ),
        ))

    result = TranslateResponse(
        id=str(uuid.uuid4()),
        detected_source=str(data.get("detected_source", "unknown")),
        regions=regions,
    )

    try:
        await db.translations.insert_one({
            "id": result.id,
            "source_lang": req.source_lang,
            "target_lang": req.target_lang,
            "detected_source": result.detected_source,
            "region_count": len(regions),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as e:
        logger.warning(f"Could not log translation: {e}")

    return result


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
