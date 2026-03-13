export type LanguageCode =
  | "en"
  | "es"
  | "fr"
  | "pt"
  | "de"
  | "ja"
  | "zh"
  | "ko"
  | "ar"
  | "ru";

export type Language = {
  readonly code: LanguageCode;
  readonly name: string;
  readonly nativeName: string;
  readonly dir: "ltr" | "rtl";
};

export const LANGUAGES: readonly Language[] = [
  { code: "en", name: "English", nativeName: "English", dir: "ltr" },
  { code: "es", name: "Spanish", nativeName: "Espanol", dir: "ltr" },
  { code: "fr", name: "French", nativeName: "Francais", dir: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Portugues", dir: "ltr" },
  { code: "de", name: "German", nativeName: "Deutsch", dir: "ltr" },
  { code: "ja", name: "Japanese", nativeName: "\u65E5\u672C\u8A9E", dir: "ltr" },
  { code: "zh", name: "Chinese", nativeName: "\u4E2D\u6587", dir: "ltr" },
  { code: "ko", name: "Korean", nativeName: "\uD55C\uAD6D\uC5B4", dir: "ltr" },
  { code: "ar", name: "Arabic", nativeName: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629", dir: "rtl" },
  { code: "ru", name: "Russian", nativeName: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439", dir: "ltr" },
] as const;

export const DEFAULT_LANGUAGE: LanguageCode = "en";

export const STORAGE_KEY = "openfans-language";

export function getLanguage(code: LanguageCode): Language {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
