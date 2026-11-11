/** Follow the name until the owner explicitly supplies a different URL slug. */
export function productSlug(name: string): string {
  return name.trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
export function slugForProductName(previousName: string, previousSlug: string, nextName: string): string {
  return !previousSlug || previousSlug === productSlug(previousName) ? productSlug(nextName) : previousSlug;
}
