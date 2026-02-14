/**
 * Auto-apply module for CDN usage
 *
 * This module automatically applies blur reveal to all password inputs
 * when included via a script tag. Features:
 * - Auto-applies to existing password inputs on page load
 * - Watches for dynamically added inputs via MutationObserver
 * - Supports opt-out via data-blur-reveal="false"
 * - Supports configuration via data attributes
 */

import { BlurRevealInput } from './blur-reveal-input';
import { CSS_CLASSES } from './config';

// Re-export main class and types for UMD bundle
export * from './index';

// Track instances for cleanup
const instances = new Map<HTMLInputElement, BlurRevealInput>();

// MutationObserver for dynamic inputs
let observer: MutationObserver | null = null;

/**
 * Check if an input is already enhanced
 */
function isEnhanced(input: HTMLInputElement): boolean {
  return (
    input.parentElement?.classList.contains(CSS_CLASSES.CONTAINER) ||
    instances.has(input)
  );
}

/**
 * Check if an input should be skipped
 */
function shouldSkip(input: HTMLInputElement): boolean {
  return (
    input.getAttribute('data-blur-reveal') === 'false' ||
    input.type !== 'password' ||
    isEnhanced(input)
  );
}

/**
 * Apply blur reveal to a single input
 */
function applyToInput(input: HTMLInputElement): void {
  if (shouldSkip(input)) return;

  try {
    const instance = new BlurRevealInput(input);
    instances.set(input, instance);
  } catch (err) {
    console.warn('BlurRevealInput: Failed to initialize', input, err);
  }
}

/**
 * Apply blur reveal to all password inputs in a container
 */
function applyToContainer(container: Element | Document): void {
  const inputs = container.querySelectorAll<HTMLInputElement>(
    'input[type="password"]:not([data-blur-reveal="false"])'
  );

  inputs.forEach(applyToInput);
}

/**
 * Initialize blur reveal on all existing password inputs
 */
export function initAutoApply(): void {
  applyToContainer(document);
}

/**
 * Start observing DOM for dynamically added inputs
 */
export function observeDOM(): void {
  if (observer) return;

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Check added nodes
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLElement) {
          // Check if the node itself is a password input
          if (node instanceof HTMLInputElement && node.type === 'password') {
            applyToInput(node);
          }

          // Check children for password inputs
          applyToContainer(node);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Stop observing DOM
 */
export function stopObserving(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

/**
 * Cleanup all instances and stop observing
 */
export function cleanup(): void {
  stopObserving();

  for (const instance of instances.values()) {
    instance.destroy();
  }

  instances.clear();
}

/**
 * Get all active instances
 */
export function getInstances(): BlurRevealInput[] {
  return Array.from(instances.values());
}

/**
 * Get instance for a specific input
 */
export function getInstance(input: HTMLInputElement): BlurRevealInput | undefined {
  return instances.get(input);
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initAutoApply();
      observeDOM();
    });
  } else {
    initAutoApply();
    observeDOM();
  }
}
