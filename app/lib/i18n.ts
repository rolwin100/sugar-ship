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
  return toLocale(new URL(request.url).searchParams.get("locale"));
}

/** "fr-CA" → "fr"; anything we don't support → "en". */
export function toLocale(raw: string | null | undefined): Locale {
  const language = (raw ?? "").toLowerCase().split(/[-_]/)[0];
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

/**
 * A shared, read-only translator for server code outside React (e.g. rate names at
 * checkout). One instance per language, created on first use.
 */
const translators = new Map<Locale, i18n>();
export function translatorFor(raw: string | null | undefined): i18n["t"] {
  const locale = toLocale(raw);
  let instance = translators.get(locale);
  if (!instance) {
    instance = createI18n(locale);
    translators.set(locale, instance);
  }
  return instance.t;
}
