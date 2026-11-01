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
  QUANTIFIER,
  RATE_BASIS,
  RATE_MODE,
  RULE_MATCH,
  RULE_STATUS,
  TRACE_OUTCOME,
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

/**
 * One condition checked against the cart: true/false with a short description
 * (e.g. "subtotal 80000 ≥ 100000"), or why the engine can't check it yet.
 */
export type ConditionResult =
  | { result: boolean; text: string }
  | { unsupported: string };

/** Whether a rule's conditions match a cart, and if not, why (for the trace). */
export type ConditionCheck = { matched: boolean; reason?: string };

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

export type TraceEntry = {
  ruleId: string;
  ruleName: string;
  outcome: TraceOutcome;
  detail?: string;
};

export type EngineResult = {
  rates: QuotedRate[];
  trace: TraceEntry[];
};
