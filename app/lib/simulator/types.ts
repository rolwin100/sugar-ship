import type { TraceReason } from "../engine";

/**
 * A product variant added to the test cart from Shopify's picker. Price in subunits and
 * weight in grams per unit (from Shopify); quantity as typed.
 */
export type SimulatorLine = {
  productId: number;
  variantId: number;
  title: string; // "Backpack · Khaki"
  sku: string | null;
  vendor: string | null;
  price: number;
  grams: number;
  quantity: string;
};

/**
 * The simulator form as typed: an address, and either products (lines) or the cart's
 * totals. Totals follow the rate editor: subtotal in the shop's currency, weight in kg,
 * quantity in items. When there are lines, the totals are worked out from them.
 */
export type SimulatorDraft = {
  country: string; // ISO code, e.g. "IN"
  province: string; // state code, e.g. "KA"; "" if none
  postcode: string;
  subtotal: string;
  weight: string;
  quantity: string;
  lines: SimulatorLine[];
};

/** Each key maps to a `simulator.error<Key>` translation. */
export type SimulatorErrorKey =
  | "countryRequired"
  | "subtotalInvalid"
  | "weightInvalid"
  | "quantityInvalid"
  | "lineQuantityInvalid";

export type SimulatorError = {
  field: keyof SimulatorDraft;
  key: SimulatorErrorKey;
  line?: number; // for lines: position from 0
};

/** A rate customers would see, with the rate (rule) it comes from. */
export type SimulatedRate = {
  ruleId: string;
  ruleName: string; // admin name
  zoneId: string;
  preset: string | null;
  name: string | null; // custom checkout name
  description: string | null;
  minDeliveryDays: number | null;
  maxDeliveryDays: number | null;
  price: number; // subunits
};

/** A rate customers wouldn't see, and why. */
export type SkippedRate = {
  ruleId: string;
  ruleName: string;
  reason: TraceReason;
};

export type SimulationResult = {
  zoneName: string | null; // the zone the address falls in, if any
  /** Products in the test cart we have no ProductSnapshot for (their tags, type and collections are unknown). */
  unsyncedProducts: string[];
  shown: SimulatedRate[];
  notShown: SkippedRate[];
};

/** The shop's fallback rate as the simulator shows it (null when it's off). */
export type SimulatorFallback = { name: string; price: number } | null;

/** What the simulator action returns to the page. */
export type SimulatorActionResult =
  | { ok: true; result: SimulationResult }
  | { ok: false; errors: SimulatorError[] };
