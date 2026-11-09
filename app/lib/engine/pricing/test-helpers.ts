import type { CartTotals, EngineRate } from "../types";
import { NO_ADJUSTMENTS } from "../constants";

// Shared builders for the pricing tests.

export const totals = (overrides: Partial<CartTotals> = {}): CartTotals => ({
  subtotal: 180000, // ₹1,800
  weight: 1200, // 1.2 kg
  quantity: 3,
  ...overrides,
});

export const rate = (overrides: Partial<EngineRate>): EngineRate => ({
  id: "rate",
  zoneId: "zone",
  mode: "FLAT",
  bands: [],
  adjustments: NO_ADJUSTMENTS,
  ...overrides,
});
