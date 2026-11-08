import type { ActionFunctionArgs } from "react-router";
import type { RateOutcome, RateRequest, ShippingRate } from "../lib/types";
import {
  fallbackRates,
  isTestCheckout,
  isValidHmac,
} from "../lib/rates/rates.server";
import { quoteCheckout } from "../lib/rates/quote-checkout.server";
import { getShopForRates } from "../lib/shop.server";
import { logRateRequest } from "../lib/rate-log/rate-log.server";
import { RATE_OUTCOME } from "../lib/constants";
import { logger } from "../lib/logger.server";
import { withLogContext } from "../lib/log-context.server";

const log = logger.child({ module: "rates" });

/**
 * Carrier Service callback. Shopify POSTs { rate: { origin, destination, items, currency, locale } }
 * at checkout and shows whatever rates we return.
 */
const handleAction = async ({ request }: ActionFunctionArgs) => {
  const startedAt = Date.now();
  const rawBody = await request.text();
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256");
  const shop = request.headers.get("x-shopify-shop-domain");

  if (!hmacHeader || !isValidHmac(rawBody, hmacHeader)) {
    log.warn({ shop }, "rates request with missing or bad HMAC");
    return Response.json({ rates: [] }, { status: 401 });
  }

  let payload: RateRequest;
  try {
    payload = JSON.parse(rawBody) as RateRequest;
  } catch {
    return Response.json({ rates: [] }, { status: 400 });
  }

  const destination = payload.rate?.destination;
  const currency = payload.rate?.currency ?? "USD";
  const locale = payload.rate?.locale;
  const testMode = isTestCheckout(destination);

  let shopRecord: Awaited<ReturnType<typeof getShopForRates>> = null;
  if (shop) {
    try {
      shopRecord = await getShopForRates(shop);
    } catch (error) {
      log.error({ err: error, shop }, "shop lookup failed");
    }
  }

  let rates: ShippingRate[] = [];
  let outcome: RateOutcome = RATE_OUTCOME.NONE;
  let errorMessage: string | undefined;

  try {
    // Test mode only for now (see isTestCheckout).
    if (testMode && shopRecord)
      rates = await quoteCheckout(shopRecord, payload);
    if (rates.length > 0) outcome = RATE_OUTCOME.RATES;
  } catch (error) {
    outcome = RATE_OUTCOME.ERROR;
    errorMessage = error instanceof Error ? error.message : String(error);
    log.error({ err: error, shop }, "quoting failed");
  }

  // Fallback when quoting failed or returned nothing. Test mode still applies.
  if (rates.length === 0 && testMode) {
    rates = fallbackRates(
      shopRecord?.settings,
      shopRecord?.currency,
      currency,
      locale,
    );
    if (rates.length > 0) outcome = RATE_OUTCOME.FALLBACK;
  }

  const durationMs = Date.now() - startedAt;
  log.info(
    { shop, outcome, testMode, rates: rates.length, ms: durationMs },
    "rates request",
  );

  // Don't make checkout wait for the log write.
  if (shopRecord) {
    logRateRequest({
      shopId: shopRecord.id,
      currency,
      locale,
      destination,
      items: payload.rate?.items,
      rates,
      outcome,
      testMode,
      durationMs,
      error: errorMessage,
    }).catch((error) => {
      log.error({ err: error, shop }, "rate log write failed");
    });
  }

  return Response.json({ rates });
};

export const action = (args: ActionFunctionArgs) =>
  withLogContext(args.request, () => handleAction(args));
