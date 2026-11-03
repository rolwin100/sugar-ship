import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useState } from "react";
import { useLoaderData, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useTranslation } from "react-i18next";

import { authenticate } from "../shopify.server";
import { requireShop } from "../lib/shop.server";
import { listRateLogs } from "../lib/rate-log/rate-log.server";
import {
  historyQueryString,
  readHistoryQuery,
  type HistoryItem,
} from "../lib/rate-log";
import {
  HistoryDetailModal,
  HistoryEmptyState,
  HistoryFiltersBar,
  HistoryPagination,
  HistoryTable,
} from "../components/history";

/** `/app/history`: the shop's recent checkouts and the rates we returned. */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = await requireShop(session.shop);
  const query = readHistoryQuery(new URL(request.url).searchParams);
  const page = await listRateLogs(shop.id, query.filters, query.page);
  return { query: { ...query, page: page.page }, page };
};

export default function HistoryPage() {
  const { query, page } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const filtered =
    query.filters.outcome !== undefined || query.filters.testMode !== undefined;

  return (
    <s-page heading={t("history.title")}>
      <s-section>
        <s-stack gap="base">
          <s-paragraph>
            <s-text color="subdued">{t("history.intro")}</s-text>
          </s-paragraph>
          <HistoryFiltersBar
            query={query}
            onChange={(next) =>
              navigate(`/app/history${historyQueryString(next)}`)
            }
          />
        </s-stack>
      </s-section>

      <s-section padding="none">
        {page.items.length === 0 ? (
          <HistoryEmptyState filtered={filtered} />
        ) : (
          <HistoryTable items={page.items} onSelect={setSelected} />
        )}
      </s-section>

      <HistoryPagination query={query} hasNext={page.hasNext} />
      <HistoryDetailModal item={selected} />
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
