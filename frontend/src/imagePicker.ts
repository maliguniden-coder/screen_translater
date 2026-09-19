import * as ImagePicker from "expo-image-picker";

export interface PickedAsset {
  uri: string;
  width: number;
  height: number;
}

export type PickOutcome =
  | { status: "ok"; asset: PickedAsset }
  | { status: "cancelled" }
  | { status: "denied"; canAskAgain: boolean };

function firstAsset(res: ImagePicker.ImagePickerResult): PickedAsset | null {
  if (res.canceled || !res.assets || res.assets.length === 0) return null;
  const a = res.assets[0];
  return { uri: a.uri, width: a.width ?? 1000, height: a.height ?? 1000 };
}

export async function pickFromGallery(): Promise<PickOutcome> {
  const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
  let granted = perm.granted;
  if (!granted) {
    if (!perm.canAskAgain) return { status: "denied", canAskAgain: false };
    const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
    granted = req.granted;
    if (!granted) return { status: "denied", canAskAgain: req.canAskAgain };
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
  });
  const asset = firstAsset(res);
  return asset ? { status: "ok", asset } : { status: "cancelled" };
}

export async function pickFromCamera(): Promise<PickOutcome> {
  const perm = await ImagePicker.getCameraPermissionsAsync();
  let granted = perm.granted;
  if (!granted) {
    if (!perm.canAskAgain) return { status: "denied", canAskAgain: false };
    const req = await ImagePicker.requestCameraPermissionsAsync();
    granted = req.granted;
    if (!granted) return { status: "denied", canAskAgain: req.canAskAgain };
  }
  const res = await ImagePicker.launchCameraAsync({ quality: 1 });
  const asset = firstAsset(res);
  return asset ? { status: "ok", asset } : { status: "cancelled" };
}

// Quick mode: grab the most recent photo/screenshot from the gallery and
// translate it in a single tap. Works in Expo Go / native (needs media-library
// permission). On web the native module is absent, so we guard the import.
export async function pickLatest(): Promise<PickOutcome> {
  let MediaLibrary: typeof import("expo-media-library");
  try {
    MediaLibrary = require("expo-media-library");
  } catch {
    return { status: "cancelled" };
  }

  const perm = await MediaLibrary.getPermissionsAsync();
  let granted = perm.granted;
  if (!granted) {
    if (!perm.canAskAgain) return { status: "denied", canAskAgain: false };
    const req = await MediaLibrary.requestPermissionsAsync();
    granted = req.granted;
    if (!granted) return { status: "denied", canAskAgain: req.canAskAgain };
  }
  const res = await MediaLibrary.getAssetsAsync({
    first: 1,
    sortBy: [[MediaLibrary.SortBy.creationTime, false]],
    mediaType: MediaLibrary.MediaType.photo,
  });
  if (!res.assets.length) return { status: "cancelled" };
  const a = res.assets[0];
  let uri = a.uri;
  try {
    const info = await MediaLibrary.getAssetInfoAsync(a);
    uri = info.localUri ?? a.uri;
  } catch {
    // fall back to a.uri
  }
  return { status: "ok", asset: { uri, width: a.width || 1000, height: a.height || 1000 } };
}
