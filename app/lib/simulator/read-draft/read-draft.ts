import type { SimulatorDraft, SimulatorLine } from "../types";

const FIELDS = [
  "country",
  "province",
  "postcode",
  "subtotal",
  "weight",
  "quantity",
] as const satisfies readonly (keyof SimulatorDraft)[];

const isId = (value: unknown) =>
  typeof value === "number" && Number.isSafeInteger(value) && value > 0;
const isAmount = (value: unknown) =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const isTextOrNull = (value: unknown) =>
  value === null || typeof value === "string";

/** One posted line, or null if it isn't a well-formed line. */
function readLine(value: unknown): SimulatorLine | null {
  if (!value || typeof value !== "object") return null;
  const l = value as Record<string, unknown>;
  return isId(l.productId) &&
    isId(l.variantId) &&
    typeof l.title === "string" &&
    isTextOrNull(l.sku) &&
    isTextOrNull(l.vendor) &&
    isAmount(l.price) &&
    isAmount(l.grams) &&
    typeof l.quantity === "string"
    ? (l as SimulatorLine)
    : null;
}

/** The posted lines (JSON in the "lines" field); malformed lines are dropped. */
function readLines(raw: unknown): SimulatorLine[] {
  if (typeof raw !== "string" || raw === "") return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.flatMap((v) => {
          const line = readLine(v);
          return line ? [line] : [];
        })
      : [];
  } catch {
    return [];
  }
}

/** The posted simulator form → a draft; anything missing or not text becomes "". */
export function readSimulatorDraft(form: {
  get: (name: string) => unknown;
}): SimulatorDraft {
  const text = (name: string) => {
    const value = form.get(name);
    return typeof value === "string" ? value : "";
  };
  return {
    ...(Object.fromEntries(FIELDS.map((field) => [field, text(field)])) as Omit<
      SimulatorDraft,
      "lines"
    >),
    lines: readLines(form.get("lines")),
  };
}
