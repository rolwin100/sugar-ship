import { normCountry, normState } from "../zones/codes";
import data from "./geo-data.json";

/**
 * Country and state lists for the zone editor.
 *
 * geo-data.json is a snapshot of Shopify's own address data (npm package
 * `@shopify/address-mocks`): the 239 countries Shopify supports, and the states of the
 * 32 countries that have them, as { country: { stateCode: stateName } }. State codes are
 * exactly what Shopify sends at checkout (e.g. "MH", or "JP-13" for Japan). State names
 * are English only.
 * To refresh after Shopify adds a country or state: `npm pack @shopify/address-mocks`,
 * read fixtures/countries_en, and rewrite the file in the same shape.
 */

export type Country = { code: string; name: string };
export type State = { code: string; name: string };

/** country code → { state code → state name }, e.g. states.IN.MH === "Maharashtra". */
const states: Record<string, Record<string, string>> = data.states;

/** Country names come from the browser/Node `Intl.DisplayNames`, so they are translated for free. */
const displayNames = new Map<string, Intl.DisplayNames>();
function namesFor(locale: string) {
  let names = displayNames.get(locale);
  if (!names) {
    names = new Intl.DisplayNames([locale], { type: "region" });
    displayNames.set(locale, names);
  }
  return names;
}

/** "IN" → "India" / "Inde" / "Indien". Falls back to the code if the name is unknown. */
export function countryName(code: string, locale = "en"): string {
  const upper = code.trim().toUpperCase();
  try {
    return namesFor(locale).of(upper) ?? upper;
  } catch {
    return upper;
  }
}

/** Every country Shopify supports, sorted by name in the given language. */
export function listCountries(locale = "en"): Country[] {
  return data.countries
    .map((code) => ({ code, name: countryName(code, locale) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

/** A country's states sorted by name, or an empty list when it has none (e.g. France). */
export function listStates(countryCode: string): State[] {
  const byCode = states[normCountry(countryCode)] ?? {};
  return Object.entries(byCode)
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

/**
 * ("IN", "MH") → "Maharashtra". Accepts state codes with or without a country prefix
 * ("JP", "13" → "Tokyo"). Falls back to the code if the state is unknown.
 */
export function stateName(countryCode: string, stateCode: string): string {
  const byCode = states[normCountry(countryCode)] ?? {};
  const code = normCountry(stateCode);
  if (byCode[code]) return byCode[code];
  const match = Object.keys(byCode).find(
    (key) => normState(key) === normState(code),
  );
  return match ? byCode[match] : code;
}

export function hasStates(countryCode: string): boolean {
  return normCountry(countryCode) in states;
}
