// Languages supported for translation source/target and for the interface.

export type LangCode = "en" | "ja" | "zh" | "tr" | "ru" | "ko";
export type SourceCode = LangCode | "auto";

export interface LangDef {
  code: LangCode;
  english: string; // english name
  native: string; // native label
  flag: string; // emoji flag for quick visual scanning
}

export const LANGUAGES: LangDef[] = [
  { code: "en", english: "English", native: "English", flag: "🇬🇧" },
  { code: "ja", english: "Japanese", native: "日本語", flag: "🇯🇵" },
  { code: "ko", english: "Korean", native: "한국어", flag: "🇰🇷" },
  { code: "zh", english: "Chinese", native: "中文", flag: "🇨🇳" },
  { code: "tr", english: "Turkish", native: "Türkçe", flag: "🇹🇷" },
  { code: "ru", english: "Russian", native: "Русский", flag: "🇷🇺" },
];

export function langLabel(code: SourceCode): string {
  if (code === "auto") return "";
  const l = LANGUAGES.find((x) => x.code === code);
  return l ? l.native : code;
}

export function langFlag(code: SourceCode): string {
  if (code === "auto") return "🌐";
  const l = LANGUAGES.find((x) => x.code === code);
  return l ? l.flag : "🏳️";
}
