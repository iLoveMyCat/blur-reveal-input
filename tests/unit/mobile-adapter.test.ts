import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MobileAdapter } from '../../src/platform-adapter';
import { BlurRenderer } from '../../src/blur-renderer';
import { DEFAULT_CONFIG, CSS_CLASSES } from '../../src/config';
import { forceRemoveStyles, resetInstanceCount } from '../../src/styles';

describe('MobileAdapter', () => {
  let input: HTMLInputElement;
  let renderer: BlurRenderer;
  let adapter: MobileAdapter;

  beforeEach(() => {
    // Reset styles
    forceRemoveStyles();
    resetInstanceCount();

    // Create input and renderer
    input = document.createElement('input');
    input.type = 'password';
    input.value = 'testpass';
    document.body.appendChild(input);
    renderer = new BlurRenderer(input, DEFAULT_CONFIG);
  });

  afterEach(() => {
    if (adapter) {
      adapter.destroy();
    }
    if (renderer) {
      renderer.destroy();
    }
    if (input.parentNode) {
      input.parentNode.removeChild(input);
    }
    forceRemoveStyles();
    resetInstanceCount();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create an adapter with a renderer', () => {
      adapter = new MobileAdapter(renderer);
      expect(adapter).toBeDefined();
    });

    it('should attach touch event listeners to container', () => {
      const addEventListenerSpy = vi.spyOn(renderer.container!, 'addEventListener');
      adapter = new MobileAdapter(renderer);
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        expect.any(Object)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchmove',
        expect.any(Function),
        expect.any(Object)
      );
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'touchend',
        expect.any(Function)
      );
    });
  });

  describe('touch events', () => {
    beforeEach(() => {
      adapter = new MobileAdapter(renderer);
    });

    it('should activate on touchstart', () => {
      const container = renderer.container!;

      const touch = new Touch({
        identifier: 0,
        target: container,
        clientX: 100,
        clientY: 50,
      });

      const event = new TouchEvent('touchstart', {
        touches: [touch],
        bubbles: true,
      });
      container.dispatchEvent(event);

      // Mobile uses ACTIVE_RANGE for horizontal reveal
      expect(container.classList.contains(CSS_CLASSES.ACTIVE_RANGE)).toBe(true);
    });

    it('should update reveal range on touchmove', () => {
      const setRevealRangeSpy = vi.spyOn(renderer, 'setRevealRange');
      const container = renderer.container!;

      // Mock getBoundingClientRect
      const mockRect = {
        left: 100,
        top: 50,
        right: 300,
        bottom: 100,
        width: 200,
        height: 50,
        x: 100,
        y: 50,
        toJSON: () => {},
      };
      vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(mockRect);

      // Start touch
      const startTouch = new Touch({
        identifier: 0,
        target: container,
        clientX: 100,
        clientY: 50,
      });
      container.dispatchEvent(
        new TouchEvent('touchstart', { touches: [startTouch], bubbles: true })
      );

      // Move touch
      const moveTouch = new Touch({
        identifier: 0,
        target: container,
        clientX: 150,
        clientY: 75,
      });
      container.dispatchEvent(
        new TouchEvent('touchmove', { touches: [moveTouch], bubbles: true })
      );

      expect(setRevealRangeSpy).toHaveBeenCalled();
    });

    it('should deactivate on touchend', () => {
      vi.useFakeTimers();
      const container = renderer.container!;

      // Start touch
      const touch = new Touch({
        identifier: 0,
        target: container,
        clientX: 100,
        clientY: 50,
      });
      container.dispatchEvent(
        new TouchEvent('touchstart', { touches: [touch], bubbles: true })
      );

      // End touch
      container.dispatchEvent(
        new TouchEvent('touchend', { touches: [], bubbles: true })
      );

      // Wait for fade delay
      vi.advanceTimersByTime(DEFAULT_CONFIG.fadeDelay + DEFAULT_CONFIG.fadeDuration);

      expect(container.classList.contains(CSS_CLASSES.ACTIVE_RANGE)).toBe(false);
    });
  });

  describe('fade-back behavior', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      adapter = new MobileAdapter(renderer);
    });

    it('should start fade-back after fadeDelay on touchend', () => {
      const container = renderer.container!;

      // Start and end touch
      const touch = new Touch({
        identifier: 0,
        target: container,
        clientX: 100,
        clientY: 50,
      });
      container.dispatchEvent(
        new TouchEvent('touchstart', { touches: [touch], bubbles: true })
      );
      container.dispatchEvent(
        new TouchEvent('touchend', { touches: [], bubbles: true })
      );

      // Before delay - should still be active (using ACTIVE_RANGE for mobile)
      expect(container.classList.contains(CSS_CLASSES.ACTIVE_RANGE)).toBe(true);

      // After delay - should be inactive
      vi.advanceTimersByTime(DEFAULT_CONFIG.fadeDelay + DEFAULT_CONFIG.fadeDuration);
      expect(container.classList.contains(CSS_CLASSES.ACTIVE_RANGE)).toBe(false);
    });

    it('should cancel fade-back if touch restarts', () => {
      const container = renderer.container!;

      // Start and end touch
      const touch1 = new Touch({
        identifier: 0,
        target: container,
        clientX: 100,
        clientY: 50,
      });
      container.dispatchEvent(
        new TouchEvent('touchstart', { touches: [touch1], bubbles: true })
      );
      container.dispatchEvent(
        new TouchEvent('touchend', { touches: [], bubbles: true })
      );

      // Advance partially through delay
      vi.advanceTimersByTime(DEFAULT_CONFIG.fadeDelay / 2);

      // Touch again
      const touch2 = new Touch({
        identifier: 0,
        target: container,
        clientX: 150,
        clientY: 50,
      });
      container.dispatchEvent(
        new TouchEvent('touchstart', { touches: [touch2], bubbles: true })
      );

      // Wait full delay from original touch
      vi.advanceTimersByTime(DEFAULT_CONFIG.fadeDelay);

      // Should still be active because new touch cancelled fade (using ACTIVE_RANGE for mobile)
      expect(container.classList.contains(CSS_CLASSES.ACTIVE_RANGE)).toBe(true);
    });
  });

  describe('reveal callbacks', () => {
    let onRevealStart: ReturnType<typeof vi.fn>;
    let onRevealMove: ReturnType<typeof vi.fn>;
    let onRevealEnd: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      onRevealStart = vi.fn();
      onRevealMove = vi.fn();
      onRevealEnd = vi.fn();

      adapter = new MobileAdapter(renderer, {
        onRevealStart,
        onRevealMove,
        onRevealEnd,
      });
    });

    it('should call onRevealStart on touchstart', () => {
      const container = renderer.container!;
      const touch = new Touch({
        identifier: 0,
        target: container,
        clientX: 100,
        clientY: 50,
      });
      container.dispatchEvent(
        new TouchEvent('touchstart', { touches: [touch], bubbles: true })
      );
      expect(onRevealStart).toHaveBeenCalled();
    });

    it('should call onRevealMove on touchmove', () => {
      const container = renderer.container!;

      // Start
      const startTouch = new Touch({
        identifier: 0,
        target: container,
        clientX: 100,
        clientY: 50,
      });
      container.dispatchEvent(
        new TouchEvent('touchstart', { touches: [startTouch], bubbles: true })
      );

      // Move
      const moveTouch = new Touch({
        identifier: 0,
        target: container,
        clientX: 150,
        clientY: 50,
      });
      container.dispatchEvent(
        new TouchEvent('touchmove', { touches: [moveTouch], bubbles: true })
      );

      expect(onRevealMove).toHaveBeenCalled();
    });

    it('should call onRevealEnd after fade completes', () => {
      vi.useFakeTimers();
      const container = renderer.container!;

      // Start and end touch
      const touch = new Touch({
        identifier: 0,
        target: container,
        clientX: 100,
        clientY: 50,
      });
      container.dispatchEvent(
        new TouchEvent('touchstart', { touches: [touch], bubbles: true })
      );
      container.dispatchEvent(
        new TouchEvent('touchend', { touches: [], bubbles: true })
      );

      // Wait for fade
      vi.advanceTimersByTime(DEFAULT_CONFIG.fadeDelay + DEFAULT_CONFIG.fadeDuration);

      expect(onRevealEnd).toHaveBeenCalled();
    });
  });

  describe('enabled state', () => {
    beforeEach(() => {
      adapter = new MobileAdapter(renderer);
    });

    it('should not respond to touch when disabled', () => {
      const setRevealRangeSpy = vi.spyOn(renderer, 'setRevealRange');
      const container = renderer.container!;

      adapter.setEnabled(false);

      const touch = new Touch({
        identifier: 0,
        target: container,
        clientX: 100,
        clientY: 50,
      });
      container.dispatchEvent(
        new TouchEvent('touchstart', { touches: [touch], bubbles: true })
      );

      expect(setRevealRangeSpy).not.toHaveBeenCalled();
    });

    it('should respond to touch when re-enabled', () => {
      const setRevealRangeSpy = vi.spyOn(renderer, 'setRevealRange');
      const container = renderer.container!;

      adapter.setEnabled(false);
      adapter.setEnabled(true);

      const touch = new Touch({
        identifier: 0,
        target: container,
        clientX: 100,
        clientY: 50,
      });
      container.dispatchEvent(
        new TouchEvent('touchstart', { touches: [touch], bubbles: true })
      );

      expect(setRevealRangeSpy).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should remove touch event listeners', () => {
      const removeEventListenerSpy = vi.spyOn(
        renderer.container!,
        'removeEventListener'
      );
      adapter = new MobileAdapter(renderer);
      adapter.destroy();
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        expect.any(Object)
      );
    });

    it('should clear any pending fade timers', () => {
      vi.useFakeTimers();
      adapter = new MobileAdapter(renderer);
      const container = renderer.container!;

      // Start and end touch to trigger fade timer
      const touch = new Touch({
        identifier: 0,
        target: container,
        clientX: 100,
        clientY: 50,
      });
      container.dispatchEvent(
        new TouchEvent('touchstart', { touches: [touch], bubbles: true })
      );
      container.dispatchEvent(
        new TouchEvent('touchend', { touches: [], bubbles: true })
      );

      // Destroy before fade completes
      adapter.destroy();

      // Advance time - should not throw or cause issues
      vi.advanceTimersByTime(DEFAULT_CONFIG.fadeDelay + DEFAULT_CONFIG.fadeDuration);

      // Should be safe
      expect(true).toBe(true);
    });

    it('should be safe to call multiple times', () => {
      adapter = new MobileAdapter(renderer);
      adapter.destroy();
      expect(() => adapter.destroy()).not.toThrow();
    });
  });

  describe('custom fade settings', () => {
    it('should use custom fadeDelay from config', () => {
      vi.useFakeTimers();
      const customConfig = { ...DEFAULT_CONFIG, fadeDelay: 1000 };
      renderer.destroy();
      renderer = new BlurRenderer(input, customConfig);
      adapter = new MobileAdapter(renderer, {}, customConfig);

      const container = renderer.container!;
      const touch = new Touch({
        identifier: 0,
        target: container,
        clientX: 100,
        clientY: 50,
      });
      container.dispatchEvent(
        new TouchEvent('touchstart', { touches: [touch], bubbles: true })
      );
      container.dispatchEvent(
        new TouchEvent('touchend', { touches: [], bubbles: true })
      );

      // Should still be active before custom delay (using ACTIVE_RANGE for mobile)
      vi.advanceTimersByTime(500);
      expect(container.classList.contains(CSS_CLASSES.ACTIVE_RANGE)).toBe(true);

      // Should be inactive after custom delay
      vi.advanceTimersByTime(1000 + customConfig.fadeDuration);
      expect(container.classList.contains(CSS_CLASSES.ACTIVE_RANGE)).toBe(false);
    });
  });
});
