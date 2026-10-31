// Limits used when validating a rate. Kept apart so validate-rule and
// validate-pricing can share them without importing each other.

export const RULE_NAME_MAX = 100;
export const CHECKOUT_NAME_MAX = 60;
export const DELIVERY_DAYS_MAX = 365;
export const PRICE_MAX = 1_000_000_000; // subunits; well above any real shipping price
export const CONDITIONS_MAX = 10;
// Subunits, grams or items; well above any real cart.
export const CONDITION_VALUE_MAX = 1_000_000_000;
export const BANDS_MAX = 20; // price-table rows per zone
export const PERCENT_BPS_MAX = 10_000; // 100%
