import type { ZoneError } from "./validate-zone";

export type Region = {
  country: string; // ISO code, e.g. "IN"
  provinces: string[] | null; // null = whole country
};

export type Zone = {
  id: string;
  name: string;
  restOfWorld: boolean;
  regions: Region[];
  sortOrder?: number;
};

/** The parts of a delivery address that zone matching uses. */
export type ZoneAddress = {
  country?: string | null;
  province?: string | null;
};

/** A zone for the list page, with how many rates use it (shown in the delete warning). */
export type ZoneListItem = Zone & { rateCount: number };

export type SaveZoneResult =
  | { ok: true; zone: Zone }
  | { ok: false; errors: ZoneError[] }
  | { ok: false; notFound: true };

/** The zone as the edit page holds it while the merchant is changing it. */
export type ZoneDraft = {
  name: string;
  restOfWorld: boolean;
  regions: Region[];
};

/** What the zone edit action returns to the page. */
export type ZoneActionResult =
  | { ok: true; intent: "save" | "delete" }
  | { ok: false; errors: ZoneError[] }
  | { ok: false; invalid: true };
