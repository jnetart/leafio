/** Case-insensitive name comparison for sibling entries on disk. */
export function hasSiblingNameConflict(
  name: string,
  siblings: string[],
  excludeName?: string,
): boolean {
  const trimmed = name.trim();
  if (!trimmed) {
    return false;
  }
  if (
    excludeName &&
    trimmed.localeCompare(excludeName, undefined, { sensitivity: 'accent' }) === 0
  ) {
    return false;
  }
  return siblings.some(
    (sibling) =>
      sibling.localeCompare(trimmed, undefined, { sensitivity: 'accent' }) === 0,
  );
}
