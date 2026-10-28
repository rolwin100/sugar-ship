/** Country codes: trimmed and upper-cased, e.g. " in " → "IN". */
export const normCountry = (value: string | null | undefined) =>
  (value ?? "").trim().toUpperCase();

/** State codes: also drops a country prefix, so "JP-13", "jp-13" and "13" all become "13". */
export const normState = (value: string | null | undefined) =>
  normCountry(value).replace(/^[A-Z]{2}-/, "");
