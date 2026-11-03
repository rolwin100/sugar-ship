import { describe, expect, it } from "vitest";
import { createI18n } from "../../../lib/i18n";
import { deliveryText } from "./deliveryText";

const t = createI18n("en").t;

describe("deliveryText", () => {
  it("shows a range, a single day count, or nothing", () => {
    expect(deliveryText(1, 2, t)).toBe("1–2 days");
    expect(deliveryText(3, 3, t)).toBe("3 days");
    expect(deliveryText(null, 1, t)).toBe("1 day");
    expect(deliveryText(null, null, t)).toBe("");
  });
});
