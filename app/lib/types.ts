import type { RATE_OUTCOME } from "./constants";

export type CarrierServiceNode = {
  id: string;
  name: string | null;
  callbackUrl: string | null;
  active: boolean;
};

export type RateAddress = {
  country?: string | null;
  province?: string | null;
  city?: string | null;
  postal_code?: string | null;
  name?: string | null;
  address1?: string | null;
  address2?: string | null;
};

export type RateItem = {
  name?: string | null;
  sku?: string | null;
  quantity?: number | null;
  grams?: number | null;
  price?: number | null; // subunits
  product_id?: number | null;
  variant_id?: number | null;
  vendor?: string | null;
};

export type RateRequest = {
  rate?: {
    origin?: RateAddress;
    destination?: RateAddress;
    items?: RateItem[];
    currency?: string;
    locale?: string;
  };
};

export type RateOutcome = (typeof RATE_OUTCOME)[keyof typeof RATE_OUTCOME];

export type ShippingRate = {
  service_name: string;
  service_code: string;
  description: string;
  total_price: string;
  currency: string;
  // Delivery estimate, "YYYY-MM-DD HH:MM:SS +0000". Shopify shows it under the rate.
  min_delivery_date?: string;
  max_delivery_date?: string;
};

export type InstallDetails = {
  carrierServiceId?: string;
  currency?: string;
};

export type FallbackSettings = {
  fallbackEnabled: boolean;
  fallbackPrice: number;
  fallbackName: unknown; // { en, fr, de }
  fallbackDescription: unknown; // { en, fr, de } | null
};
