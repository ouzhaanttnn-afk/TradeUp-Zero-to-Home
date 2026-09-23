export type Language = "tr" | "en" | "de" | "es";

export interface LanguageOption {
  code: Language;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: readonly LanguageOption[] = [
  { code: "tr", label: "Türkçe", nativeLabel: "Türkçe" },
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "de", label: "Deutsch", nativeLabel: "Deutsch" },
  { code: "es", label: "Español", nativeLabel: "Español" },
] as const;
