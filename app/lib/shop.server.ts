import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import db from "../db.server";
import type { InstallDetails } from "./types";

/** Reads the shop's base currency (e.g. "INR") from Shopify. */
export async function fetchShopCurrency(
  admin: AdminApiContext,
): Promise<string | undefined> {
  const response = await admin.graphql(
    `#graphql
    query SugarShipShopCurrency {
      shop {
        currencyCode
      }
    }`,
  );
  const json = await response.json();
  return json.data?.shop?.currencyCode ?? undefined;
}

/**
 * Called after install / re-auth. Creates the shop row (and its settings) on first
 * install; on reinstall it clears uninstalledAt and starts a new installedAt.
 */
export async function upsertShopOnInstall(
  domain: string,
  { carrierServiceId, currency }: InstallDetails = {},
) {
  const existing = await db.shop.findUnique({ where: { domain } });

  if (!existing) {
    return db.shop.create({
      data: { domain, carrierServiceId, currency, settings: { create: {} } },
    });
  }

  return db.shop.update({
    where: { domain },
    data: {
      ...(carrierServiceId ? { carrierServiceId } : {}),
      ...(currency ? { currency } : {}),
      ...(existing.uninstalledAt
        ? { uninstalledAt: null, installedAt: new Date() }
        : {}),
      // Shops created before ShopSettings existed get a settings row here.
      settings: { upsert: { create: {}, update: {} } },
    },
  });
}

/**
 * Called from the app/uninstalled webhook. Keeps the row so a quick reinstall
 * restores everything; the shop/redact privacy webhook deletes it later.
 * Safe to run more than once (Shopify can resend webhooks).
 */
export async function markShopUninstalled(domain: string) {
  await db.shop.updateMany({
    where: { domain, uninstalledAt: null },
    data: { uninstalledAt: new Date() },
  });
}

/** Shop + settings for the rate endpoint. */
export async function getShopForRates(domain: string) {
  return db.shop.findUnique({
    where: { domain },
    include: { settings: true },
  });
}

/**
 * The Shop row for an admin page. afterAuth normally creates it; if that failed,
 * create it here so the admin still works (currency is filled in on the next auth).
 */
export async function requireShop(domain: string) {
  const shop = await db.shop.findUnique({ where: { domain } });
  return shop ?? upsertShopOnInstall(domain);
}

/** Records that the shop's products were fully copied into ProductSnapshot. */
export async function markProductsSynced(shopId: string, at: Date) {
  await db.shop.update({
    where: { id: shopId },
    data: { productsSyncedAt: at },
  });
}
