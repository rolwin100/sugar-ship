import type { TFunction } from "i18next";
import type { SimulatorError, SimulatorErrorKey } from "../../../lib/simulator";

const ERROR_TEXT = {
  countryRequired: "simulator.errorCountryRequired",
  subtotalInvalid: "simulator.errorSubtotalInvalid",
  weightInvalid: "simulator.errorWeightInvalid",
  quantityInvalid: "simulator.errorQuantityInvalid",
  lineQuantityInvalid: "simulator.errorLineQuantityInvalid",
} as const satisfies Record<SimulatorErrorKey, string>;

export function simulatorErrorMessage(error: SimulatorError, t: TFunction) {
  return t(ERROR_TEXT[error.key]);
}
