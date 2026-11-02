import { describe, expect, it } from "vitest";
import { toEngineCart, toShippingRates } from "./checkout";
import type { QuotedRate } from "../../engine";

const quoted = (overrides: Partial<QuotedRate> = {}): QuotedRate => ({
  rateId: "rate1",
  ruleId: "rule1",
  zoneId: "zone1",
  preset: "standard",
  name: null,
  description: null,
  minDeliveryDays: null,
  maxDeliveryDays: null,
  price: 8000,
  ...overrides,
});

describe("toEngineCart", () => {
  it("maps Shopify's request to the engine's cart", () => {
    const cart = toEngineCart({
      rate: {
        currency: "INR",
        locale: "fr",
        destination: {
          country: "IN",
          province: "MH",
          city: "Mumbai",
          postal_code: "400001",
        },
        items: [
          {
            quantity: 2,
            grams: 500,
            price: 25000,
            sku: "A1",
            product_id: 1,
            variant_id: 2,
          },
        ],
      },
    });
    expect(cart).toEqual({
      currency: "INR",
      locale: "fr",
      destination: {
        country: "IN",
        province: "MH",
        city: "Mumbai",
        postcode: "400001",
      },
      items: [
        {
          productId: 1,
          variantId: 2,
          sku: "A1",
          name: undefined,
          quantity: 2,
          grams: 500,
          price: 25000,
        },
      ],
    });
  });

  it("copes with missing fields", () => {
    expect(toEngineCart({})).toMatchObject({ currency: "USD", items: [] });
  });
});

describe("toShippingRates", () => {
  const now = new Date("2026-11-01T10:00:00Z");

  it("translates preset names into the checkout's language", () => {
    expect(toShippingRates([quoted()], "INR", "en", now)[0].service_name).toBe(
      "Standard",
    );
    expect(
      toShippingRates([quoted({ preset: "express" })], "EUR", "fr-FR", now)[0]
        .service_name,
    ).toBe("Express");
    expect(
      toShippingRates([quoted({ preset: "free" })], "EUR", "de", now)[0]
        .service_name,
    ).toBe("Kostenloser Versand");
  });

  it("shows custom names as typed", () => {
    const [rate] = toShippingRates(
      [quoted({ preset: null, name: "Blue Dart" })],
      "INR",
      "fr",
      now,
    );
    expect(rate.service_name).toBe("Blue Dart");
  });

  it("returns Shopify's format with prices in subunits", () => {
    expect(toShippingRates([quoted()], "INR", "en", now)[0]).toEqual({
      service_name: "Standard",
      service_code: "sugar_ship_rate1",
      description: "",
      total_price: "8000",
      currency: "INR",
    });
  });

  it("shows the description under the name", () => {
    const [rate] = toShippingRates(
      [quoted({ description: "Tracked and insured" })],
      "INR",
      "en",
      now,
    );
    expect(rate.description).toBe("Tracked and insured");
  });

  it("adds delivery dates when the rate has an estimate", () => {
    const [rate] = toShippingRates(
      [quoted({ minDeliveryDays: 3, maxDeliveryDays: 5 })],
      "INR",
      "en",
      now,
    );
    expect(rate.min_delivery_date).toBe("2026-11-04 00:00:00 +0000");
    expect(rate.max_delivery_date).toBe("2026-11-06 00:00:00 +0000");
  });
});
