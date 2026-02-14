/**
 * BlurRenderer - Manages the visual rendering of the blur effect
 *
 * Creates and manages the DOM structure for the blur reveal effect:
 * - Wraps the input in a container
 * - Creates two overlays: one always blurred, one clear with reveal mask
 * - Manages CSS variables for reveal position
 */

import {
  CSS_CLASSES,
  CSS_VARS,
  type BlurRevealConfig,
} from './config';
import { injectStyles, removeStyles } from './styles';
import { isPasswordInput } from './utils';

/**
 * BlurRenderer handles the visual aspects of the blur reveal effect
 */
export class BlurRenderer {
  private _input: HTMLInputElement;
  private _container: HTMLDivElement | null = null;
  private _blurredOverlay: HTMLDivElement | null = null;
  private _clearOverlay: HTMLDivElement | null = null;
  private _config: BlurRevealConfig;
  private _destroyed = false;
  private _fadeRafId: number | null = null;

  // Event handlers
  private _handleInput = this._onInput.bind(this);

  constructor(input: HTMLInputElement, config: BlurRevealConfig) {
    // Validate input
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('BlurRenderer requires an HTMLInputElement');
    }

    if (!isPasswordInput(input)) {
      throw new Error('BlurRenderer requires a password input');
    }

    this._input = input;
    this._config = { ...config };

    // Inject styles
    injectStyles();

    // Build DOM structure
    this._buildDOM();

    // Attach input listener
    this._input.addEventListener('input', this._handleInput);

    // Initial text sync
    this.updateText(this._input.value);
  }

  /**
   * Build the DOM structure for blur reveal
   */
  private _buildDOM(): void {
    // Create container
    this._container = document.createElement('div');
    this._container.className = CSS_CLASSES.CONTAINER;

    // Create blurred overlay (always shows blurred text)
    this._blurredOverlay = document.createElement('div');
    this._blurredOverlay.className = `${CSS_CLASSES.OVERLAY} ${CSS_CLASSES.OVERLAY}--blurred`;
    this._blurredOverlay.setAttribute('aria-hidden', 'true');

    // Create clear overlay (shows clear text through mask at cursor)
    this._clearOverlay = document.createElement('div');
    this._clearOverlay.className = `${CSS_CLASSES.OVERLAY} ${CSS_CLASSES.OVERLAY}--clear`;
    this._clearOverlay.setAttribute('aria-hidden', 'true');

    // Set CSS variables
    this._applyCSSVariables();

    // Add input class
    this._input.classList.add(CSS_CLASSES.INPUT);

    // Build structure: wrap input in container
    this._input.parentNode?.insertBefore(this._container, this._input);
    this._container.appendChild(this._input);
    this._container.appendChild(this._blurredOverlay);
    this._container.appendChild(this._clearOverlay);

    // Copy input padding to overlays so text aligns
    this._syncOverlayPadding();
  }

  /**
   * Copy computed styles from input to overlays for proper alignment
   */
  private _syncOverlayPadding(): void {
    if (!this._blurredOverlay || !this._clearOverlay) return;

    const computed = window.getComputedStyle(this._input);
    const padding = computed.padding;
    const borderWidth = computed.borderWidth;
    const fontSize = computed.fontSize;
    const lineHeight = computed.lineHeight;

    // Sync font size and line height so overlay text matches input text metrics
    this._blurredOverlay.style.fontSize = fontSize;
    this._blurredOverlay.style.lineHeight = lineHeight;
    this._clearOverlay.style.fontSize = fontSize;
    this._clearOverlay.style.lineHeight = lineHeight;

    // Account for input border in overlay positioning
    this._blurredOverlay.style.padding = padding;
    this._clearOverlay.style.padding = padding;
    this._blurredOverlay.style.top = borderWidth;
    this._blurredOverlay.style.left = borderWidth;
    this._blurredOverlay.style.right = borderWidth;
    this._blurredOverlay.style.bottom = borderWidth;
    this._clearOverlay.style.top = borderWidth;
    this._clearOverlay.style.left = borderWidth;
    this._clearOverlay.style.right = borderWidth;
    this._clearOverlay.style.bottom = borderWidth;
  }

  /**
   * Apply CSS variables to container
   */
  private _applyCSSVariables(): void {
    if (!this._container) return;

    this._container.style.setProperty(
      CSS_VARS.BLUR_INTENSITY,
      `${this._config.blurIntensity}px`
    );
    this._container.style.setProperty(
      CSS_VARS.REVEAL_RADIUS,
      `${this._config.revealRadius}px`
    );
    this._container.style.setProperty(
      CSS_VARS.FADE_DURATION,
      `${this._config.fadeDuration}ms`
    );
    this._container.style.setProperty(CSS_VARS.REVEAL_X, '-9999px');
    this._container.style.setProperty(CSS_VARS.REVEAL_Y, '-9999px');
  }

  /**
   * Update only the CSS variables that changed (without resetting reveal position)
   */
  private _updateCSSVariables(partial: Partial<BlurRevealConfig>): void {
    if (!this._container) return;

    if (partial.blurIntensity !== undefined) {
      this._container.style.setProperty(
        CSS_VARS.BLUR_INTENSITY,
        `${this._config.blurIntensity}px`
      );
    }
    if (partial.revealRadius !== undefined) {
      this._container.style.setProperty(
        CSS_VARS.REVEAL_RADIUS,
        `${this._config.revealRadius}px`
      );
    }
    if (partial.fadeDuration !== undefined) {
      this._container.style.setProperty(
        CSS_VARS.FADE_DURATION,
        `${this._config.fadeDuration}ms`
      );
    }
  }

  /**
   * Handle input events to sync overlay
   */
  private _onInput(): void {
    this.updateText(this._input.value);
  }

  /**
   * Update the overlay text content
   */
  updateText(value: string): void {
    if (this._destroyed) return;

    // Display actual password text (not bullets) - CSS handles the blur
    if (this._blurredOverlay) {
      this._blurredOverlay.textContent = value;
    }
    if (this._clearOverlay) {
      this._clearOverlay.textContent = value;
    }
  }

  /**
   * Set the reveal position (spotlight center) - for desktop hover
   */
  setRevealPosition(x: number, y: number): void {
    if (!this._container || this._destroyed) return;

    this._container.style.setProperty(CSS_VARS.REVEAL_X, `${x}px`);
    this._container.style.setProperty(CSS_VARS.REVEAL_Y, `${y}px`);
    this._container.classList.add(CSS_CLASSES.ACTIVE);
  }

  /**
   * Set the reveal range (horizontal band) - for mobile touch
   */
  setRevealRange(minX: number, maxX: number): void {
    if (!this._container || this._destroyed) return;

    this._container.style.setProperty(CSS_VARS.REVEAL_MIN_X, `${minX}px`);
    this._container.style.setProperty(CSS_VARS.REVEAL_MAX_X, `${maxX}px`);
    this._container.classList.remove(CSS_CLASSES.ACTIVE);
    this._container.classList.add(CSS_CLASSES.ACTIVE_RANGE);
  }

  /**
   * Clear the reveal position (hide spotlight)
   */
  clearRevealPosition(): void {
    if (!this._container || this._destroyed) return;

    // Cancel any running fade animation
    this._cancelFadeAnimation();

    // Clean up inline fade styles
    if (this._clearOverlay) {
      this._clearOverlay.style.opacity = '';
    }

    this._container.style.setProperty(CSS_VARS.REVEAL_X, '-9999px');
    this._container.style.setProperty(CSS_VARS.REVEAL_Y, '-9999px');
    this._container.style.setProperty(CSS_VARS.REVEAL_MIN_X, '0px');
    this._container.style.setProperty(CSS_VARS.REVEAL_MAX_X, '0px');
    this._container.classList.remove(CSS_CLASSES.ACTIVE);
    this._container.classList.remove(CSS_CLASSES.ACTIVE_RANGE);
    this._container.classList.remove(CSS_CLASSES.FADING);
  }

  /**
   * Start fade out animation using requestAnimationFrame.
   * Manually steps opacity from 1→0 over fadeDuration ms.
   */
  startFadeOut(): void {
    if (!this._container || !this._clearOverlay || this._destroyed) return;

    // Cancel any existing fade
    this._cancelFadeAnimation();

    this._container.classList.add(CSS_CLASSES.FADING);

    const duration = this._config.fadeDuration;
    if (duration <= 0) {
      // No animation, just hide immediately
      this._clearOverlay.style.opacity = '0';
      return;
    }

    const overlay = this._clearOverlay;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out: decelerate towards end
      const eased = 1 - Math.pow(1 - progress, 2);
      overlay.style.opacity = String(1 - eased);

      if (progress < 1 && !this._destroyed) {
        this._fadeRafId = requestAnimationFrame(animate);
      } else {
        this._fadeRafId = null;
      }
    };

    this._fadeRafId = requestAnimationFrame(animate);
  }

  /**
   * Cancel fade out (if user re-enters before fade completes)
   */
  cancelFadeOut(): void {
    if (!this._container || !this._clearOverlay || this._destroyed) return;

    this._cancelFadeAnimation();
    this._container.classList.remove(CSS_CLASSES.FADING);
    // Reset opacity so CSS class value (opacity: 1) takes effect
    this._clearOverlay.style.opacity = '';
  }

  /**
   * Cancel the rAF fade animation if running
   */
  private _cancelFadeAnimation(): void {
    if (this._fadeRafId !== null) {
      cancelAnimationFrame(this._fadeRafId);
      this._fadeRafId = null;
    }
  }

  /**
   * Set enabled/disabled state
   */
  setEnabled(enabled: boolean): void {
    if (!this._container || this._destroyed) return;

    if (enabled) {
      this._container.classList.remove(CSS_CLASSES.DISABLED);
    } else {
      this._container.classList.add(CSS_CLASSES.DISABLED);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(partial: Partial<BlurRevealConfig>): void {
    if (this._destroyed) return;

    this._config = { ...this._config, ...partial };
    this._updateCSSVariables(partial);
  }

  /**
   * Destroy the renderer and restore original DOM
   */
  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;

    // Cancel any running fade animation
    this._cancelFadeAnimation();

    // Remove input listener
    this._input.removeEventListener('input', this._handleInput);

    // Remove input class
    this._input.classList.remove(CSS_CLASSES.INPUT);

    // Restore original DOM position by replacing container with input
    if (this._container && this._container.parentNode) {
      // Replace container with input (restores input to container's position)
      this._container.parentNode.replaceChild(this._input, this._container);
    }

    // Remove styles
    removeStyles();

    // Clean up references
    this._container = null;
    this._blurredOverlay = null;
    this._clearOverlay = null;
  }

  // Getters

  /**
   * Get the input element
   */
  get input(): HTMLInputElement {
    return this._input;
  }

  /**
   * Get the container element
   */
  get container(): HTMLDivElement | null {
    return this._container;
  }

  /**
   * Get the blurred overlay element
   */
  get blurredOverlay(): HTMLDivElement | null {
    return this._blurredOverlay;
  }

  /**
   * Get the clear overlay element
   */
  get clearOverlay(): HTMLDivElement | null {
    return this._clearOverlay;
  }

  /**
   * Get the overlay element (returns blurred overlay for backward compatibility)
   * @deprecated Use blurredOverlay or clearOverlay instead
   */
  get overlay(): HTMLDivElement | null {
    return this._blurredOverlay;
  }

  /**
   * Get the current config
   */
  get config(): BlurRevealConfig {
    return { ...this._config };
  }

  /**
   * Check if renderer is destroyed
   */
  get isDestroyed(): boolean {
    return this._destroyed;
  }
}
