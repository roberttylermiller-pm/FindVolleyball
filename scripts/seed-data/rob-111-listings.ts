import type { NewListing } from '../../src/types/listing';

// Robert's Denver-area batch (ROB-111). Coordinates were precise-pin
// links he provided — decoded via the same logic used in
// decodeGoogleMapsUrl (resolved short link, extracted !3d/!4d pair)
// rather than geocoded from the typed address, since the pin is more
// precise than a street-level geocode would be. None resolved to an
// embeddable address (each pin had no nearby named place, so Google's
// own placeholder text is a DMS coordinate string, not a usable
// address) — `address` is left for assignPseoFields to fill in via
// reverse geocoding, same as every other seed batch.
export const rob111Listings: NewListing[] = [
  {
    name: "Volleyball at Sloan's Lake",
    type: 'grass',
    cost: 'free',
    lat: 39.744156,
    lng: -105.04527,
    days_times: [{ day: 'sat', start_time: '16:00', end_time: '18:30' }],
    signup_required: null,
    external_link: 'https://www.meetup.com/sloans-lake-volleyball-and-more-20s-and-30s/events/?type=upcoming',
    min_skill_level: null,
    equipment_supplied: null,
    notes: null,
    visibility: 'public',
    photo_url: null,
    payment_types: null,
    team_required: null,
    submitted_address: '1700 N Sheridan Blvd, Denver, CO 80212',
    google_maps_url: 'https://maps.app.goo.gl/7WyKiL3MNPDxdA5a8',
    submitted_by: null,
  },
  {
    name: 'Volleyball @ Berkeley Lake Park',
    type: 'grass',
    cost: 'free',
    lat: 39.780857,
    lng: -105.0471,
    days_times: [{ day: 'wed', start_time: '17:30', end_time: '20:00' }],
    signup_required: null,
    external_link: 'https://www.meetup.com/sloans-lake-volleyball-meetup/',
    min_skill_level: null,
    equipment_supplied: null,
    notes: null,
    visibility: 'public',
    photo_url: null,
    payment_types: null,
    team_required: null,
    submitted_address: '4601 W 46th Ave, Denver, CO 80212',
    google_maps_url: 'https://maps.app.goo.gl/W9MziodN7svw4EsX9',
    submitted_by: null,
  },
  {
    name: 'Boomtown Volleyball Drop-in',
    type: 'indoor',
    cost: 'paid',
    lat: 39.70929,
    lng: -104.82171,
    days_times: [
      { day: 'sun', start_time: null, end_time: null },
      { day: 'mon', start_time: null, end_time: null },
      { day: 'thu', start_time: null, end_time: null },
      { day: 'fri', start_time: null, end_time: null },
    ],
    signup_required: null,
    external_link: 'https://www.meetup.com/coloradosports/',
    min_skill_level: null,
    equipment_supplied: null,
    notes: null,
    visibility: 'public',
    photo_url: null,
    payment_types: '$10',
    team_required: null,
    submitted_address: '14200 E Alameda Ave, Aurora, CO 80012',
    google_maps_url: 'https://maps.app.goo.gl/Lyooz3qMMMZURcDu6',
    submitted_by: null,
  },
];
