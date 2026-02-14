/**
 * CSS-in-JS style injection for Blur Reveal Input
 * All styles are injected via a <style> element for CSP compatibility
 */

import { CSS_CLASSES, CSS_VARS } from './config';

/**
 * Style injection state
 */
let styleElement: HTMLStyleElement | null = null;
let instanceCount = 0;

/**
 * Core CSS styles for blur reveal input
 */
const BLUR_REVEAL_STYLES = `
/* Container wraps the original input */
.${CSS_CLASSES.CONTAINER} {
  position: relative;
  display: inline-block;
  width: 100%;
  /* Disable text selection to prevent mobile magnifier on overlays */
  -webkit-user-select: none;
  user-select: none;
  /* Disable touch callout (long-press menu) on iOS */
  -webkit-touch-callout: none;
}

/* Base overlay styles for password text */
.${CSS_CLASSES.OVERLAY} {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  font-family: var(${CSS_VARS.FONT}, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace);
  font-size: inherit;
  line-height: inherit;
  letter-spacing: 0.1em;
  white-space: nowrap;
}

/* Blurred overlay - always shows blurred text */
.${CSS_CLASSES.OVERLAY}--blurred {
  filter: blur(var(${CSS_VARS.BLUR_INTENSITY}, 4px));
}

/* Clear overlay - hidden by default, uses mask to show spotlight */
.${CSS_CLASSES.OVERLAY}--clear {
  opacity: 0;
  -webkit-mask-image: radial-gradient(
    circle var(${CSS_VARS.REVEAL_RADIUS}, 30px) at var(${CSS_VARS.REVEAL_X}, -9999px) var(${CSS_VARS.REVEAL_Y}, -9999px),
    black 0%,
    black 70%,
    transparent 100%
  );
  mask-image: radial-gradient(
    circle var(${CSS_VARS.REVEAL_RADIUS}, 30px) at var(${CSS_VARS.REVEAL_X}, -9999px) var(${CSS_VARS.REVEAL_Y}, -9999px),
    black 0%,
    black 70%,
    transparent 100%
  );
}

/* When active, show the clear overlay instantly (no transition on reveal) */
.${CSS_CLASSES.CONTAINER}.${CSS_CLASSES.ACTIVE} .${CSS_CLASSES.OVERLAY}--clear {
  opacity: 1;
  transition: none;
}

/* When active-range, show clear overlay with horizontal range mask */
.${CSS_CLASSES.CONTAINER}.${CSS_CLASSES.ACTIVE_RANGE} .${CSS_CLASSES.OVERLAY}--clear {
  opacity: 1;
  transition: none;
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    transparent var(${CSS_VARS.REVEAL_MIN_X}, 0px),
    black var(${CSS_VARS.REVEAL_MIN_X}, 0px),
    black var(${CSS_VARS.REVEAL_MAX_X}, 0px),
    transparent var(${CSS_VARS.REVEAL_MAX_X}, 0px),
    transparent 100%
  );
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    transparent var(${CSS_VARS.REVEAL_MIN_X}, 0px),
    black var(${CSS_VARS.REVEAL_MIN_X}, 0px),
    black var(${CSS_VARS.REVEAL_MAX_X}, 0px),
    transparent var(${CSS_VARS.REVEAL_MAX_X}, 0px),
    transparent 100%
  );
}

/* Original input - hide text but keep caret */
.${CSS_CLASSES.INPUT} {
  color: transparent !important;
  caret-color: #333;
  background: transparent;
  /* Match overlay font and spacing so caret/selection aligns with blurred text */
  font-family: var(${CSS_VARS.FONT}, ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace);
  letter-spacing: 0.1em;
  /* Use text type rendering to match overlay character widths */
  -webkit-text-security: none;
  /* Re-enable text selection for the input itself */
  -webkit-user-select: text;
  user-select: text;
}

/* Show selection highlight but keep text invisible to hide dots */
.${CSS_CLASSES.INPUT}::selection {
  background: rgba(0, 102, 204, 0.3);
  color: transparent;
}

.${CSS_CLASSES.INPUT}::-moz-selection {
  background: rgba(0, 102, 204, 0.3);
  color: transparent;
}

/* Reset placeholder to normal letter-spacing */
.${CSS_CLASSES.INPUT}::placeholder {
  letter-spacing: normal;
  color: #999;
}

/* Visual cursor for keyboard navigation */
.${CSS_CLASSES.CURSOR} {
  position: absolute;
  width: 2px;
  height: 1.2em;
  background: currentColor;
  opacity: 0.7;
  pointer-events: none;
  animation: blur-reveal-cursor-blink 1s step-end infinite;
}

@keyframes blur-reveal-cursor-blink {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 0; }
}

/* Disabled state */
.${CSS_CLASSES.CONTAINER}.${CSS_CLASSES.DISABLED} .${CSS_CLASSES.OVERLAY} {
  opacity: 0.5;
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  .${CSS_CLASSES.OVERLAY} {
    transition: none !important;
  }

  .${CSS_CLASSES.CURSOR} {
    animation: none;
    opacity: 0.7;
  }
}

/* High contrast mode adjustments */
@media (forced-colors: active) {
  .${CSS_CLASSES.OVERLAY} {
    filter: none !important;
    -webkit-mask-image: none !important;
    mask-image: none !important;
  }

  .${CSS_CLASSES.INPUT} {
    color: inherit !important;
  }
}

/* RTL support */
[dir="rtl"] .${CSS_CLASSES.OVERLAY},
.${CSS_CLASSES.CONTAINER}[dir="rtl"] .${CSS_CLASSES.OVERLAY} {
  direction: rtl;
  text-align: right;
}
`;

/**
 * Inject styles into the document head
 * Uses reference counting to support multiple instances
 */
export function injectStyles(): void {
  instanceCount += 1;

  if (styleElement !== null) {
    return; // Already injected
  }

  if (typeof document === 'undefined') {
    return; // Not in browser environment
  }

  styleElement = document.createElement('style');
  styleElement.setAttribute('data-blur-reveal-input', 'true');
  styleElement.textContent = BLUR_REVEAL_STYLES;
  document.head.appendChild(styleElement);
}

/**
 * Remove styles from the document head
 * Only removes when no instances are using the styles
 */
export function removeStyles(): void {
  instanceCount -= 1;

  if (instanceCount > 0) {
    return; // Still in use
  }

  if (styleElement !== null && styleElement.parentNode !== null) {
    styleElement.parentNode.removeChild(styleElement);
    styleElement = null;
  }
}

/**
 * Force remove styles regardless of instance count
 * Used for cleanup in tests or when destroying all instances
 */
export function forceRemoveStyles(): void {
  instanceCount = 0;

  if (styleElement !== null && styleElement.parentNode !== null) {
    styleElement.parentNode.removeChild(styleElement);
    styleElement = null;
  }
}

/**
 * Check if styles have been injected
 */
export function areStylesInjected(): boolean {
  return styleElement !== null;
}

/**
 * Get the current instance count
 */
export function getInstanceCount(): number {
  return instanceCount;
}

/**
 * Reset instance count (for testing)
 */
export function resetInstanceCount(): void {
  instanceCount = 0;
}
