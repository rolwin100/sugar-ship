import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { requireShop } from "../lib/shop.server";
import { listRules } from "../lib/rules/rule-store.server";
import { listZones } from "../lib/zones/zone-store.server";
import {
  AddRateButton,
  RatesEmptyState,
  RatesTable,
  TestRatesButton,
} from "../components/rates";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await requireShop(session.shop);
  const [rules, zones] = await Promise.all([
    listRules(shop.id),
    listZones(shop.id),
  ]);

  return {
    rules,
    zoneNames: Object.fromEntries(zones.map((z) => [z.id, z.name])),
    hasZones: zones.length > 0,
    currency: shop.currency ?? "USD",
  };
};

export default function RatesPage() {
  const { rules, zoneNames, hasZones, currency } =
    useLoaderData<typeof loader>();
  const { t } = useTranslation();

  return (
    <s-page heading={t("rates.title")}>
      {hasZones && <AddRateButton />}
      {rules.length > 0 && <TestRatesButton />}
      {rules.length === 0 ? (
        <RatesEmptyState hasZones={hasZones} />
      ) : (
        <RatesTable rules={rules} zoneNames={zoneNames} currency={currency} />
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
