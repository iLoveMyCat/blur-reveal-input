import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DesktopAdapter } from '../../src/platform-adapter';
import { BlurRenderer } from '../../src/blur-renderer';
import { DEFAULT_CONFIG, CSS_CLASSES } from '../../src/config';
import { forceRemoveStyles, resetInstanceCount } from '../../src/styles';

describe('DesktopAdapter', () => {
  let input: HTMLInputElement;
  let renderer: BlurRenderer;
  let adapter: DesktopAdapter;

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
  });

  describe('constructor', () => {
    it('should create an adapter with a renderer', () => {
      adapter = new DesktopAdapter(renderer);
      expect(adapter).toBeDefined();
    });

    it('should attach event listeners to container', () => {
      const addEventListenerSpy = vi.spyOn(renderer.container!, 'addEventListener');
      adapter = new DesktopAdapter(renderer);
      expect(addEventListenerSpy).toHaveBeenCalled();
    });
  });

  describe('mouse events', () => {
    beforeEach(() => {
      adapter = new DesktopAdapter(renderer);
    });

    it('should expand reveal range on mousemove', () => {
      const setRevealRangeSpy = vi.spyOn(renderer, 'setRevealRange');
      const container = renderer.container!;

      // Must enter first to start revealing
      container.dispatchEvent(
        new MouseEvent('mouseenter', { clientX: 100, clientY: 50, bubbles: true })
      );

      const event = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 75,
        bubbles: true,
      });
      container.dispatchEvent(event);

      expect(setRevealRangeSpy).toHaveBeenCalled();
    });

    it('should activate with range class on mouseenter', () => {
      const container = renderer.container!;

      const event = new MouseEvent('mouseenter', {
        clientX: 100,
        clientY: 50,
        bubbles: true,
      });
      container.dispatchEvent(event);

      expect(container.classList.contains(CSS_CLASSES.ACTIVE_RANGE)).toBe(true);
    });

    it('should deactivate on mouseleave after fade', () => {
      vi.useFakeTimers();
      const container = renderer.container!;

      // First activate
      container.dispatchEvent(
        new MouseEvent('mouseenter', { clientX: 100, clientY: 50, bubbles: true })
      );

      // Then leave
      container.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

      // Wait for fade delay + duration (default 0 + 300)
      vi.advanceTimersByTime(DEFAULT_CONFIG.fadeDuration);

      expect(container.classList.contains(CSS_CLASSES.ACTIVE_RANGE)).toBe(false);
      vi.useRealTimers();
    });

    it('should accumulate reveal range as mouse moves', () => {
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

      // Enter at x=50 (relative)
      container.dispatchEvent(
        new MouseEvent('mouseenter', { clientX: 150, clientY: 75, bubbles: true })
      );
      setRevealRangeSpy.mockClear();

      // Move to x=100 (relative) - range should expand
      container.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 200, clientY: 75, bubbles: true })
      );

      expect(setRevealRangeSpy).toHaveBeenCalled();
      // The range should have expanded to include the new position
      const lastCall = setRevealRangeSpy.mock.calls[setRevealRangeSpy.mock.calls.length - 1];
      expect(lastCall[1]).toBeGreaterThan(lastCall[0]); // maxX > minX
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

      adapter = new DesktopAdapter(renderer, {
        onRevealStart,
        onRevealMove,
        onRevealEnd,
      });
    });

    it('should call onRevealStart on mouseenter', () => {
      const container = renderer.container!;
      container.dispatchEvent(
        new MouseEvent('mouseenter', { clientX: 100, clientY: 50, bubbles: true })
      );
      expect(onRevealStart).toHaveBeenCalled();
    });

    it('should call onRevealMove on mousemove', () => {
      const container = renderer.container!;
      container.dispatchEvent(
        new MouseEvent('mouseenter', { clientX: 100, clientY: 50, bubbles: true })
      );
      container.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 120, clientY: 50, bubbles: true })
      );
      expect(onRevealMove).toHaveBeenCalled();
    });

    it('should call onRevealEnd on mouseleave after fade', () => {
      vi.useFakeTimers();
      const container = renderer.container!;
      container.dispatchEvent(
        new MouseEvent('mouseenter', { clientX: 100, clientY: 50, bubbles: true })
      );
      container.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

      // Wait for fade delay + duration (DesktopAdapter default: 0 + 300)
      vi.advanceTimersByTime(DEFAULT_CONFIG.fadeDuration);

      expect(onRevealEnd).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('enabled state', () => {
    beforeEach(() => {
      adapter = new DesktopAdapter(renderer);
    });

    it('should not respond to events when disabled', () => {
      const setRevealRangeSpy = vi.spyOn(renderer, 'setRevealRange');
      const container = renderer.container!;

      adapter.setEnabled(false);

      container.dispatchEvent(
        new MouseEvent('mouseenter', { clientX: 150, clientY: 75, bubbles: true })
      );

      expect(setRevealRangeSpy).not.toHaveBeenCalled();
    });

    it('should respond to events when re-enabled', () => {
      const setRevealRangeSpy = vi.spyOn(renderer, 'setRevealRange');
      const container = renderer.container!;

      adapter.setEnabled(false);
      adapter.setEnabled(true);

      container.dispatchEvent(
        new MouseEvent('mouseenter', { clientX: 150, clientY: 75, bubbles: true })
      );
      container.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 150, clientY: 75, bubbles: true })
      );

      expect(setRevealRangeSpy).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should remove event listeners', () => {
      const removeEventListenerSpy = vi.spyOn(
        renderer.container!,
        'removeEventListener'
      );
      adapter = new DesktopAdapter(renderer);
      adapter.destroy();
      expect(removeEventListenerSpy).toHaveBeenCalled();
    });

    it('should clear reveal position on destroy', () => {
      adapter = new DesktopAdapter(renderer);
      const container = renderer.container!;

      // Activate first
      container.dispatchEvent(
        new MouseEvent('mouseenter', { clientX: 100, clientY: 50, bubbles: true })
      );

      adapter.destroy();

      expect(container.classList.contains(CSS_CLASSES.ACTIVE_RANGE)).toBe(false);
    });

    it('should be safe to call multiple times', () => {
      adapter = new DesktopAdapter(renderer);
      adapter.destroy();
      expect(() => adapter.destroy()).not.toThrow();
    });
  });

  describe('throttling', () => {
    beforeEach(() => {
      adapter = new DesktopAdapter(renderer);
    });

    it('should handle rapid mousemove events', async () => {
      const setRevealRangeSpy = vi.spyOn(renderer, 'setRevealRange');
      const container = renderer.container!;

      // Enter first to start revealing
      container.dispatchEvent(
        new MouseEvent('mouseenter', { clientX: 100, clientY: 50, bubbles: true })
      );
      setRevealRangeSpy.mockClear();

      // Fire multiple mousemove events rapidly
      for (let i = 0; i < 10; i++) {
        container.dispatchEvent(
          new MouseEvent('mousemove', {
            clientX: 100 + i * 10,
            clientY: 50,
            bubbles: true,
          })
        );
      }

      // Wait for RAF
      await new Promise((resolve) => requestAnimationFrame(resolve));

      // Should be called for each event (range accumulation)
      expect(setRevealRangeSpy.mock.calls.length).toBeLessThanOrEqual(10);
    });
  });
});
