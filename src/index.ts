/**
 * Blur Reveal Input - Main Entry Point
 *
 * A password input component that replaces standard masking
 * with a CSS blur effect that can be selectively revealed.
 */

// Re-export configuration
export {
  DEFAULT_CONFIG,
  DEFAULT_MOBILE_REVEAL_RADIUS,
  CSS_VARS,
  CSS_CLASSES,
  DATA_ATTRIBUTES,
  mergeConfig,
  validateConfig,
  parseDataAttributes,
  type BlurRevealConfig,
} from './config';

// Re-export events
export {
  EVENTS,
  dispatch,
  dispatchInit,
  dispatchReveal,
  dispatchHide,
  dispatchDestroy,
  isBlurRevealEvent,
  isRevealEvent,
  type BlurRevealEventDetail,
  type BlurRevealRevealEventDetail,
  type BlurRevealEventType,
} from './events';

// Re-export utilities
export {
  isTouchDevice,
  isMobileDevice,
  detectDirection,
  isBlurFilterSupported,
  isMaskImageSupported,
  isFullySupported,
  prefersReducedMotion,
  isHighContrastMode,
  clamp,
  getRelativePosition,
  generateId,
  debounce,
  throttleRAF,
  isPasswordInput,
  isInputDisabled,
  createDeferred,
  nextFrame,
  wait,
  type Deferred,
} from './utils';

// Re-export styles
export {
  injectStyles,
  removeStyles,
  forceRemoveStyles,
  areStylesInjected,
  getInstanceCount,
} from './styles';

// Re-export renderer
export { BlurRenderer } from './blur-renderer';

// Re-export adapters
export {
  DesktopAdapter,
  MobileAdapter,
  type PlatformAdapter,
  type AdapterCallbacks,
  type RevealPosition,
} from './platform-adapter';

// Re-export main class
export {
  BlurRevealInput,
  type BlurRevealInputOptions,
} from './blur-reveal-input';
