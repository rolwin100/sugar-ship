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

export type RateOutcome = "rates" | "fallback" | "none" | "error";

export type ShippingRate = {
  service_name: string;
  service_code: string;
  description: string;
  total_price: string;
  currency: string;
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
