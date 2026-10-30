/**
 * Rule engine types. The engine is pure TypeScript: no Prisma, Shopify or I/O.
 * Units: money in subunits, weight in grams, percentages in basis points.
 * The string unions mirror the Prisma enums in prisma/schema.prisma.
 */

export type ConditionSubject = "CART" | "PRODUCT" | "ADDRESS";

export type ConditionOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "GREATER_THAN"
  | "GREATER_OR_EQUAL"
  | "LESS_THAN"
  | "LESS_OR_EQUAL"
  | "CONTAINS"
  | "NOT_CONTAINS"
  | "IN"
  | "NOT_IN"
  | "IN_POSTCODE_LIST"
  | "NOT_IN_POSTCODE_LIST";

export type Quantifier = "ANY" | "ALL" | "NONE";
export type RuleStatus = "ACTIVE" | "INACTIVE";
export type RuleMatch = "ALL" | "ANY" | "NONE";
export type RateMode = "FLAT" | "BANDS" | "INCREMENTAL" | "PERCENT";
export type RateBasis = "WEIGHT" | "QUANTITY" | "SUBTOTAL";
export type AdjustmentKind =
  | "HANDLING_FEE"
  | "MIN_PRICE"
  | "MAX_PRICE"
  | "ROUND_TO"
  | "FREE_OVER";
export type AdjustmentType = "FIXED" | "PERCENT";
export type CombineStrategy = "SUM" | "HIGHEST" | "LOWEST";

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

export type TraceOutcome =
  | "matched"
  | "not_matched"
  | "skipped_inactive"
  | "skipped_schedule"
  | "skipped_after_exclusive";

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
