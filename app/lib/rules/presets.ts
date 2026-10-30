import type { RatePreset } from "./types";

/** Translation key for each preset's name (used in the admin and at checkout). */
export const PRESET_KEYS = {
  standard: "rates.presetStandard",
  express: "rates.presetExpress",
  economy: "rates.presetEconomy",
  free: "rates.presetFree",
  next_day: "rates.presetNextDay",
} as const satisfies Record<RatePreset, string>;
