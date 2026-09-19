import { Platform } from "react-native";

// Native modules for the Live Screen Capture feature. These only exist in a
// real Android build — never in Expo Go / web / iOS. We require them defensively
// so the JS bundle (and the preview) never crashes when they are absent.

type AnyModule = any;

let FrameCapture: AnyModule = null;
let DrawOver: AnyModule = null;

try {
  FrameCapture = require("react-native-frame-capture");
} catch {
  FrameCapture = null;
}
try {
  DrawOver = require("expo-draw-over-apps");
} catch {
  DrawOver = null;
}

export function isLiveSupported(): boolean {
  return Platform.OS === "android" && !!FrameCapture && !!DrawOver;
}

// --- Overlay ("draw over other apps") -------------------------------------
export function canDrawOverlays(): boolean {
  try {
    return !!DrawOver?.canDrawOverlays?.();
  } catch {
    return false;
  }
}

export async function requestOverlayPermission(): Promise<boolean> {
  try {
    await DrawOver?.requestPermission?.();
    return canDrawOverlays();
  } catch {
    return false;
  }
}

export async function showFloatingBubble(): Promise<void> {
  try {
    await DrawOver?.showBubble?.("lens-live", { edgeHideEnabled: true });
  } catch {
    // no-op
  }
}

export function hideFloatingBubble(): void {
  try {
    DrawOver?.closeBubble?.();
  } catch {
    // no-op
  }
}

// --- Screen capture (MediaProjection) -------------------------------------
export async function requestCapturePermission(): Promise<boolean> {
  try {
    const status = await FrameCapture?.requestPermission?.();
    const granted = FrameCapture?.PermissionStatus?.GRANTED ?? "granted";
    return status === granted;
  } catch {
    return false;
  }
}

export interface FrameEvent {
  filePath: string;
  width?: number;
  height?: number;
}

export function addFrameListener(cb: (e: FrameEvent) => void): { remove: () => void } {
  try {
    const type = FrameCapture?.CaptureEventType?.FRAME_CAPTURED ?? "FRAME_CAPTURED";
    return FrameCapture?.addListener?.(type, cb) ?? { remove: () => {} };
  } catch {
    return { remove: () => {} };
  }
}

export async function startCapture(intervalMs = 2000): Promise<void> {
  try {
    await FrameCapture?.startCapture?.({
      capture: { interval: intervalMs },
      image: { quality: 70, format: "jpeg" },
      storage: { saveFrames: true, location: "private" },
    });
  } catch {
    // no-op
  }
}

export async function stopCapture(): Promise<void> {
  try {
    await FrameCapture?.stopCapture?.();
  } catch {
    // no-op
  }
}
