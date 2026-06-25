export type ListingType = 'indoor' | 'grass' | 'beach';
export type CostType = 'free' | 'paid';
export type SkillLevel = 'C' | 'B' | 'BB' | 'A' | 'AA';
export type ListingStatus = 'pending' | 'approved' | 'rejected';
export type Visibility = 'public' | 'private';
export type DayOfWeek = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';

export interface DayTime {
  day: DayOfWeek;
  start_time: string | null;
  end_time: string | null;
}

export interface Listing {
  id: string;
  type: ListingType;
  // Null means "not specified" — some real-world listings genuinely
  // don't have a known cost (e.g. a third-party rec center page that
  // just doesn't say) rather than defaulting to a guess.
  cost: CostType | null;
  lat: number;
  lng: number;
  days_times: DayTime[];
  signup_required: boolean | null;
  name: string | null;
  external_link: string | null;
  min_skill_level: SkillLevel | null;
  equipment_supplied: boolean | null;
  notes: string | null;
  visibility: Visibility;
  photo_url: string | null;
  payment_types: string | null;
  team_required: boolean | null;
  // Raw text the submitter typed into the address field, preserved as-is
  // regardless of whether it was geocoded successfully — distinct from
  // `address` below, which is the clean, reverse-geocoded mailing
  // address set at approval time and may be null or wrong if geocoding
  // failed or picked the wrong spot.
  submitted_address: string | null;
  // Optional submitter-provided Google Maps page link — preferred over
  // the constructed maps-search link when present (see buildMapsHref).
  google_maps_url: string | null;
  status: ListingStatus;
  decayed: boolean;
  last_upvote_at: string | null;
  submitted_by: string | null;
  created_at: string;
  updated_at: string;

  // pSEO fields — populated by reverse geocoding (see src/lib/geocode.ts),
  // not submitted directly by the user.
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  last_verified_date: string | null;
  slug: string | null;

  // Only present on the admin dashboard's listing fetch (computed from
  // the votes table on read, not a stored column).
  upvotes?: number;
  downvotes?: number;
}

export type NewListing = Omit<
  Listing,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'decayed'
  | 'last_upvote_at'
  | 'status'
  | 'city'
  | 'neighborhood'
  | 'address'
  | 'last_verified_date'
  | 'slug'
> & {
  status?: ListingStatus;
};
