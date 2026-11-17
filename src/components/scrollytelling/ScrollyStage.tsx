import { ImmersiveReader } from "./ImmersiveReader";

/**
 * Stable route entry point for the restored native reading experience.
 * The optical field responds to intentional release and desktop drag without taking over scroll.
 */
export function ScrollyStage() {
  return <ImmersiveReader />;
}
