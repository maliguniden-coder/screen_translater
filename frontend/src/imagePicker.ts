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
