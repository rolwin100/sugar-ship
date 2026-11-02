import type {
  CartConditionField,
  NumberOperator,
  RateBasis,
  RuleMatch,
} from "../../lib/engine";
import type {
  PriceBandDraft,
  RuleConditionDraft,
  ZonePricingDraft,
  ZonePricingTextField,
} from "../../lib/rules/types";
import type { RuleError, RuleErrorKey } from "../../lib/rules/validate-rule";
import type { Zone } from "../../lib/zones/types";

export type ConditionRowProps = {
  /** Position in the list, from 0 ("Condition 1" in labels and errors). */
  index: number;
  condition: RuleConditionDraft;
  /** The shop's currency, for subtotal values. */
  currency: string;
  /** This condition's value error from the last save, if any. */
  error?: RuleError;
  onFieldChange: (field: CartConditionField) => void;
  onOperatorChange: (operator: NumberOperator) => void;
  onValueChange: (value: string) => void;
  onRemove: () => void;
};

export type ConditionsSectionProps = {
  match: RuleMatch;
  conditions: RuleConditionDraft[];
  currency: string;
  /** Condition errors from the last save; each points at a condition by index. */
  errors: RuleError[];
  onMatchChange: (match: RuleMatch) => void;
  /** Gets a function that turns the current list into the new one (see edit-conditions). */
  onConditionsChange: (
    update: (conditions: RuleConditionDraft[]) => RuleConditionDraft[],
  ) => void;
};

export type ZonePricingCardProps = {
  zone: Zone;
  pricing: ZonePricingDraft;
  currency: string;
  /** This zone's price errors from the last save. */
  errors: RuleError[];
  zoneNames: Record<string, string>;
  /** Gets a function that turns the current zone → pricing record into the new one (see edit-pricing). */
  onPricesChange: (
    update: (
      prices: Record<string, ZonePricingDraft>,
    ) => Record<string, ZonePricingDraft>,
  ) => void;
};

/** What every mode's fields get: the zone's draft, its errors and ways to change it. */
export type PricingFieldsProps = {
  pricing: ZonePricingDraft;
  currency: string;
  /** The error text for a field, found by error key (and price-table row). */
  errorFor: (keys: RuleErrorKey[], bandIndex?: number) => string | undefined;
  onFieldChange: (field: ZonePricingTextField, text: string) => void;
  onBandsChange: (
    update: (bands: PriceBandDraft[]) => PriceBandDraft[],
  ) => void;
};

export type BandRowProps = {
  /** Row number shown in labels, from 1 ("Band 2: price"). */
  number: number;
  band: PriceBandDraft;
  basis: RateBasis;
  /** Unit shown after "from": kg, items or the currency code. */
  unit: string;
  currency: string;
  toError?: string;
  priceError?: string;
  /** False for the last remaining row. */
  canRemove: boolean;
  onToChange: (text: string) => void;
  onPriceChange: (text: string) => void;
  onRemove: () => void;
};

export type BasisAmountFieldProps = {
  basis: RateBasis;
  label: string;
  /** Hide the label visually (it's still read by screen readers). */
  labelHidden?: boolean;
  value: string;
  currency: string;
  placeholder?: string;
  error?: string;
  onChange: (text: string) => void;
};
