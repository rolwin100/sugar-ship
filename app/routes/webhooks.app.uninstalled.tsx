import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { logger } from "../lib/logger.server";
import db from "../db.server";
import { markShopUninstalled } from "../lib/shop.server";
import { withLogContext } from "../lib/log-context.server";

const handleAction = async ({ request }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  logger.info({ shop, topic, module: "webhooks" }, "webhook received");

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }

  // Keep the shop row (rules survive a quick reinstall); shop/redact deletes it later.
  await markShopUninstalled(shop);

  return new Response();
};

export const action = (args: ActionFunctionArgs) =>
  withLogContext(args.request, () => handleAction(args));
