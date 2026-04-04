// ============================================================================
// Background Registry
// Each background type is in its own file for code-splitting / lazy loading.
// Import only what you need — Three.js backgrounds are heavy.
// ============================================================================

export { RainBackground, DEFAULT_RAIN_PARAMS } from "./RainBackground"
export type { RainParams } from "./RainBackground"

export { FluidBackground, DEFAULT_FLUID_PARAMS } from "./FluidBackground"
export type { FluidParams } from "./FluidBackground"

export { AbstractBackground, DEFAULT_ABSTRACT_PARAMS } from "./AbstractBackground"
export type { AbstractParams } from "./AbstractBackground"

export { ParticleBackground } from "./ParticleBackground"
export { LaserBackground } from "./LaserBackground"
export { WaveBackground } from "./WaveBackground"
export { TunnelBackground } from "./TunnelBackground"
export { PatternBackground } from "./PatternBackground"
export { ForestBackground } from "./ForestBackground"

/** All available background types for the Lab selector */
export const BACKGROUND_TYPES = [
  "image", "fluid", "abstract", "particles", "lasers",
  "waves", "tunnel", "pattern", "rain", "forest",
] as const

export type BackgroundType = (typeof BACKGROUND_TYPES)[number]
