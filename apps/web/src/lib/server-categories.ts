import "server-only";
import { getCategories } from "./commerce-api";
import { fallbackCategories } from "./taxonomy";
export async function storefrontCategories() {
  try { return await getCategories(); }
  catch { return fallbackCategories; }
}
