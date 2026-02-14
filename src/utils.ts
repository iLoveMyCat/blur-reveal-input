/**
 * Utility functions for Blur Reveal Input
 */

/**
 * Detect if the current device supports touch events
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-expect-error - msMaxTouchPoints is IE-specific
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Detect if the device is primarily touch-based (mobile/tablet)
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Use pointer media query if available (more reliable)
  if (window.matchMedia !== undefined) {
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    if (coarsePointer.matches) {
      return true;
    }
  }

  // Fallback to touch detection and screen size
  return isTouchDevice() && window.innerWidth <= 1024;
}

/**
 * Detect text direction (LTR or RTL) for an element
 */
export function detectDirection(element: HTMLElement): 'ltr' | 'rtl' {
  const computed = window.getComputedStyle(element);
  const direction = computed.direction;

  return direction === 'rtl' ? 'rtl' : 'ltr';
}

/**
 * Check if CSS blur filter is supported
 */
export function isBlurFilterSupported(): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    // Fallback: assume supported in modern browsers
    return true;
  }

  return CSS.supports('filter', 'blur(1px)');
}

/**
 * Check if CSS mask-image is supported
 */
export function isMaskImageSupported(): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    return true;
  }

  return (
    CSS.supports('mask-image', 'radial-gradient(circle, black, white)') ||
    CSS.supports('-webkit-mask-image', 'radial-gradient(circle, black, white)')
  );
}

/**
 * Check if all required CSS features are supported
 */
export function isFullySupported(): boolean {
  return isBlurFilterSupported() && isMaskImageSupported();
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || window.matchMedia === undefined) {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if Windows High Contrast Mode is active
 */
export function isHighContrastMode(): boolean {
  if (typeof window === 'undefined' || window.matchMedia === undefined) {
    return false;
  }

  // Modern detection using forced-colors
  const forcedColors = window.matchMedia('(forced-colors: active)');
  if (forcedColors.matches) {
    return true;
  }

  // Legacy IE/Edge detection
  const msHighContrast = window.matchMedia('(-ms-high-contrast: active)');
  return msHighContrast.matches;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Get element's bounding rect relative to the viewport
 */
export function getRelativePosition(
  element: HTMLElement,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  const rect = element.getBoundingClientRect();

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

/**
 * Generate a unique ID for an element
 */
let idCounter = 0;
export function generateId(prefix = 'blur-reveal'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Throttle a function using requestAnimationFrame
 */
export function throttleRAF<T extends (...args: Parameters<T>) => void>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function throttled(...args: Parameters<T>): void {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs !== null) {
          func(...lastArgs);
        }
        rafId = null;
      });
    }
  };
}

/**
 * Check if an element is a password input
 */
export function isPasswordInput(element: Element): element is HTMLInputElement {
  return (
    element instanceof HTMLInputElement &&
    element.type === 'password'
  );
}

/**
 * Check if an element is disabled or readonly
 */
export function isInputDisabled(input: HTMLInputElement): boolean {
  return input.disabled || input.readOnly;
}

/**
 * Create a deferred promise
 */
export interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Wait for next animation frame
 */
export function nextFrame(): Promise<number> {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
}

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
