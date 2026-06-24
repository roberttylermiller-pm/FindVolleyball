import type { DayOfWeek, Listing } from '../../types/listing';
import { capitalize } from '../text';
import { formatAddressDisplay } from '../listings/address';

const SCHEMA_DAY_NAMES: Record<DayOfWeek, string> = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
};

// SportsActivityLocation rather than plain LocalBusiness — these are
// meetups/courts, not registered businesses, and most have no fixed
// hours beyond the specific days/times players show up. Times only get
// an OpeningHoursSpecification entry when both start and end are known;
// a day with no time range isn't a valid "hours" claim to make.
export function buildListingStructuredData(listing: Listing, url: string) {
  const address = formatAddressDisplay(listing);

  const openingHoursSpecification = listing.days_times
    .filter((dt) => dt.start_time && dt.end_time)
    .map((dt) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${SCHEMA_DAY_NAMES[dt.day]}`,
      opens: dt.start_time,
      closes: dt.end_time,
    }));

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsActivityLocation',
    name: listing.name ?? `${capitalize(listing.type)} volleyball in ${listing.neighborhood ?? listing.city ?? ''}`,
    url,
    ...(address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: listing.address ?? address,
        ...(listing.city && { addressLocality: listing.city }),
      },
    }),
    geo: {
      '@type': 'GeoCoordinates',
      latitude: listing.lat,
      longitude: listing.lng,
    },
    ...(openingHoursSpecification.length > 0 && { openingHoursSpecification }),
    ...(listing.cost && { isAccessibleForFree: listing.cost === 'free' }),
  };
}
