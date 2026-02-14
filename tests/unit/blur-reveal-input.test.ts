import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlurRevealInput } from '../../src/blur-reveal-input';
import { DEFAULT_CONFIG, CSS_CLASSES, EVENTS } from '../../src';
import { forceRemoveStyles, resetInstanceCount } from '../../src/styles';

describe('BlurRevealInput', () => {
  let input: HTMLInputElement;
  let instance: BlurRevealInput;

  beforeEach(() => {
    // Reset styles
    forceRemoveStyles();
    resetInstanceCount();

    // Create input
    input = document.createElement('input');
    input.type = 'password';
    input.value = 'testpass';
    document.body.appendChild(input);
  });

  afterEach(() => {
    if (instance && !instance.isDestroyed) {
      instance.destroy();
    }
    if (input.parentNode) {
      input.parentNode.removeChild(input);
    }
    forceRemoveStyles();
    resetInstanceCount();
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create an instance for password input', () => {
      instance = new BlurRevealInput(input);
      expect(instance).toBeDefined();
    });

    it('should throw for non-password input', () => {
      const textInput = document.createElement('input');
      textInput.type = 'text';
      expect(() => new BlurRevealInput(textInput)).toThrow();
    });

    it('should apply default config', () => {
      instance = new BlurRevealInput(input);
      expect(instance.config.blurIntensity).toBe(DEFAULT_CONFIG.blurIntensity);
      expect(instance.config.revealRadius).toBeDefined();
    });

    it('should accept custom config options', () => {
      instance = new BlurRevealInput(input, { blurIntensity: 16 });
      expect(instance.config.blurIntensity).toBe(16);
    });

    it('should parse data attributes', () => {
      input.setAttribute('data-blur-intensity', '12');
      instance = new BlurRevealInput(input);
      expect(instance.config.blurIntensity).toBe(12);
    });

    it('should prefer options over data attributes', () => {
      input.setAttribute('data-blur-intensity', '12');
      instance = new BlurRevealInput(input, { blurIntensity: 20 });
      expect(instance.config.blurIntensity).toBe(20);
    });

    it('should validate config by default', () => {
      expect(() => new BlurRevealInput(input, { blurIntensity: -1 })).toThrow();
    });

    it('should skip validation when specified', () => {
      expect(
        () => new BlurRevealInput(input, { blurIntensity: -1, skipValidation: true })
      ).not.toThrow();
    });
  });

  describe('DOM structure', () => {
    beforeEach(() => {
      instance = new BlurRevealInput(input);
    });

    it('should wrap input in container', () => {
      expect(input.parentElement?.classList.contains(CSS_CLASSES.CONTAINER)).toBe(
        true
      );
    });

    it('should create overlay', () => {
      const overlay = input.parentElement?.querySelector(`.${CSS_CLASSES.OVERLAY}`);
      expect(overlay).not.toBeNull();
    });
  });

  describe('events', () => {
    beforeEach(() => {
      instance = new BlurRevealInput(input);
    });

    it('should dispatch init event on creation', () => {
      const handler = vi.fn();
      const newInput = document.createElement('input');
      newInput.type = 'password';
      document.body.appendChild(newInput);
      newInput.addEventListener(EVENTS.INIT, handler);

      const newInstance = new BlurRevealInput(newInput);
      expect(handler).toHaveBeenCalled();

      newInstance.destroy();
      newInput.remove();
    });

    it('should dispatch destroy event on destroy', () => {
      const handler = vi.fn();
      input.addEventListener(EVENTS.DESTROY, handler);

      instance.destroy();
      expect(handler).toHaveBeenCalled();
    });

    it('should dispatch reveal event on hover', () => {
      const handler = vi.fn();
      input.addEventListener(EVENTS.REVEAL, handler);

      const container = input.parentElement!;
      container.dispatchEvent(
        new MouseEvent('mouseenter', { clientX: 100, clientY: 50, bubbles: true })
      );

      expect(handler).toHaveBeenCalled();
    });

    it('should dispatch hide event on leave after fade', () => {
      vi.useFakeTimers();
      const handler = vi.fn();
      input.addEventListener(EVENTS.HIDE, handler);

      const container = input.parentElement!;
      container.dispatchEvent(
        new MouseEvent('mouseenter', { clientX: 100, clientY: 50, bubbles: true })
      );
      container.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

      // Wait for fade delay + duration
      vi.advanceTimersByTime(DEFAULT_CONFIG.fadeDelay + DEFAULT_CONFIG.fadeDuration);

      expect(handler).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('enable/disable', () => {
    beforeEach(() => {
      instance = new BlurRevealInput(input);
    });

    it('should start enabled by default', () => {
      expect(instance.isEnabled).toBe(true);
    });

    it('should disable the effect', () => {
      instance.disable();
      expect(instance.isEnabled).toBe(false);
    });

    it('should re-enable the effect', () => {
      instance.disable();
      instance.enable();
      expect(instance.isEnabled).toBe(true);
    });

    it('should not respond to events when disabled', () => {
      const handler = vi.fn();
      input.addEventListener(EVENTS.REVEAL, handler);

      instance.disable();

      const container = input.parentElement!;
      container.dispatchEvent(
        new MouseEvent('mouseenter', { clientX: 100, clientY: 50, bubbles: true })
      );

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    beforeEach(() => {
      instance = new BlurRevealInput(input);
    });

    it('should update blur intensity', () => {
      instance.updateConfig({ blurIntensity: 20 });
      expect(instance.config.blurIntensity).toBe(20);
    });

    it('should update reveal radius', () => {
      instance.updateConfig({ revealRadius: 60 });
      expect(instance.config.revealRadius).toBe(60);
    });
  });

  describe('disabled input handling', () => {
    beforeEach(() => {
      instance = new BlurRevealInput(input);
    });

    it('should add disabled class when input is disabled', async () => {
      input.disabled = true;

      // Wait for mutation observer to process
      await new Promise((resolve) => setTimeout(resolve, 10));

      const container = input.parentElement!;
      expect(container.classList.contains(CSS_CLASSES.DISABLED)).toBe(true);
    });

    it('should add disabled class when input is readonly', async () => {
      input.readOnly = true;

      // Wait for mutation observer to process
      await new Promise((resolve) => setTimeout(resolve, 10));

      const container = input.parentElement!;
      expect(container.classList.contains(CSS_CLASSES.DISABLED)).toBe(true);
    });
  });

  describe('destroy', () => {
    beforeEach(() => {
      instance = new BlurRevealInput(input);
    });

    it('should clean up DOM', () => {
      instance.destroy();
      expect(input.parentElement?.classList.contains(CSS_CLASSES.CONTAINER)).toBe(
        false
      );
    });

    it('should set isDestroyed to true', () => {
      instance.destroy();
      expect(instance.isDestroyed).toBe(true);
    });

    it('should be safe to call multiple times', () => {
      instance.destroy();
      expect(() => instance.destroy()).not.toThrow();
    });

    it('should ignore operations after destroy', () => {
      instance.destroy();
      expect(() => instance.updateConfig({ blurIntensity: 20 })).not.toThrow();
    });
  });

  describe('static methods', () => {
    it('should create instance with static create()', () => {
      instance = BlurRevealInput.create(input);
      expect(instance).toBeInstanceOf(BlurRevealInput);
    });

    it('should apply to all password inputs with applyToAll()', () => {
      const testContainer = document.createElement('div');
      const input1 = document.createElement('input');
      input1.type = 'password';
      const input2 = document.createElement('input');
      input2.type = 'password';
      const textInput = document.createElement('input');
      textInput.type = 'text';

      testContainer.appendChild(input1);
      testContainer.appendChild(input2);
      testContainer.appendChild(textInput);
      document.body.appendChild(testContainer);

      const instances = BlurRevealInput.applyToAll(testContainer);

      expect(instances.length).toBe(2);
      expect(instances[0]).toBeInstanceOf(BlurRevealInput);
      expect(instances[1]).toBeInstanceOf(BlurRevealInput);

      // Cleanup - destroy instances first, then remove container
      instances.forEach((i) => i.destroy());

      // Remove the container after destroying instances
      if (testContainer.parentNode) {
        testContainer.parentNode.removeChild(testContainer);
      }
    });
  });

  describe('config.enabled = false', () => {
    it('should not initialize when enabled is false', () => {
      instance = new BlurRevealInput(input, { enabled: false });

      // No container should be created
      expect(input.parentElement?.classList.contains(CSS_CLASSES.CONTAINER)).toBe(
        false
      );
    });

    it('should initialize when enable() is called', () => {
      instance = new BlurRevealInput(input, { enabled: false });
      instance.enable();

      expect(input.parentElement?.classList.contains(CSS_CLASSES.CONTAINER)).toBe(
        true
      );
    });
  });
});
