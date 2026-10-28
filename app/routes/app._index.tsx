import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { Trans, useTranslation } from "react-i18next";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export default function Index() {
  const { t } = useTranslation();

  return (
    <s-page heading="Sugar Ship">
      <s-section heading={t("home.rulesHeading")}>
        <s-paragraph>{t("home.rulesBody")}</s-paragraph>
      </s-section>
      <s-section slot="aside" heading={t("home.testModeHeading")}>
        <s-paragraph>
          <Trans
            i18nKey="home.testModeBody"
            components={{ strong: <s-text type="strong" /> }}
          />
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
