import { describe, expect, it } from "vitest";
import { createI18n } from "../../../lib/i18n";
import {
  arrivalText,
  cartText,
  dayText,
  destinationText,
  timeText,
} from "./historyText";

const t = createI18n("en").t;

describe("destinationText", () => {
  it("names the city, state and country", () => {
    expect(
      destinationText(
        {
          country: "IN",
          province: "KA",
          city: "Bengaluru",
          postcode: "560078",
        },
        "en",
      ),
    ).toBe("Bengaluru, Karnataka, India");
  });

  it("skips what Shopify didn't send", () => {
    expect(
      destinationText(
        { country: "FR", province: null, city: null, postcode: null },
        "fr",
      ),
    ).toBe("France");
    expect(
      destinationText(
        { country: null, province: null, city: null, postcode: null },
        "en",
      ),
    ).toBe("");
  });
});

describe("cartText", () => {
  it("shows items, subtotal and weight", () => {
    expect(
      cartText(
        {
          currency: "INR",
          totals: { quantity: 3, subtotal: 130000, weight: 500 },
        },
        t,
        "en",
      ),
    ).toBe("3 items · ₹1,300.00 · 0.5 kg");
  });
});

describe("timeText", () => {
  it("formats the time in the admin's language", () => {
    expect(timeText("2026-11-03T10:00:00.000Z", "en")).toMatch(/2026/);
  });
});

describe("arrivalText", () => {
  it("shows a delivery range, a single day, or nothing", () => {
    expect(dayText("2026-11-04", "en")).toBe("Nov 4");
    expect(arrivalText("2026-11-04", "2026-11-05", t, "en")).toBe(
      "Arrives Nov 4–Nov 5",
    );
    expect(arrivalText("2026-11-04", "2026-11-04", t, "en")).toBe(
      "Arrives Nov 4",
    );
    expect(arrivalText(null, "2026-11-05", t, "en")).toBe("Arrives Nov 5");
    expect(arrivalText(null, null, t, "en")).toBe("");
  });
});
