import { useState } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { getShopForRates, requireShop } from "../lib/shop.server";
import { getLocale } from "../lib/i18n";
import { listCountries } from "../lib/geo/geo";
import { pickLocalized } from "../lib/rates/rates.server";
import { listZones } from "../lib/zones/zone-store.server";
import { simulateQuote } from "../lib/simulator/simulate.server";
import {
  readSimulatorDraft,
  toSimulatorCart,
  type SimulatorActionResult,
  type SimulatorDraft,
  type SimulatorFallback,
} from "../lib/simulator";
import {
  SimulationResultSection,
  SimulatorForm,
} from "../components/simulator";
import { withLogContext } from "../lib/log-context.server";

/** `/app/simulator`: try an address and cart against the shop's current rates. */
const handleLoader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await requireShop(session.shop);
  const locale = getLocale(request);
  const [zones, withSettings] = await Promise.all([
    listZones(shop.id),
    getShopForRates(session.shop),
  ]);

  const settings = withSettings?.settings;
  const fallback: SimulatorFallback = settings?.fallbackEnabled
    ? {
        name:
          pickLocalized(settings.fallbackName, locale) ?? "Standard Shipping",
        price: settings.fallbackPrice,
      }
    : null;

  // Start from the first zone's country, the likeliest address to test.
  const country =
    zones.flatMap((z) => z.regions.map((r) => r.country))[0] ?? "";

  return {
    countries: listCountries(locale),
    currency: shop.currency ?? "USD",
    fallback,
    initial: {
      country,
      province: "",
      postcode: "",
      subtotal: "",
      weight: "",
      quantity: "1",
      lines: [],
    } satisfies SimulatorDraft,
  };
};

export const loader = (args: LoaderFunctionArgs) =>
  withLogContext(args.request, () => handleLoader(args));

const handleAction = async ({
  request,
}: ActionFunctionArgs): Promise<SimulatorActionResult> => {
  const { session } = await authenticate.admin(request);
  const shop = await getShopForRates(session.shop);
  if (!shop) throw new Response("Shop not found", { status: 404 });

  const parsed = toSimulatorCart(
    readSimulatorDraft(await request.formData()),
    shop.currency ?? "USD",
  );
  if (!parsed.ok) return parsed;
  return { ok: true, result: await simulateQuote(shop, parsed.cart) };
};

export const action = (args: ActionFunctionArgs) =>
  withLogContext(args.request, () => handleAction(args));

export default function SimulatorPage() {
  const { countries, currency, fallback, initial } =
    useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const fetcher = useFetcher<typeof action>();
  const [draft, setDraft] = useState<SimulatorDraft>(initial);

  const data = fetcher.data;
  const errors = data && !data.ok ? data.errors : [];

  return (
    <s-page heading={t("simulator.title")}>
      <s-link slot="breadcrumb-actions" href="/app/rates">
        {t("rates.title")}
      </s-link>

      <SimulatorForm
        draft={draft}
        countries={countries}
        currency={currency}
        errors={errors}
        busy={fetcher.state !== "idle"}
        onChange={(fields) => setDraft((d) => ({ ...d, ...fields }))}
        onSubmit={() =>
          fetcher.submit(
            { ...draft, lines: JSON.stringify(draft.lines) },
            { method: "post" },
          )
        }
      />

      {data?.ok && (
        <SimulationResultSection
          result={data.result}
          currency={currency}
          fallback={fallback}
        />
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
