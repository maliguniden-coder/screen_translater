# LensTranslate — PRD

## Original Problem Statement
Turkish user wants a mobile app that translates on-screen text in real time — for games, films, series, anime, manga, webtoon. Multiple languages (English, Japanese, Chinese, Turkish, Russian) for both translation and the interface. Light/dark mode toggle. Source→target language selectable both automatically (auto-detect) and manually. AI-powered translation (Gemini). Simple interface.

## Important Constraint (communicated to user)
True system-wide "screen recording + floating overlay over other apps" only works on Android with a native build (not Expo Go) and is impossible on iOS. Implemented the practical, testable approach: in-app image/screenshot upload + camera capture → Gemini OCR + translation → translated bubbles overlaid on the image.

## Architecture
- **Frontend:** Expo Router (React Native), bottom tabs (Çeviri / Geçmiş / Ayarlar), light+dark theming via `src/theme.ts` (external-store driven so manual toggle works on web too), full i18n in `src/i18n.ts` (en/ja/zh/tr/ru), local history + settings via `@/src/utils/storage`.
- **Backend:** FastAPI `POST /api/translate` → Gemini `gemini-3.1-pro-preview` via emergentintegrations (EMERGENT_LLM_KEY). Returns detected_source + regions with translations and bounding boxes (percentages 0–100). Lightweight log stored in Mongo.
- **AI:** Gemini multimodal — single call does OCR + translation + bounding boxes.

## User Persona
Manga/webtoon/anime readers and gamers who hit foreign-language text and want an instant, in-app translation with the layout preserved.

## Core Requirements (static)
- Pick screenshot from gallery OR capture with camera
- AI OCR + translate, overlay translated bubbles at correct positions
- Languages: EN, JA, ZH, TR, RU (+ auto-detect source)
- Manual + automatic source selection
- Light/dark theme toggle
- Localized interface (default Turkish)

## Implemented (2026-06-19)
- Translate home: language pill row (source w/ Auto-detect, target), swap, gallery + camera pickers with full permission flow (settings redirect on denial)
- Gemini translate endpoint (verified: EN→TR/JA/RU, manual source, empty-text case)
- Overlay Result View: edge-to-edge image, glass header, translated bubbles positioned by percentage, tap bubble → original+translation card, share
- History: local list with thumbnails, empty state, clear
- Settings: theme segmented control (System/Light/Dark — verified working), interface language, default source/target
- Full i18n across 5 languages; dark + light themes from design tokens

## Backlog / Remaining
- **P1:** Pinch-to-zoom on the overlay image; tap-to-copy translated text
- **P1:** True Android native screen-capture overlay (requires native build + MediaProjection module)
- **P2:** Batch translate multiple pages; save/export translated image; favorites in history
