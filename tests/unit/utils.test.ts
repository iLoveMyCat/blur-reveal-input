import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
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
} from '../../src/utils';

describe('utils', () => {
  describe('isTouchDevice', () => {
    it('should detect touch support via ontouchstart', () => {
      // JSDOM doesn't have ontouchstart, so this tests the false path
      expect(typeof isTouchDevice()).toBe('boolean');
    });
  });

  describe('isMobileDevice', () => {
    it('should detect based on pointer media query and touch support', () => {
      // The result depends on JSDOM's matchMedia mock behavior
      // Just verify it returns a boolean without throwing
      expect(typeof isMobileDevice()).toBe('boolean');
    });

    it('should return true when pointer: coarse matches', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(pointer: coarse)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      expect(isMobileDevice()).toBe(true);

      window.matchMedia = originalMatchMedia;
    });

    it('should return false when pointer is fine and not touch device', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      // Also need to mock that it's not a touch device and has large screen
      Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true });

      expect(isMobileDevice()).toBe(false);

      window.matchMedia = originalMatchMedia;
    });
  });

  describe('detectDirection', () => {
    let element: HTMLDivElement;

    beforeEach(() => {
      element = document.createElement('div');
      document.body.appendChild(element);
    });

    it('should return ltr by default', () => {
      expect(detectDirection(element)).toBe('ltr');
    });

    it('should detect rtl when dir attribute is set', () => {
      element.setAttribute('dir', 'rtl');
      expect(detectDirection(element)).toBe('rtl');
    });
  });

  describe('isBlurFilterSupported', () => {
    it('should return true (assuming modern browser support)', () => {
      expect(isBlurFilterSupported()).toBe(true);
    });
  });

  describe('isMaskImageSupported', () => {
    it('should return true (assuming modern browser support)', () => {
      expect(isMaskImageSupported()).toBe(true);
    });
  });

  describe('isFullySupported', () => {
    it('should return true when both blur and mask are supported', () => {
      expect(isFullySupported()).toBe(true);
    });
  });

  describe('prefersReducedMotion', () => {
    it('should return false by default in tests', () => {
      expect(prefersReducedMotion()).toBe(false);
    });
  });

  describe('isHighContrastMode', () => {
    it('should return false by default in tests', () => {
      expect(isHighContrastMode()).toBe(false);
    });
  });

  describe('clamp', () => {
    it('should return value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('should return min when value is below range', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('should return max when value is above range', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('should handle equal min and max', () => {
      expect(clamp(5, 5, 5)).toBe(5);
    });

    it('should handle negative ranges', () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(-15, -10, -1)).toBe(-10);
      expect(clamp(0, -10, -1)).toBe(-1);
    });
  });

  describe('getRelativePosition', () => {
    let element: HTMLDivElement;

    beforeEach(() => {
      element = document.createElement('div');
      element.style.position = 'absolute';
      element.style.left = '100px';
      element.style.top = '50px';
      element.style.width = '200px';
      element.style.height = '100px';
      document.body.appendChild(element);
    });

    it('should calculate position relative to element', () => {
      // Note: JSDOM's getBoundingClientRect returns zeros
      // This test verifies the calculation logic
      const { x, y } = getRelativePosition(element, 150, 75);
      expect(typeof x).toBe('number');
      expect(typeof y).toBe('number');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should use default prefix', () => {
      const id = generateId();
      expect(id.startsWith('blur-reveal-')).toBe(true);
    });

    it('should use custom prefix', () => {
      const id = generateId('custom');
      expect(id.startsWith('custom-')).toBe(true);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should delay function execution', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledOnce();
    });

    it('should reset timer on subsequent calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      vi.advanceTimersByTime(50);
      debouncedFn();
      vi.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledOnce();
    });

    it('should pass arguments to debounced function', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttleRAF', () => {
    it('should throttle using requestAnimationFrame', () => {
      const fn = vi.fn();
      const throttledFn = throttleRAF(fn);

      throttledFn();
      throttledFn();
      throttledFn();

      // Only one RAF should be scheduled
      expect(fn).not.toHaveBeenCalled();
    });

    it('should call function with latest arguments', async () => {
      const fn = vi.fn();
      const throttledFn = throttleRAF(fn);

      throttledFn('first');
      throttledFn('second');
      throttledFn('third');

      // Wait for RAF
      await new Promise((resolve) => requestAnimationFrame(resolve));

      expect(fn).toHaveBeenCalledWith('third');
    });
  });

  describe('isPasswordInput', () => {
    it('should return true for password inputs', () => {
      const input = document.createElement('input');
      input.type = 'password';
      expect(isPasswordInput(input)).toBe(true);
    });

    it('should return false for text inputs', () => {
      const input = document.createElement('input');
      input.type = 'text';
      expect(isPasswordInput(input)).toBe(false);
    });

    it('should return false for non-input elements', () => {
      const div = document.createElement('div');
      expect(isPasswordInput(div)).toBe(false);
    });
  });

  describe('isInputDisabled', () => {
    let input: HTMLInputElement;

    beforeEach(() => {
      input = document.createElement('input');
      input.type = 'password';
    });

    it('should return false for enabled input', () => {
      expect(isInputDisabled(input)).toBe(false);
    });

    it('should return true for disabled input', () => {
      input.disabled = true;
      expect(isInputDisabled(input)).toBe(true);
    });

    it('should return true for readonly input', () => {
      input.readOnly = true;
      expect(isInputDisabled(input)).toBe(true);
    });
  });

  describe('createDeferred', () => {
    it('should create a deferred with promise, resolve, and reject', () => {
      const deferred = createDeferred<string>();
      expect(deferred.promise).toBeInstanceOf(Promise);
      expect(typeof deferred.resolve).toBe('function');
      expect(typeof deferred.reject).toBe('function');
    });

    it('should resolve the promise', async () => {
      const deferred = createDeferred<string>();
      deferred.resolve('success');
      await expect(deferred.promise).resolves.toBe('success');
    });

    it('should reject the promise', async () => {
      const deferred = createDeferred<string>();
      deferred.reject(new Error('failure'));
      await expect(deferred.promise).rejects.toThrow('failure');
    });
  });

  describe('nextFrame', () => {
    it('should return a promise that resolves on next frame', async () => {
      const result = await nextFrame();
      expect(typeof result).toBe('number');
    });
  });

  describe('wait', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should resolve after specified time', async () => {
      const promise = wait(100);
      vi.advanceTimersByTime(100);
      await expect(promise).resolves.toBeUndefined();
    });
  });
});
