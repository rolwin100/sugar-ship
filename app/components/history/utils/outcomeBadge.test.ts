import { describe, expect, it } from "vitest";
import { createI18n } from "../../../lib/i18n";
import { outcomeBadge } from "./outcomeBadge";

const t = createI18n("en").t;

describe("outcomeBadge", () => {
  it("counts rates and names the other outcomes", () => {
    expect(outcomeBadge("rates", 2, t)).toEqual({
      tone: "success",
      label: "2 rates",
    });
    expect(outcomeBadge("rates", 1, t).label).toBe("1 rate");
    expect(outcomeBadge("fallback", 1, t)).toEqual({
      tone: "warning",
      label: "Fallback",
    });
    expect(outcomeBadge("none", 0, t)).toEqual({
      tone: "neutral",
      label: "No rates",
    });
    expect(outcomeBadge("error", 0, t)).toEqual({
      tone: "critical",
      label: "Error",
    });
  });
});
