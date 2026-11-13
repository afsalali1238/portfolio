import { ImmersiveReader } from "./ImmersiveReader";

/**
 * Kept as the route-level entry point so the thesis route stays stable while its experience
 * evolves from a scrubbed demo into a reading-first essay.
 */
export function ScrollyStage() {
  return <ImmersiveReader />;
}
