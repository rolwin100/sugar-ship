/**
 * Rule engine types. The engine is pure TypeScript: no Prisma, Shopify or I/O.
 * Units: money in subunits, weight in grams, percentages in basis points.
 * The string types derive from the constants in ./constants, which mirror the
 * Prisma enums in prisma/schema.prisma.
 */

import type {
  ADJUSTMENT_KIND,
  ADJUSTMENT_TYPE,
  CART_CONDITION_FIELD,
  COMBINE_STRATEGY,
  CONDITION_OPERATOR,
  CONDITION_SUBJECT,
  PRODUCT_CONDITION_FIELD,
  QUANTIFIER,
  RATE_BASIS,
  RATE_MODE,
  RULE_MATCH,
  RULE_STATUS,
  TRACE_OUTCOME,
  TRACE_REASON,
} from "./constants";

type ValueOf<T> = T[keyof T];

export type ConditionSubject = ValueOf<typeof CONDITION_SUBJECT>;
export type ConditionOperator = ValueOf<typeof CONDITION_OPERATOR>;
export type Quantifier = ValueOf<typeof QUANTIFIER>;
export type RuleStatus = ValueOf<typeof RULE_STATUS>;
export type RuleMatch = ValueOf<typeof RULE_MATCH>;

/** Operators that compare two numbers (cart totals now). */
export type NumberOperator = Extract<
  ConditionOperator,
  | typeof CONDITION_OPERATOR.EQUALS
  | typeof CONDITION_OPERATOR.NOT_EQUALS
  | typeof CONDITION_OPERATOR.GREATER_THAN
  | typeof CONDITION_OPERATOR.GREATER_OR_EQUAL
  | typeof CONDITION_OPERATOR.LESS_THAN
  | typeof CONDITION_OPERATOR.LESS_OR_EQUAL
>;
/** Operators that compare text (or collection ids) for product conditions. */
export type TextOperator = Extract<
  ConditionOperator,
  | typeof CONDITION_OPERATOR.EQUALS
  | typeof CONDITION_OPERATOR.NOT_EQUALS
  | typeof CONDITION_OPERATOR.CONTAINS
  | typeof CONDITION_OPERATOR.NOT_CONTAINS
  | typeof CONDITION_OPERATOR.IN
  | typeof CONDITION_OPERATOR.NOT_IN
>;
export type ProductConditionField = ValueOf<typeof PRODUCT_CONDITION_FIELD>;
export type RateMode = ValueOf<typeof RATE_MODE>;
export type RateBasis = ValueOf<typeof RATE_BASIS>;
export type AdjustmentKind = ValueOf<typeof ADJUSTMENT_KIND>;
export type AdjustmentType = ValueOf<typeof ADJUSTMENT_TYPE>;
export type CombineStrategy = ValueOf<typeof COMBINE_STRATEGY>;

// ---- Input: the cart ------------------------------------------------------

export type EngineItem = {
  productId?: number | null;
  variantId?: number | null;
  sku?: string | null;
  name?: string | null;
  quantity: number;
  grams: number; // per unit
  price: number; // per unit, subunits
  // For product conditions. vendor and sku come with Shopify's rate request; tags,
  // type and collections from our ProductSnapshot. Missing means none.
  vendor?: string | null;
  tags?: string[];
  productType?: string | null;
  collectionIds?: number[];
};

export type EngineAddress = {
  country?: string | null;
  province?: string | null;
  city?: string | null;
  postcode?: string | null;
};

export type EngineCart = {
  items: EngineItem[];
  currency: string;
  locale?: string;
  destination: EngineAddress;
};

/** The cart added up once, for conditions and pricing. */
export type CartTotals = {
  subtotal: number; // subunits: price × quantity over all items
  weight: number; // grams: grams × quantity over all items
  quantity: number; // number of items (units, not lines)
};

/** Cart fields a condition can test; each reads the CartTotals value of the same name. */
export type CartConditionField = ValueOf<typeof CART_CONDITION_FIELD>;

// ---- Input: the shop's rules ----------------------------------------------

export type EngineCondition = {
  id: string;
  subject: ConditionSubject;
  field: string;
  operator: ConditionOperator;
  value: unknown; // number, string or string[]
  quantifier?: Quantifier | null;
  postcodeEntries?: string[] | null; // resolved from the linked PostcodeList
};

/** A cart condition with the cart's actual value, e.g. subtotal 80000 ≥ 100000 → false. */
export type CheckedCartCondition = {
  subject: typeof CONDITION_SUBJECT.CART;
  field: CartConditionField;
  operator: NumberOperator;
  value: number; // what the condition asks for
  actual: number; // what the cart has
  result: boolean;
};

/**
 * A product condition with how many of the cart's items matched it, e.g. "any item
 * has tag fragile" → 0 of 3 items → false. Text values are lowercased.
 */
export type CheckedProductCondition = {
  subject: typeof CONDITION_SUBJECT.PRODUCT;
  field: ProductConditionField;
  operator: TextOperator;
  quantifier: Quantifier;
  values: string[] | number[]; // one value, or the list for IN / NOT_IN
  matching: number; // items that matched
  total: number; // items in the cart
  result: boolean;
};

export type CheckedCondition = CheckedCartCondition | CheckedProductCondition;

/**
 * One condition checked against the cart: true/false with a short description
 * (e.g. "subtotal 80000 ≥ 100000"), or why the engine can't check it yet.
 */
export type ConditionResult =
  | { result: boolean; text: string; checked: CheckedCondition }
  | { unsupported: string };

/**
 * Why a rule's conditions didn't match: its match and the conditions that decided it
 * (ALL: the first false one; ANY: all of them, none true; NONE: the first true one),
 * or a condition the engine can't check yet.
 */
export type ConditionFailure =
  | { match: RuleMatch; conditions: CheckedCondition[] }
  | { unsupported: true };

/**
 * Whether a rule's conditions match a cart, and if not, why: `reason` as developer
 * text, `failure` as data for the admin.
 */
export type ConditionCheck = {
  matched: boolean;
  reason?: string;
  failure?: ConditionFailure;
};

/** One zone's price for a cart (subunits), or why it can't be priced. */
export type PriceResult =
  | { ok: true; price: number }
  | { ok: false; reason: string };

export type EngineBand = { from: number; to: number | null; price: number };

export type EngineAdjustment = {
  kind: AdjustmentKind;
  type: AdjustmentType;
  value: number;
};

export type {
  Region as EngineRegion,
  Zone as EngineZone,
} from "../zones/types";

export type EngineRate = {
  id: string;
  zoneId: string;
  preset?: string | null;
  name?: string | null;
  description?: string | null;
  minDeliveryDays?: number | null;
  maxDeliveryDays?: number | null;
  mode: RateMode;
  basis?: RateBasis | null;
  price?: number | null;
  stepSize?: number | null;
  stepPrice?: number | null;
  percentBps?: number | null;
  bands: EngineBand[];
  adjustments: EngineAdjustment[];
};

export type EngineRule = {
  id: string;
  name: string;
  status: RuleStatus;
  priority: number;
  match: RuleMatch;
  exclusive: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  conditions: EngineCondition[];
  rates: EngineRate[];
};

export type EngineSettings = {
  combineStrategy: CombineStrategy;
};

// ---- Output ---------------------------------------------------------------

export type QuotedRate = {
  rateId: string;
  ruleId: string;
  zoneId: string;
  preset?: string | null;
  name?: string | null;
  description?: string | null;
  minDeliveryDays?: number | null;
  maxDeliveryDays?: number | null;
  price: number; // subunits
};

export type TraceOutcome = ValueOf<typeof TRACE_OUTCOME>;

/** Why a rule gave this cart no rate (see TRACE_REASON). */
export type TraceReason =
  | { kind: typeof TRACE_REASON.INACTIVE }
  | { kind: typeof TRACE_REASON.OUT_OF_SCHEDULE }
  | { kind: typeof TRACE_REASON.AFTER_EXCLUSIVE; ruleName: string }
  | { kind: typeof TRACE_REASON.CONDITIONS; failure: ConditionFailure }
  | { kind: typeof TRACE_REASON.NO_ZONE } // the address is in none of the shop's zones
  | { kind: typeof TRACE_REASON.NOT_IN_ZONE; zoneName: string } // not offered in the address's zone
  | { kind: typeof TRACE_REASON.NOT_PRICED }; // the zone's price couldn't be worked out

export type TraceEntry = {
  ruleId: string;
  ruleName: string;
  outcome: TraceOutcome;
  detail?: string; // developer text
  reason?: TraceReason; // set when the rule gave no rate
};

export type EngineResult = {
  rates: QuotedRate[];
  trace: TraceEntry[];
};
