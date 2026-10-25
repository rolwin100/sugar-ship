import { createHmac, timingSafeEqual } from "node:crypto";
import type { ActionFunctionArgs } from "react-router";

/**
 * Carrier Service callback. Shopify POSTs { rate: { origin, destination, items, currency, locale } }
 * at checkout and shows whatever rates we return.
 *
 * Phase 1, step 1: one fixed rate, only in test mode.
 */

const TEST_MODE_KEYWORD = "sugarship";
const FIXED_RATE_SUBUNITS = 5000; // 50.00 in the shop's currency

type RateAddress = {
  name?: string | null;
  address1?: string | null;
  address2?: string | null;
};

type RateRequest = {
  rate?: {
    destination?: RateAddress;
    currency?: string;
    locale?: string;
  };
};

function isValidHmac(rawBody: string, header: string | null): boolean {
  const secret = process.env.SHOPIFY_API_SECRET ?? "";
  if (!header || !secret) return false;
  const digest = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(digest);
  const b = Buffer.from(header);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Test mode: rates only show when "sugarship" appears in the checkout name or address lines.
// (Shopify may send name as null for API-created carrier services, so address lines also work.)
function isTestCheckout(destination: RateAddress | undefined): boolean {
  const fields = [destination?.name, destination?.address1, destination?.address2];
  return fields.some((value) => value?.toLowerCase().includes(TEST_MODE_KEYWORD));
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const rawBody = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
  const shop = request.headers.get("x-shopify-shop-domain");

  if (hmacHeader && !isValidHmac(rawBody, hmacHeader)) {
    console.warn(`[sugar-ship] rates: bad HMAC from ${shop ?? "unknown shop"}`);
    return Response.json({ rates: [] }, { status: 401 });
  }
  if (!hmacHeader) {
    console.warn(`[sugar-ship] rates: request without HMAC header from ${shop ?? "unknown shop"}`);
  }

  let payload: RateRequest;
  try {
    payload = JSON.parse(rawBody) as RateRequest;
  } catch {
    return Response.json({ rates: [] }, { status: 400 });
  }

  const destination = payload.rate?.destination;
  const currency = payload.rate?.currency ?? "USD";

  console.log(
    `[sugar-ship] rates: shop=${shop} name=${destination?.name ?? "null"} currency=${currency}`,
  );

  if (!isTestCheckout(destination)) {
    return Response.json({ rates: [] });
  }

  return Response.json({
    rates: [
      {
        service_name: "Standard Shipping",
        service_code: "sugar_ship_standard",
        description: "Sugar Ship test rate",
        total_price: String(FIXED_RATE_SUBUNITS),
        currency,
      },
    ],
  });
};
