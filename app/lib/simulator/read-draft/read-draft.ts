import type { SimulatorDraft } from "../types";

const FIELDS = [
  "country",
  "province",
  "postcode",
  "subtotal",
  "weight",
  "quantity",
] as const satisfies readonly (keyof SimulatorDraft)[];

/** The posted simulator form → a draft; anything missing or not text becomes "". */
export function readSimulatorDraft(form: {
  get: (name: string) => unknown;
}): SimulatorDraft {
  const text = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value : "";
  };
  return Object.fromEntries(
    FIELDS.map((field) => [field, text(field)]),
  ) as SimulatorDraft;
}
