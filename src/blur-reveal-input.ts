/**
 * BlurRevealInput - Main class for the blur reveal password input
 *
 * Orchestrates the BlurRenderer and platform adapters to provide
 * a complete blur reveal experience for password inputs.
 */

import { BlurRenderer } from './blur-renderer';
import {
  DesktopAdapter,
  MobileAdapter,
  type PlatformAdapter,
  type AdapterCallbacks,
} from './platform-adapter';
import {
  type BlurRevealConfig,
  mergeConfig,
  validateConfig,
  parseDataAttributes,
  DEFAULT_MOBILE_REVEAL_RADIUS,
} from './config';
import {
  dispatchInit,
  dispatchReveal,
  dispatchHide,
  dispatchDestroy,
} from './events';
import {
  isPasswordInput,
  isInputDisabled,
  isMobileDevice,
  isTouchDevice,
} from './utils';

/**
 * Options for BlurRevealInput constructor
 */
export interface BlurRevealInputOptions extends Partial<BlurRevealConfig> {
  /**
   * Skip validation of config values
   */
  skipValidation?: boolean;
}

/**
 * BlurRevealInput - Main public API
 */
export class BlurRevealInput {
  private _input: HTMLInputElement;
  private _config: BlurRevealConfig;
  private _renderer: BlurRenderer | null = null;
  private _desktopAdapter: PlatformAdapter | null = null;
  private _mobileAdapter: PlatformAdapter | null = null;
  private _destroyed = false;

  // Observers
  private _mutationObserver: MutationObserver | null = null;

  /**
   * Create a BlurRevealInput instance
   *
   * @param input - The password input element to enhance
   * @param options - Configuration options
   */
  constructor(input: HTMLInputElement, options: BlurRevealInputOptions = {}) {
    // Validate input
    if (!isPasswordInput(input)) {
      throw new Error('BlurRevealInput requires a password input element');
    }

    this._input = input;

    // Parse data attributes
    const dataAttrConfig = parseDataAttributes(input);

    // Merge configs: defaults < data attributes < options
    this._config = mergeConfig({
      ...dataAttrConfig,
      ...options,
    });

    // Adjust reveal radius for mobile
    if (isMobileDevice() && !options.revealRadius && !dataAttrConfig.revealRadius) {
      this._config.revealRadius = DEFAULT_MOBILE_REVEAL_RADIUS;
    }

    // Validate config
    if (!options.skipValidation) {
      validateConfig(this._config);
    }

    // Initialize
    this._init();
  }

  /**
   * Initialize the blur reveal effect
   */
  private _init(): void {
    if (!this._config.enabled) return;

    // Create renderer
    this._renderer = new BlurRenderer(this._input, this._config);

    // Create adapter based on platform
    this._createAdapter();

    // Watch for disabled state changes
    this._setupMutationObserver();

    // Handle initial disabled state
    this._updateDisabledState();

    // Dispatch init event
    dispatchInit(this._input, this._config);
  }

  /**
   * Create the appropriate platform adapters
   */
  private _createAdapter(): void {
    if (!this._renderer) return;

    const callbacks: AdapterCallbacks = {
      onRevealStart: (pos) => {
        dispatchReveal(
          this._input,
          this._config,
          pos.x,
          pos.y,
          this._config.revealRadius
        );
      },
      onRevealMove: (pos) => {
        dispatchReveal(
          this._input,
          this._config,
          pos.x,
          pos.y,
          this._config.revealRadius
        );
      },
      onRevealEnd: () => {
        dispatchHide(this._input, this._config);
      },
    };

    // Desktop: mouse events, Mobile: touch events
    // Both can be active simultaneously for hybrid devices

    // Create both adapters - they handle different event types
    // Desktop: mouse events, Mobile: touch events
    // Both can be active simultaneously for hybrid devices
    this._desktopAdapter = new DesktopAdapter(this._renderer, callbacks, {
      fadeDelay: this._config.fadeDelay,
      fadeDuration: this._config.fadeDuration,
    });

    // Create mobile adapter for touch support
    if (isTouchDevice() || isMobileDevice()) {
      this._mobileAdapter = new MobileAdapter(this._renderer, callbacks, {
        fadeDelay: this._config.fadeDelay,
        fadeDuration: this._config.fadeDuration,
      });
    }
  }

  /**
   * Setup mutation observer for disabled state
   */
  private _setupMutationObserver(): void {
    this._mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'disabled' ||
            mutation.attributeName === 'readonly')
        ) {
          this._updateDisabledState();
        }
      }
    });

    this._mutationObserver.observe(this._input, {
      attributes: true,
      attributeFilter: ['disabled', 'readonly'],
    });
  }

  /**
   * Update enabled state based on input disabled/readonly
   */
  private _updateDisabledState(): void {
    const isDisabled = isInputDisabled(this._input);

    this._renderer?.setEnabled(!isDisabled);
    this._desktopAdapter?.setEnabled(!isDisabled);
    this._mobileAdapter?.setEnabled(!isDisabled);
  }

  /**
   * Update configuration
   */
  updateConfig(options: Partial<BlurRevealConfig>): void {
    if (this._destroyed) return;

    this._config = { ...this._config, ...options };
    this._renderer?.updateConfig(options);

    // Propagate fade settings to adapters
    if (options.fadeDelay !== undefined || options.fadeDuration !== undefined) {
      const fadeConfig: { fadeDelay?: number; fadeDuration?: number } = {};
      if (options.fadeDelay !== undefined) fadeConfig.fadeDelay = options.fadeDelay;
      if (options.fadeDuration !== undefined) fadeConfig.fadeDuration = options.fadeDuration;

      this._desktopAdapter?.updateConfig(fadeConfig);
      this._mobileAdapter?.updateConfig(fadeConfig);
    }
  }

  /**
   * Enable the blur reveal effect
   */
  enable(): void {
    if (this._destroyed) return;

    this._config.enabled = true;

    if (!this._renderer) {
      this._init();
    } else {
      this._renderer.setEnabled(true);
      this._desktopAdapter?.setEnabled(true);
      this._mobileAdapter?.setEnabled(true);
    }
  }

  /**
   * Disable the blur reveal effect
   */
  disable(): void {
    if (this._destroyed) return;

    this._config.enabled = false;
    this._renderer?.setEnabled(false);
    this._desktopAdapter?.setEnabled(false);
    this._mobileAdapter?.setEnabled(false);
  }

  /**
   * Destroy the instance and clean up
   */
  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;

    // Dispatch destroy event before cleanup
    dispatchDestroy(this._input, this._config);

    // Stop observing
    this._mutationObserver?.disconnect();
    this._mutationObserver = null;

    // Destroy adapters
    this._desktopAdapter?.destroy();
    this._desktopAdapter = null;
    this._mobileAdapter?.destroy();
    this._mobileAdapter = null;

    // Destroy renderer
    this._renderer?.destroy();
    this._renderer = null;
  }

  // Getters

  /**
   * Get the input element
   */
  get input(): HTMLInputElement {
    return this._input;
  }

  /**
   * Get the current config
   */
  get config(): BlurRevealConfig {
    return { ...this._config };
  }

  /**
   * Check if the instance is destroyed
   */
  get isDestroyed(): boolean {
    return this._destroyed;
  }

  /**
   * Check if the effect is enabled
   */
  get isEnabled(): boolean {
    return this._config.enabled && !this._destroyed;
  }

  // Static methods

  /**
   * Create a BlurRevealInput for an element
   * Convenience factory method
   */
  static create(
    input: HTMLInputElement,
    options?: BlurRevealInputOptions
  ): BlurRevealInput {
    return new BlurRevealInput(input, options);
  }

  /**
   * Create BlurRevealInput instances for all password inputs in a container
   */
  static applyToAll(
    container: HTMLElement = document.body,
    options?: BlurRevealInputOptions
  ): BlurRevealInput[] {
    const inputs = container.querySelectorAll<HTMLInputElement>(
      'input[type="password"]'
    );

    return Array.from(inputs).map((input) => new BlurRevealInput(input, options));
  }
}
