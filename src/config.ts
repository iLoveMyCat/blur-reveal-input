/**
 * Configuration types and defaults for Blur Reveal Input
 */

/**
 * Configuration options for BlurRevealInput
 */
export interface BlurRevealConfig {
  /** Blur intensity in pixels (default: 4, recommended range: 1-7) */
  blurIntensity: number;

  /** Reveal radius in pixels (default: 30 desktop, 40 mobile) */
  revealRadius: number;

  /** Delay before fade-back on mobile in milliseconds (default: 500) */
  fadeDelay: number;

  /** Duration of fade animation in milliseconds (default: 300) */
  fadeDuration: number;

  /** Whether the blur reveal effect is enabled (default: true) */
  enabled: boolean;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Readonly<BlurRevealConfig> = Object.freeze({
  blurIntensity: 4,
  revealRadius: 30,
  fadeDelay: 500,
  fadeDuration: 300,
  enabled: true,
});

/**
 * Default reveal radius for mobile devices
 */
export const DEFAULT_MOBILE_REVEAL_RADIUS = 40;

/**
 * CSS custom property names
 */
export const CSS_VARS = {
  BLUR_INTENSITY: '--blur-reveal-intensity',
  REVEAL_RADIUS: '--blur-reveal-radius',
  REVEAL_X: '--blur-reveal-x',
  REVEAL_Y: '--blur-reveal-y',
  REVEAL_MIN_X: '--blur-reveal-min-x',
  REVEAL_MAX_X: '--blur-reveal-max-x',
  FADE_DURATION: '--blur-reveal-fade-duration',
  FONT: '--blur-reveal-font',
} as const;

/**
 * CSS class names used by the component
 */
export const CSS_CLASSES = {
  CONTAINER: 'blur-reveal-container',
  OVERLAY: 'blur-reveal-overlay',
  INPUT: 'blur-reveal-input',
  CURSOR: 'blur-reveal-cursor',
  ACTIVE: 'blur-reveal-active',
  ACTIVE_RANGE: 'blur-reveal-active-range',
  FADING: 'blur-reveal-fading',
  DISABLED: 'blur-reveal-disabled',
} as const;

/**
 * Data attribute names for configuration
 */
export const DATA_ATTRIBUTES = {
  BLUR_INTENSITY: 'data-blur-intensity',
  REVEAL_RADIUS: 'data-reveal-radius',
  FADE_DELAY: 'data-fade-delay',
  ENABLED: 'data-blur-reveal',
} as const;

/**
 * Merge partial config with defaults
 */
export function mergeConfig(partial?: Partial<BlurRevealConfig>): BlurRevealConfig {
  return {
    ...DEFAULT_CONFIG,
    ...partial,
  };
}

/**
 * Validate configuration values
 */
export function validateConfig(config: BlurRevealConfig): void {
  if (config.blurIntensity < 0) {
    throw new Error('blurIntensity must be non-negative');
  }
  if (config.revealRadius <= 0) {
    throw new Error('revealRadius must be positive');
  }
  if (config.fadeDelay < 0) {
    throw new Error('fadeDelay must be non-negative');
  }
  if (config.fadeDuration < 0) {
    throw new Error('fadeDuration must be non-negative');
  }
}

/**
 * Parse configuration from data attributes on an element
 */
export function parseDataAttributes(element: HTMLElement): Partial<BlurRevealConfig> {
  const config: Partial<BlurRevealConfig> = {};

  const blurIntensity = element.getAttribute(DATA_ATTRIBUTES.BLUR_INTENSITY);
  if (blurIntensity !== null) {
    const parsed = parseFloat(blurIntensity);
    if (!isNaN(parsed)) {
      config.blurIntensity = parsed;
    }
  }

  const revealRadius = element.getAttribute(DATA_ATTRIBUTES.REVEAL_RADIUS);
  if (revealRadius !== null) {
    const parsed = parseFloat(revealRadius);
    if (!isNaN(parsed)) {
      config.revealRadius = parsed;
    }
  }

  const fadeDelay = element.getAttribute(DATA_ATTRIBUTES.FADE_DELAY);
  if (fadeDelay !== null) {
    const parsed = parseFloat(fadeDelay);
    if (!isNaN(parsed)) {
      config.fadeDelay = parsed;
    }
  }

  const enabled = element.getAttribute(DATA_ATTRIBUTES.ENABLED);
  if (enabled !== null) {
    config.enabled = enabled.toLowerCase() !== 'false';
  }

  return config;
}
