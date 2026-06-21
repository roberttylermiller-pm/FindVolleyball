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
  cost: CostType;
  lat: number;
  lng: number;
  days_times: DayTime[];
  signup_required: boolean;
  name: string | null;
  external_link: string | null;
  min_skill_level: SkillLevel | null;
  equipment_supplied: boolean | null;
  notes: string | null;
  visibility: Visibility;
  photo_url: string | null;
  payment_types: string | null;
  team_required: boolean | null;
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
  last_verified_date: string | null;
  slug: string | null;
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
  | 'last_verified_date'
  | 'slug'
> & {
  status?: ListingStatus;
};
