import { SiteHeader } from "../site/SiteHeader";

/**
 * Kept as a route-level adapter so the thesis always uses the same navigation component as every
 * other public page. A distinct header made the brand, navigation density, and mobile behaviour
 * drift away from the site standard.
 */
export function ThesisHeader() {
  return <SiteHeader />;
}
