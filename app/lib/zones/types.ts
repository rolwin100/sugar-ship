export type Region = {
  country: string; // ISO code, e.g. "IN"
  provinces: string[] | null; // null = whole country
};

export type Zone = {
  id: string;
  name: string;
  restOfWorld: boolean;
  regions: Region[];
  sortOrder?: number;
};

/** The parts of a delivery address that zone matching uses. */
export type ZoneAddress = {
  country?: string | null;
  province?: string | null;
};
