import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { storage } from "@/src/utils/storage";
import { setThemeMode as applyThemeMode } from "@/src/theme";
import { TKey, translate, UILang } from "@/src/i18n";
import { LangCode, SourceCode } from "@/src/languages";
import { TranslateResult } from "@/src/api";

type ThemeMode = "system" | "light" | "dark";

interface Settings {
  themeMode: ThemeMode;
  uiLang: UILang;
  defaultSource: SourceCode;
  defaultTarget: LangCode;
}

const DEFAULT_SETTINGS: Settings = {
  themeMode: "system",
  uiLang: "tr",
  defaultSource: "auto",
  defaultTarget: "tr",
};

const SETTINGS_KEY = "lens.settings.v1";
const HISTORY_KEY = "lens.history.v1";
const MAX_HISTORY = 50;

interface StoreValue {
  ready: boolean;
  settings: Settings;
  setThemeMode: (m: ThemeMode) => void;
  setUiLang: (l: UILang) => void;
  setDefaultSource: (s: SourceCode) => void;
  setDefaultTarget: (t: LangCode) => void;
  t: (key: TKey) => string;

  history: TranslateResult[];
  addHistory: (r: TranslateResult) => void;
  clearHistory: () => void;

  activeResult: TranslateResult | null;
  setActiveResult: (r: TranslateResult | null) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function applyTheme(mode: ThemeMode) {
  applyThemeMode(mode);
}

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await storage.getItem<string>(key, "");
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJSON(key: string, value: unknown) {
  await storage.setItem(key, JSON.stringify(value));
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<TranslateResult[]>([]);
  const [activeResult, setActiveResult] = useState<TranslateResult | null>(null);

  useEffect(() => {
    (async () => {
      const s = await readJSON<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
      const merged = { ...DEFAULT_SETTINGS, ...s };
      setSettings(merged);
      applyTheme(merged.themeMode);
      const h = await readJSON<TranslateResult[]>(HISTORY_KEY, []);
      setHistory(Array.isArray(h) ? h : []);
      setReady(true);
    })();
  }, []);

  const persistSettings = useCallback((next: Settings) => {
    setSettings(next);
    writeJSON(SETTINGS_KEY, next);
  }, []);

  const setThemeMode = useCallback(
    (themeMode: ThemeMode) => {
      applyTheme(themeMode);
      persistSettings({ ...settings, themeMode });
    },
    [settings, persistSettings],
  );

  const setUiLang = useCallback(
    (uiLang: UILang) => persistSettings({ ...settings, uiLang }),
    [settings, persistSettings],
  );
  const setDefaultSource = useCallback(
    (defaultSource: SourceCode) => persistSettings({ ...settings, defaultSource }),
    [settings, persistSettings],
  );
  const setDefaultTarget = useCallback(
    (defaultTarget: LangCode) => persistSettings({ ...settings, defaultTarget }),
    [settings, persistSettings],
  );

  const t = useCallback((key: TKey) => translate(settings.uiLang, key), [settings.uiLang]);

  const addHistory = useCallback((r: TranslateResult) => {
    setHistory((prev) => {
      const next = [r, ...prev].slice(0, MAX_HISTORY);
      writeJSON(HISTORY_KEY, next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    writeJSON(HISTORY_KEY, []);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      settings,
      setThemeMode,
      setUiLang,
      setDefaultSource,
      setDefaultTarget,
      t,
      history,
      addHistory,
      clearHistory,
      activeResult,
      setActiveResult,
    }),
    [
      ready,
      settings,
      setThemeMode,
      setUiLang,
      setDefaultSource,
      setDefaultTarget,
      t,
      history,
      addHistory,
      clearHistory,
      activeResult,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
