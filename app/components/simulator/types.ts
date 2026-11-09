import type { Country } from "../../lib/geo/geo";
import type {
  SimulatedRate,
  SimulationResult,
  SimulatorDraft,
  SimulatorError,
  SimulatorFallback,
  SimulatorLine,
  SkippedRate,
} from "../../lib/simulator";

export type SimulatorFormProps = {
  draft: SimulatorDraft;
  countries: Country[];
  currency: string;
  /** Field errors from the last check. */
  errors: SimulatorError[];
  busy: boolean;
  onChange: (fields: Partial<SimulatorDraft>) => void;
  onSubmit: () => void;
};

export type SimulationResultSectionProps = {
  result: SimulationResult;
  currency: string;
  fallback: SimulatorFallback;
};

export type ShownRateRowProps = { rate: SimulatedRate; currency: string };

export type NotShownRowProps = { rate: SkippedRate; currency: string };

export type SimulatorProductsProps = {
  lines: SimulatorLine[];
  currency: string;
  errors: SimulatorError[];
  onChange: (lines: SimulatorLine[]) => void;
};

export type SimulatorLineRowProps = {
  line: SimulatorLine;
  currency: string;
  error?: string;
  onQuantity: (quantity: string) => void;
  onRemove: () => void;
};
