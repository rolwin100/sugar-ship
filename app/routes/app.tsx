import { useMemo } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { I18nextProvider, useTranslation } from "react-i18next";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";
import { ensureCarrierService } from "../lib/carrier-service.server";
import { createI18n, getLocale } from "../lib/i18n";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // Dev only: the tunnel URL changes on every `shopify app dev` run, so re-point the
  // carrier service on each admin load. In production afterAuth handles it.
  if (process.env.NODE_ENV !== "production") {
    try {
      await ensureCarrierService(admin);
    } catch (error) {
      console.error("[sugar-ship] ensureCarrierService failed", error);
    }
  }

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "", locale: getLocale(request) };
};

// Shopify only sends ?locale= on the first load. In-app links and form saves drop it,
// so don't re-run this loader on navigation — keep the language from the first load.
// Child routes still authenticate in their own loaders.
export const shouldRevalidate = () => false;

export default function App() {
  const { apiKey, locale } = useLoaderData<typeof loader>();
  const i18n = useMemo(() => createI18n(locale), [locale]);

  return (
    <AppProvider apiKey={apiKey}>
      <I18nextProvider i18n={i18n}>
        <AppNav />
        <Outlet />
      </I18nextProvider>
    </AppProvider>
  );
}

function AppNav() {
  const { t } = useTranslation();
  return (
    <s-app-nav>
      <s-link href="/app">{t("nav.home")}</s-link>
      <s-link href="/app/zones">{t("nav.zones")}</s-link>
    </s-app-nav>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
