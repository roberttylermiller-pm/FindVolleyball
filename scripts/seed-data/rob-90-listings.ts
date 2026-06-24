import type { NewListing } from '../../src/types/listing';

// Robert's third batch of known meetups (ROB-90).
//
// Assumptions made while parsing the raw list (flag/fix via the admin
// edit dialog if any of these are wrong):
// - "Beach Volleyball Learn and Play Los Angeles" and "Friday Morning
//   Manhattan Beach" were given as DMS coordinates (e.g. 34°00'06.0"N
//   118°29'19.2"W) rather than addresses — converted to decimal degrees.
// - Friday Morning Manhattan Beach: cost given as "Fre" — read as a typo
//   for "Free".
// - Playa Del Rey: no Type or Cost given — Type assumed 'beach' from the
//   venue name ("...North Beach Volleyball Courts"); Cost left null
//   (unknown) rather than guessed. Address geocoded from the venue
//   address given (6603 Ocean Front Walk, Playa Del Rey, CA 90293).
export const rob90Listings: NewListing[] = [
  {
    name: 'Beach Volleyball Learn and Play Los Angeles',
    type: 'beach',
    cost: 'paid',
    lat: 34.001667,
    lng: -118.488667,
    days_times: [],
    signup_required: true,
    external_link: 'https://www.meetup.com/beach-volleyball-learn-and-play-los-angeles/',
    min_skill_level: null,
    equipment_supplied: true,
    notes: 'Check the meetup page for dates',
    visibility: 'public',
    photo_url: null,
    payment_types: null,
    team_required: null,
    submitted_by: null,
  },
  {
    name: 'Social Meetup',
    type: 'grass',
    cost: 'free',
    lat: 34.1397,
    lng: -118.0353,
    days_times: [{ day: 'thu', start_time: null, end_time: null }],
    signup_required: true,
    external_link: 'https://www.meetup.com/20s30social/',
    min_skill_level: 'C',
    equipment_supplied: null,
    notes: null,
    visibility: 'public',
    photo_url: null,
    payment_types: null,
    team_required: null,
    submitted_by: null,
  },
  {
    name: 'Friday Morning Manhattan Beach',
    type: 'beach',
    cost: 'free',
    lat: 33.879306,
    lng: -118.409083,
    days_times: [{ day: 'fri', start_time: '09:00', end_time: '12:00' }],
    signup_required: false,
    external_link: 'https://www.meetup.com/beachvolleyball-fridaymornings-manhattanbeach/',
    min_skill_level: 'B',
    equipment_supplied: null,
    notes: 'Not for beginners',
    visibility: 'public',
    photo_url: null,
    payment_types: null,
    team_required: null,
    submitted_by: null,
  },
  {
    name: 'Playa Del Rey',
    type: 'beach',
    cost: null,
    lat: 33.9599724,
    lng: -118.4519824,
    days_times: [
      { day: 'sat', start_time: null, end_time: null },
      { day: 'sun', start_time: null, end_time: null },
    ],
    signup_required: false,
    external_link: null,
    min_skill_level: null,
    equipment_supplied: null,
    notes: null,
    visibility: 'public',
    photo_url: null,
    payment_types: null,
    team_required: null,
    submitted_by: null,
  },
];
