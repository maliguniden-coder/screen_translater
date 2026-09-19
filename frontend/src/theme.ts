// Design tokens for LensTranslate. Light + dark themes.
// Keys match the "color" block of /app/design_guidelines.json.

import { useMemo, useSyncExternalStore } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#FAFAFA",
  onSurface: "#111111",
  surfaceSecondary: "#FFFFFF",
  onSurfaceSecondary: "#111111",
  surfaceTertiary: "#F0F0F0",
  onSurfaceTertiary: "#333333",
  surfaceInverse: "#111111",
  onSurfaceInverse: "#FFFFFF",
  muted: "#737373",

  brand: "#5A7356",
  onBrand: "#FFFFFF",
  brandPrimary: "#5A7356",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#E8EBE7",
  onBrandSecondary: "#344632",
  brandTertiary: "#F1F4F1",
  onBrandTertiary: "#40523E",

  success: "#3C6141",
  onSuccess: "#FFFFFF",
  warning: "#8A671B",
  onWarning: "#FFFFFF",
  error: "#8B3A36",
  onError: "#FFFFFF",
  info: "#3E5C60",
  onInfo: "#FFFFFF",

  border: "#E5E5E5",
  borderStrong: "#CCCCCC",
  divider: "#EBEBEB",
};

const dark: typeof light = {
  surface: "#0F0F0F",
  onSurface: "#EDEDED",
  surfaceSecondary: "#1A1A1A",
  onSurfaceSecondary: "#EDEDED",
  surfaceTertiary: "#262626",
  onSurfaceTertiary: "#CCCCCC",
  surfaceInverse: "#FAFAFA",
  onSurfaceInverse: "#111111",
  muted: "#8F8F8F",

  brand: "#6A8666",
  onBrand: "#0B120B",
  brandPrimary: "#769571",
  onBrandPrimary: "#0B120B",
  brandSecondary: "#1F291E",
  onBrandSecondary: "#A3C29D",
  brandTertiary: "#171F16",
  onBrandTertiary: "#8BB085",

  success: "#4A7A52",
  onSuccess: "#0B120B",
  warning: "#A8822B",
  onWarning: "#120E03",
  error: "#B04F4A",
  onError: "#1A0A09",
  info: "#527D82",
  onInfo: "#0B120B",

  border: "#2E2E2E",
  borderStrong: "#454545",
  divider: "#242424",
};

export type ThemeColors = typeof light;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48 };
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 };
export const fontSize = { sm: 12, base: 14, lg: 16, xl: 20, "2xl": 24, "3xl": 30 };

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark: ThemeColors } = { light, dark };

export type ThemeMode = "system" | "light" | "dark";

// The manual theme choice is the source of truth for the palette. useColorScheme()
// / Appearance is unreliable on web, so we keep our own tiny external store and
// only fall back to the device scheme when the user picked "system".
let currentMode: ThemeMode = "system";
const listeners = new Set<() => void>();

export function setThemeMode(mode: ThemeMode) {
  currentMode = mode;
  // Keep native chrome (alerts, pickers) roughly in sync where supported.
  Appearance.setColorScheme?.(mode === "system" ? "unspecified" : mode);
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function getSnapshot() {
  return currentMode;
}

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const mode = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const scheme: ColorScheme =
    mode === "system" ? (system && themes[system] ? system : defaultScheme) : mode;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
