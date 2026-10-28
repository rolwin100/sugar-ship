import i18next, { type i18n } from "i18next";
import en from "../locales/en.json";
import fr from "../locales/fr.json";
import de from "../locales/de.json";

export const SUPPORTED_LOCALES = ["en", "fr", "de"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
  de: { translation: de },
} as const;

/**
 * Shopify adds `?locale=` (e.g. "fr" or "fr-CA") when it opens the app in the admin.
 * We keep the language part and fall back to English for anything we don't support.
 */
export function getLocale(request: Request): Locale {
  const raw = new URL(request.url).searchParams.get("locale") ?? "";
  const language = raw.toLowerCase().split(/[-_]/)[0];
  return (SUPPORTED_LOCALES as readonly string[]).includes(language)
    ? (language as Locale)
    : "en";
}

/** A fresh i18next instance per render, so requests in different languages never share one. */
export function createI18n(locale: Locale): i18n {
  const instance = i18next.createInstance();
  void instance.init({
    resources,
    lng: locale,
    fallbackLng: "en",
    initAsync: false, // resources are bundled, so set up synchronously (no flash of English)
    interpolation: { escapeValue: false }, // React already escapes
  });
  return instance;
}
