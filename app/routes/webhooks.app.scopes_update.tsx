import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { logger } from "../lib/logger.server";
import db from "../db.server";
import { withLogContext } from "../lib/log-context.server";

const handleAction = async ({ request }: ActionFunctionArgs) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);
  logger.info({ shop, topic, module: "webhooks" }, "webhook received");

  const current = payload.current as string[];
  if (session) {
    await db.session.update({
      where: {
        id: session.id,
      },
      data: {
        scope: current.toString(),
      },
    });
  }
  return new Response();
};

export const action = (args: ActionFunctionArgs) =>
  withLogContext(args.request, () => handleAction(args));
