export type CarrierServiceNode = {
  id: string;
  name: string | null;
  callbackUrl: string | null;
  active: boolean;
};

export type RateAddress = {
  name?: string | null;
  address1?: string | null;
  address2?: string | null;
};

export type RateRequest = {
  rate?: {
    destination?: RateAddress;
    currency?: string;
    locale?: string;
  };
};

export type ShippingRate = {
  service_name: string;
  service_code: string;
  description: string;
  total_price: string;
  currency: string;
};
