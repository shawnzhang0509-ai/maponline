/** Fixed region list for map filter + admin shop assignment (must match backend string values). */
export const REGION_OPTIONS = [
  'Auckland',
  'Central Nth Island',
  'Tauranga',
  'Northland',
  'Hamilton',
  'Wellington',
  'Christchurch',
  'South Island',
] as const;

export type RegionOption = (typeof REGION_OPTIONS)[number];

export function normalizeRegionLabel(raw: string | null | undefined): string {
  return (raw || '').trim();
}
