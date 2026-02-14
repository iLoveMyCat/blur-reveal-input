/**
 * Platform Adapters - Handle input events for different platforms
 *
 * Adapters translate platform-specific events (mouse, touch, keyboard)
 * into reveal position updates for the BlurRenderer.
 */

import { BlurRenderer } from './blur-renderer';
import { getRelativePosition } from './utils';

/**
 * Position data passed to callbacks
 */
export interface RevealPosition {
  x: number;
  y: number;
}

/**
 * Callbacks for adapter events
 */
export interface AdapterCallbacks {
  onRevealStart?: (position: RevealPosition) => void;
  onRevealMove?: (position: RevealPosition) => void;
  onRevealEnd?: () => void;
}

/**
 * Base interface for all platform adapters
 */
export interface PlatformAdapter {
  setEnabled(enabled: boolean): void;
  updateConfig(config: { fadeDelay?: number; fadeDuration?: number }): void;
  destroy(): void;
}

/**
 * DesktopAdapter - Handles mouse events for desktop reveal
 *
 * Events:
 * - mouseenter: Start reveal
 * - mousemove: Update reveal position
 * - mouseleave: End reveal
 */
export class DesktopAdapter implements PlatformAdapter {
  private _renderer: BlurRenderer;
  private _callbacks: AdapterCallbacks;
  private _config: { fadeDelay: number; fadeDuration: number };
  private _enabled = true;
  private _destroyed = false;
  private _isRevealing = false;
  private _fadeTimer: ReturnType<typeof setTimeout> | null = null;

  // Track reveal range (accumulated horizontal band)
  private _minX = 0;
  private _maxX = 0;

  // Bound event handlers
  private _handleMouseEnter = this._onMouseEnter.bind(this);
  private _handleMouseMove = this._onMouseMove.bind(this);
  private _handleMouseLeave = this._onMouseLeave.bind(this);

  constructor(
    renderer: BlurRenderer,
    callbacks: AdapterCallbacks = {},
    config: { fadeDelay?: number; fadeDuration?: number } = {}
  ) {
    this._renderer = renderer;
    this._callbacks = callbacks;
    this._config = {
      fadeDelay: config.fadeDelay ?? 0, // No delay on desktop by default
      fadeDuration: config.fadeDuration ?? 300,
    };
    // Attach event listeners
    this._attachListeners();
  }

  /**
   * Attach event listeners to container
   */
  private _attachListeners(): void {
    const container = this._renderer.container;
    if (!container) return;

    container.addEventListener('mouseenter', this._handleMouseEnter);
    container.addEventListener('mousemove', this._handleMouseMove);
    container.addEventListener('mouseleave', this._handleMouseLeave);
  }

  /**
   * Remove event listeners
   */
  private _removeListeners(): void {
    const container = this._renderer.container;
    if (!container) return;

    container.removeEventListener('mouseenter', this._handleMouseEnter);
    container.removeEventListener('mousemove', this._handleMouseMove);
    container.removeEventListener('mouseleave', this._handleMouseLeave);
  }

  /**
   * Handle mouse enter
   */
  private _onMouseEnter(event: MouseEvent): void {
    if (!this._enabled || this._destroyed) return;

    // Cancel any pending fade
    this._cancelFade();
    this._renderer.cancelFadeOut();

    this._isRevealing = true;

    const position = this._getPosition(event);
    const radius = this._renderer.config.revealRadius;

    // Initialize range around entry point
    this._minX = Math.max(0, position.x - radius);
    this._maxX = position.x + radius;
    this._renderer.setRevealRange(this._minX, this._maxX);

    this._callbacks.onRevealStart?.(position);
  }

  /**
   * Handle mouse move - expand reveal range to include new position
   */
  private _onMouseMove(event: MouseEvent): void {
    if (!this._enabled || this._destroyed || !this._isRevealing) return;

    const position = this._getPosition(event);
    const radius = this._renderer.config.revealRadius;

    // Expand range to include new position
    this._minX = Math.min(this._minX, Math.max(0, position.x - radius));
    this._maxX = Math.max(this._maxX, position.x + radius);
    this._renderer.setRevealRange(this._minX, this._maxX);

    this._callbacks.onRevealMove?.(position);
  }

  /**
   * Handle mouse leave - start fade-out sequence
   */
  private _onMouseLeave(): void {
    if (!this._enabled || this._destroyed) return;

    this._isRevealing = false;

    // Start fade-out sequence: wait fadeDelay, then animate fade, then clear
    this._fadeTimer = setTimeout(() => {
      this._renderer.startFadeOut();

      this._fadeTimer = setTimeout(() => {
        this._renderer.clearRevealPosition();
        this._minX = 0;
        this._maxX = 0;
        this._callbacks.onRevealEnd?.();
        this._fadeTimer = null;
      }, this._config.fadeDuration);
    }, this._config.fadeDelay);
  }

  /**
   * Cancel pending fade timer
   */
  private _cancelFade(): void {
    if (this._fadeTimer !== null) {
      clearTimeout(this._fadeTimer);
      this._fadeTimer = null;
    }
  }

  /**
   * Get position relative to container
   */
  private _getPosition(event: MouseEvent): RevealPosition {
    const container = this._renderer.container;
    if (!container) return { x: 0, y: 0 };

    return getRelativePosition(container, event.clientX, event.clientY);
  }

  /**
   * Set enabled state
   */
  setEnabled(enabled: boolean): void {
    this._enabled = enabled;

    if (!enabled) {
      this._cancelFade();
      this._isRevealing = false;
      this._minX = 0;
      this._maxX = 0;
      this._renderer.clearRevealPosition();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: { fadeDelay?: number; fadeDuration?: number }): void {
    if (config.fadeDelay !== undefined) {
      this._config.fadeDelay = config.fadeDelay;
    }
    if (config.fadeDuration !== undefined) {
      this._config.fadeDuration = config.fadeDuration;
    }
  }

  /**
   * Destroy the adapter
   */
  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;

    this._cancelFade();
    this._removeListeners();
    this._minX = 0;
    this._maxX = 0;
    this._renderer.clearRevealPosition();
  }
}

/**
 * MobileAdapter - Handles touch events for mobile reveal
 *
 * Events:
 * - touchstart: Start reveal
 * - touchmove: Update reveal position
 * - touchend: Start fade-back timer
 *
 * Features:
 * - Fade-back delay after touch ends (configurable)
 * - Prevents scroll during touch reveal
 * - Uses first touch only (ignores multi-touch)
 */
export class MobileAdapter implements PlatformAdapter {
  private _renderer: BlurRenderer;
  private _callbacks: AdapterCallbacks;
  private _config: { fadeDelay: number; fadeDuration: number };
  private _enabled = true;
  private _destroyed = false;
  private _isRevealing = false;
  private _fadeTimer: ReturnType<typeof setTimeout> | null = null;

  // Track touch range for horizontal reveal
  private _minX = 0;
  private _maxX = 0;
  private _revealRadius: number;

  // Bound event handlers
  private _handleTouchStart = this._onTouchStart.bind(this);
  private _handleTouchMove = this._onTouchMove.bind(this);
  private _handleTouchEnd = this._onTouchEnd.bind(this);
  private _handleSelectionChange = this._onSelectionChange.bind(this);
  private _handleDocumentTouchStart = this._onDocumentTouchStart.bind(this);
  private _handleDocumentTouchEnd = this._onDocumentTouchEnd.bind(this);
  private _handleInputFocus = this._onInputFocus.bind(this);

  // Track if any touch is active on screen (for caret dragging)
  private _isTouchActive = false;

  constructor(
    renderer: BlurRenderer,
    callbacks: AdapterCallbacks = {},
    config: { fadeDelay?: number; fadeDuration?: number; revealRadius?: number } = {}
  ) {
    this._renderer = renderer;
    this._callbacks = callbacks;
    this._config = {
      fadeDelay: config.fadeDelay ?? 500,
      fadeDuration: config.fadeDuration ?? 300,
    };
    this._revealRadius = config.revealRadius ?? 40;

    // Attach event listeners
    this._attachListeners();
  }

  /**
   * Attach touch event listeners to container
   */
  private _attachListeners(): void {
    const container = this._renderer.container;
    if (!container) return;

    container.addEventListener('touchstart', this._handleTouchStart, {
      passive: false,
    });
    container.addEventListener('touchmove', this._handleTouchMove, {
      passive: false,
    });
    container.addEventListener('touchend', this._handleTouchEnd);
    container.addEventListener('touchcancel', this._handleTouchEnd);

    // Listen for selection changes (caret handle dragging)
    document.addEventListener('selectionchange', this._handleSelectionChange);
    // Track document-level touches to know when finger is lifted
    document.addEventListener('touchstart', this._handleDocumentTouchStart);
    document.addEventListener('touchend', this._handleDocumentTouchEnd);

    // Listen for input focus to reveal around caret when tapped
    const input = container.querySelector('input');
    if (input) {
      input.addEventListener('focus', this._handleInputFocus);
    }
  }

  /**
   * Remove touch event listeners
   */
  private _removeListeners(): void {
    const container = this._renderer.container;
    if (!container) return;

    container.removeEventListener('touchstart', this._handleTouchStart, {
      passive: false,
    } as EventListenerOptions);
    container.removeEventListener('touchmove', this._handleTouchMove, {
      passive: false,
    } as EventListenerOptions);
    container.removeEventListener('touchend', this._handleTouchEnd);
    container.removeEventListener('touchcancel', this._handleTouchEnd);

    document.removeEventListener('selectionchange', this._handleSelectionChange);
    document.removeEventListener('touchstart', this._handleDocumentTouchStart);
    document.removeEventListener('touchend', this._handleDocumentTouchEnd);

    const input = container.querySelector('input');
    if (input) {
      input.removeEventListener('focus', this._handleInputFocus);
    }
  }

  /**
   * Handle touch start
   */
  private _onTouchStart(event: TouchEvent): void {
    if (!this._enabled || this._destroyed) return;

    // Cancel any pending fade and restore active state
    this._cancelFade();
    if (this._isRevealing) {
      this._renderer.cancelFadeOut();
    }

    this._isRevealing = true;

    const touch = event.touches[0];
    if (!touch) return;

    const position = this._getPosition(touch);

    // Initialize range with reveal radius around touch point
    this._minX = Math.max(0, position.x - this._revealRadius);
    this._maxX = position.x + this._revealRadius;
    this._renderer.setRevealRange(this._minX, this._maxX);

    this._callbacks.onRevealStart?.(position);
  }

  /**
   * Handle touch move
   */
  private _onTouchMove(event: TouchEvent): void {
    if (!this._enabled || this._destroyed || !this._isRevealing) return;

    // Prevent scrolling while revealing
    event.preventDefault();

    const touch = event.touches[0];
    if (!touch) return;

    const position = this._getPosition(touch);

    // Expand range to include new position (with reveal radius)
    this._minX = Math.min(this._minX, Math.max(0, position.x - this._revealRadius));
    this._maxX = Math.max(this._maxX, position.x + this._revealRadius);
    this._renderer.setRevealRange(this._minX, this._maxX);

    this._callbacks.onRevealMove?.(position);
  }

  /**
   * Handle touch end - start fade-back sequence
   */
  private _onTouchEnd(): void {
    if (!this._enabled || this._destroyed || !this._isRevealing) return;

    // Wait for fadeDelay, then start CSS fade animation
    this._fadeTimer = setTimeout(() => {
      // Start the CSS fade-out transition
      this._renderer.startFadeOut();

      // After fade animation completes, clear position and fire callback
      this._fadeTimer = setTimeout(() => {
        this._isRevealing = false;
        this._renderer.clearRevealPosition();
        this._callbacks.onRevealEnd?.();
        this._fadeTimer = null;
      }, this._config.fadeDuration);
    }, this._config.fadeDelay);
  }

  /**
   * Cancel pending fade timer
   */
  private _cancelFade(): void {
    if (this._fadeTimer !== null) {
      clearTimeout(this._fadeTimer);
      this._fadeTimer = null;
    }
  }

  /**
   * Get position relative to container from touch
   */
  private _getPosition(touch: Touch): RevealPosition {
    const container = this._renderer.container;
    if (!container) return { x: 0, y: 0 };

    return getRelativePosition(container, touch.clientX, touch.clientY);
  }

  /**
   * Handle selection change (caret handle dragging on mobile)
   */
  private _onSelectionChange(): void {
    if (!this._enabled || this._destroyed) return;

    // Get the input element
    const input = this._renderer.container?.querySelector('input');
    if (!input || document.activeElement !== input) return;

    // Get caret position
    const caretPos = input.selectionStart;
    if (caretPos === null) return;

    // Calculate pixel position of caret using a temporary span
    const x = this._getCaretPixelPosition(input, caretPos);
    if (x === null) return;

    // Cancel any pending fade since user is interacting with selection
    this._cancelFade();
    if (this._isRevealing) {
      this._renderer.cancelFadeOut();
    }

    // Start or expand reveal range
    if (!this._isRevealing) {
      this._isRevealing = true;
      this._minX = Math.max(0, x - this._revealRadius);
      this._maxX = x + this._revealRadius;
      this._callbacks.onRevealStart?.({ x, y: 0 });
    } else {
      // Expand range to include new caret position
      this._minX = Math.min(this._minX, Math.max(0, x - this._revealRadius));
      this._maxX = Math.max(this._maxX, x + this._revealRadius);
    }

    this._renderer.setRevealRange(this._minX, this._maxX);

    // Start fade timer - will be cancelled if selection changes again
    // This handles the case where caret handle is released
    this._fadeTimer = setTimeout(() => {
      this._renderer.startFadeOut();
      this._fadeTimer = setTimeout(() => {
        this._isRevealing = false;
        this._renderer.clearRevealPosition();
        this._callbacks.onRevealEnd?.();
        this._fadeTimer = null;
      }, this._config.fadeDuration);
    }, this._config.fadeDelay);
  }

  /**
   * Handle input focus (reveal around caret when tapped)
   */
  private _onInputFocus(): void {
    if (!this._enabled || this._destroyed) return;

    // Only reveal on focus if touch is active (user tapped the input)
    if (!this._isTouchActive) return;

    // Get the input element
    const input = this._renderer.container?.querySelector('input');
    if (!input) return;

    // Use setTimeout to ensure caret position is set after focus
    setTimeout(() => {
      const caretPos = input.selectionStart;
      if (caretPos === null) return;

      const x = this._getCaretPixelPosition(input, caretPos);
      if (x === null) return;

      // Cancel any pending fade
      this._cancelFade();
      if (this._isRevealing) {
        this._renderer.cancelFadeOut();
      }

      // Start reveal around caret
      this._isRevealing = true;
      this._minX = Math.max(0, x - this._revealRadius);
      this._maxX = x + this._revealRadius;
      this._renderer.setRevealRange(this._minX, this._maxX);
      this._callbacks.onRevealStart?.({ x, y: 0 });
    }, 0);
  }

  /**
   * Calculate pixel X position of caret in the input
   */
  private _getCaretPixelPosition(input: HTMLInputElement, caretPos: number): number | null {
    const container = this._renderer.container;
    if (!container) return null;

    // Get computed styles
    const computed = window.getComputedStyle(input);
    const paddingLeft = parseFloat(computed.paddingLeft) || 0;
    const borderLeft = parseFloat(computed.borderLeftWidth) || 0;

    // Create a temporary span to measure text width
    const span = document.createElement('span');
    span.style.font = computed.font;
    span.style.letterSpacing = computed.letterSpacing;
    span.style.visibility = 'hidden';
    span.style.position = 'absolute';
    span.style.whiteSpace = 'pre';
    span.textContent = input.value.substring(0, caretPos);

    document.body.appendChild(span);
    const textWidth = span.offsetWidth;
    document.body.removeChild(span);

    return borderLeft + paddingLeft + textWidth;
  }

  /**
   * Handle document touchstart (track when any touch begins)
   */
  private _onDocumentTouchStart(): void {
    this._isTouchActive = true;
    // Cancel any pending fade since user is touching
    if (this._isRevealing) {
      this._cancelFade();
      this._renderer.cancelFadeOut();
    }
  }

  /**
   * Handle document touchend (for caret dragging)
   */
  private _onDocumentTouchEnd(event: TouchEvent): void {
    // Check if all touches are lifted
    if (event.touches.length === 0) {
      this._isTouchActive = false;
    }

    if (!this._enabled || this._destroyed) return;

    // Start fade if we were revealing and no more touches
    if (this._isRevealing && !this._isTouchActive) {
      this._fadeTimer = setTimeout(() => {
        this._renderer.startFadeOut();
        this._fadeTimer = setTimeout(() => {
          this._isRevealing = false;
          this._renderer.clearRevealPosition();
          this._callbacks.onRevealEnd?.();
          this._fadeTimer = null;
        }, this._config.fadeDuration);
      }, this._config.fadeDelay);
    }
  }

  /**
   * Set enabled state
   */
  setEnabled(enabled: boolean): void {
    this._enabled = enabled;

    if (!enabled) {
      this._cancelFade();
      this._isRevealing = false;
      this._minX = 0;
      this._maxX = 0;
      this._renderer.clearRevealPosition();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: { fadeDelay?: number; fadeDuration?: number }): void {
    if (config.fadeDelay !== undefined) {
      this._config.fadeDelay = config.fadeDelay;
    }
    if (config.fadeDuration !== undefined) {
      this._config.fadeDuration = config.fadeDuration;
    }
  }

  /**
   * Destroy the adapter
   */
  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;

    this._cancelFade();
    this._removeListeners();
    this._renderer.clearRevealPosition();
  }
}
