import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export default function Index() {
  return (
    <s-page heading="Sugar Ship">
      <s-section heading="Shipping rules">
        <s-paragraph>
          Custom shipping rates are on the way. Rules, rate tables and the cart
          simulator will appear here.
        </s-paragraph>
      </s-section>
      <s-section slot="aside" heading="Test mode">
        <s-paragraph>
          Add <s-text type="strong">sugarship</s-text> to the checkout address
          to see Sugar Ship test rates. Real customers won&apos;t see them.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
