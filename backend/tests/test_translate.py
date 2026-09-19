"""Backend tests for LensTranslate API (Gemini OCR + translate)."""
import base64
import io
import os
import pytest
import requests
from PIL import Image, ImageDraw, ImageFont

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://realtime-text-ocr.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
TIMEOUT = 120


def _font(size=44):
    for path in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _make_text_image(lines, size=(900, 500), bg=(245, 240, 225), fg=(20, 20, 20)) -> str:
    img = Image.new("RGB", size, bg)
    draw = ImageDraw.Draw(img)
    # add some non-uniform features so it isn't a solid image
    draw.rectangle([10, 10, size[0] - 10, size[1] - 10], outline=(120, 120, 120), width=4)
    draw.line([(0, size[1] // 2), (size[0], size[1] // 2)], fill=(200, 200, 200), width=2)
    font = _font(48)
    y = 60
    for line in lines:
        draw.text((60, y), line, fill=fg, font=font)
        y += 90
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode()


def _make_blank_but_textured_image() -> str:
    """Image with visual features but NO readable text."""
    img = Image.new("RGB", (600, 400), (200, 220, 240))
    draw = ImageDraw.Draw(img)
    for i in range(0, 600, 20):
        draw.line([(i, 0), (i, 400)], fill=(180, 200, 220), width=1)
    draw.ellipse([100, 80, 300, 280], fill=(120, 160, 200), outline=(60, 90, 120), width=4)
    draw.rectangle([350, 120, 520, 300], fill=(240, 180, 80), outline=(180, 120, 40), width=4)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return base64.b64encode(buf.getvalue()).decode()


@pytest.fixture(scope="module")
def english_image_b64():
    return _make_text_image(["Hello world", "How are you today?", "Good morning friend"])


@pytest.fixture(scope="module")
def no_text_image_b64():
    return _make_blank_but_textured_image()


# --- Root health ---
def test_root_message():
    r = requests.get(f"{API}/", timeout=30)
    assert r.status_code == 200
    assert r.json() == {"message": "LensTranslate API"}


# --- Helpers ---
def _validate_translate_response(data, expect_regions=True):
    assert "id" in data and isinstance(data["id"], str)
    assert "detected_source" in data
    assert "regions" in data and isinstance(data["regions"], list)
    if expect_regions:
        assert len(data["regions"]) > 0, f"Expected non-empty regions, got: {data}"
        for reg in data["regions"]:
            assert "original" in reg
            assert "translated" in reg and isinstance(reg["translated"], str)
            box = reg["box"]
            for k in ("x", "y", "w", "h"):
                assert k in box
                assert 0 <= float(box[k]) <= 100, f"{k}={box[k]} out of 0-100 range"


# --- Translate: auto -> tr ---
def test_translate_auto_to_turkish(english_image_b64):
    payload = {
        "image_base64": english_image_b64,
        "mime_type": "image/jpeg",
        "source_lang": "auto",
        "target_lang": "tr",
    }
    r = requests.post(f"{API}/translate", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    data = r.json()
    _validate_translate_response(data, expect_regions=True)
    # detected_source should mention english
    assert "english" in data["detected_source"].lower(), data["detected_source"]


# --- Translate: auto -> ja ---
def test_translate_auto_to_japanese(english_image_b64):
    payload = {
        "image_base64": english_image_b64,
        "mime_type": "image/jpeg",
        "source_lang": "auto",
        "target_lang": "ja",
    }
    r = requests.post(f"{API}/translate", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    data = r.json()
    _validate_translate_response(data, expect_regions=True)
    # At least one translated string should contain non-ascii (Japanese chars)
    joined = "".join(reg["translated"] for reg in data["regions"])
    assert any(ord(c) > 127 for c in joined), f"Expected Japanese chars in: {joined}"


# --- Translate: auto -> ru ---
def test_translate_auto_to_russian(english_image_b64):
    payload = {
        "image_base64": english_image_b64,
        "mime_type": "image/jpeg",
        "source_lang": "auto",
        "target_lang": "ru",
    }
    r = requests.post(f"{API}/translate", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    data = r.json()
    _validate_translate_response(data, expect_regions=True)
    joined = "".join(reg["translated"] for reg in data["regions"])
    # Cyrillic range
    assert any("\u0400" <= c <= "\u04FF" for c in joined), f"Expected Cyrillic in: {joined}"


# --- Translate: manual source (en) -> tr ---
def test_translate_manual_source_en(english_image_b64):
    payload = {
        "image_base64": english_image_b64,
        "mime_type": "image/jpeg",
        "source_lang": "en",
        "target_lang": "tr",
    }
    r = requests.post(f"{API}/translate", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    data = r.json()
    _validate_translate_response(data, expect_regions=True)


# --- Translate: no-text image returns empty regions ---
def test_translate_no_text_returns_empty(no_text_image_b64):
    payload = {
        "image_base64": no_text_image_b64,
        "mime_type": "image/jpeg",
        "source_lang": "auto",
        "target_lang": "tr",
    }
    r = requests.post(f"{API}/translate", json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data.get("regions"), list)
    assert data["regions"] == [], f"Expected empty regions for text-less image, got: {data['regions']}"
