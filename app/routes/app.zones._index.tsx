import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { requireShop } from "../lib/shop.server";
import { listZones } from "../lib/zones/zone-store.server";
import {
  AddZoneButton,
  NoRestOfWorldBanner,
  ZonesEmptyState,
  ZonesTable,
} from "../components/zones";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await requireShop(session.shop);
  return { zones: await listZones(shop.id) };
};

export default function ZonesPage() {
  const { zones } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const hasRestOfWorld = zones.some((zone) => zone.restOfWorld);

  return (
    <s-page heading={t("zones.title")}>
      <AddZoneButton />
      {zones.length > 0 && !hasRestOfWorld && <NoRestOfWorldBanner />}
      {zones.length === 0 ? <ZonesEmptyState /> : <ZonesTable zones={zones} />}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
