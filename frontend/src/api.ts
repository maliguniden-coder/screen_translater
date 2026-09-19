import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { SourceCode, LangCode } from "./languages";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Region {
  original: string;
  translated: string;
  box: Box;
}

export interface TranslateResult {
  id: string;
  detectedSource: string;
  regions: Region[];
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  sourceLang: SourceCode;
  targetLang: LangCode;
  createdAt: string;
}

// Downscale + JPEG-encode to base64 so the payload stays small and fast.
async function toBase64(uri: string, width: number): Promise<string> {
  const context = ImageManipulator.manipulate(uri);
  const targetWidth = Math.min(width || 1500, 1500);
  context.resize({ width: targetWidth });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    compress: 0.7,
    format: SaveFormat.JPEG,
    base64: true,
  });
  return saved.base64 ?? "";
}

export interface TranslateArgs {
  uri: string;
  width: number;
  height: number;
  sourceLang: SourceCode;
  targetLang: LangCode;
}

export async function translateImage(args: TranslateArgs): Promise<TranslateResult> {
  const base64 = await toBase64(args.uri, args.width);
  const res = await fetch(`${BACKEND_URL}/api/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_base64: base64,
      mime_type: "image/jpeg",
      source_lang: args.sourceLang,
      target_lang: args.targetLang,
    }),
  });

  if (!res.ok) {
    throw new Error(`translate failed: ${res.status}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    detectedSource: data.detected_source,
    regions: data.regions ?? [],
    imageUri: args.uri,
    imageWidth: args.width,
    imageHeight: args.height,
    sourceLang: args.sourceLang,
    targetLang: args.targetLang,
    createdAt: new Date().toISOString(),
  };
}
