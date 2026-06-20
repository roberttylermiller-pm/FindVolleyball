const COMBINING_DIACRITICS = /[̀-ͯ]/g;

export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface SlugParts {
  city: string;
  neighborhood: string | null;
  type: string;
  name: string | null;
  id: string;
}

// /courts/[city]-[neighborhood]-[surface]-[name-or-id]. Neighborhood is
// omitted when null (small standalone cities, e.g. West Hollywood, have
// no neighbourhood-level subdivision to report). Prefers a name-derived
// suffix (matches the human-readable SEO format we're targeting) and
// falls back to a short id fragment when there's no name — `name` is
// optional on a listing. Uniqueness against existing slugs is enforced
// by the caller (DB unique constraint + numeric-suffix retry).
export function buildListingSlug({ city, neighborhood, type, name, id }: SlugParts): string {
  const suffix = name ? slugify(name) : id.slice(0, 8);
  return [slugify(city), neighborhood ? slugify(neighborhood) : null, type, suffix].filter(Boolean).join('-');
}
