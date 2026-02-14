import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BlurRenderer } from '../../src/blur-renderer';
import { DEFAULT_CONFIG, CSS_CLASSES, CSS_VARS } from '../../src/config';
import { forceRemoveStyles, resetInstanceCount } from '../../src/styles';

describe('BlurRenderer', () => {
  let input: HTMLInputElement;
  let renderer: BlurRenderer;

  beforeEach(() => {
    // Reset styles before each test
    forceRemoveStyles();
    resetInstanceCount();

    // Create a password input
    input = document.createElement('input');
    input.type = 'password';
    input.value = 'testpass';
    document.body.appendChild(input);
  });

  afterEach(() => {
    // Cleanup
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
    it('should create a renderer for a password input', () => {
      renderer = new BlurRenderer(input, DEFAULT_CONFIG);
      expect(renderer).toBeDefined();
    });

    it('should throw if element is not an HTMLInputElement', () => {
      const div = document.createElement('div');
      expect(() => new BlurRenderer(div as HTMLInputElement, DEFAULT_CONFIG)).toThrow();
    });

    it('should throw if input is not type password', () => {
      const textInput = document.createElement('input');
      textInput.type = 'text';
      expect(() => new BlurRenderer(textInput, DEFAULT_CONFIG)).toThrow();
    });
  });

  describe('DOM structure', () => {
    beforeEach(() => {
      renderer = new BlurRenderer(input, DEFAULT_CONFIG);
    });

    it('should wrap input in a container', () => {
      const container = input.parentElement;
      expect(container).not.toBeNull();
      expect(container?.classList.contains(CSS_CLASSES.CONTAINER)).toBe(true);
    });

    it('should create two overlay elements (blurred and clear)', () => {
      const container = input.parentElement;
      const overlays = container?.querySelectorAll(`.${CSS_CLASSES.OVERLAY}`);
      expect(overlays?.length).toBe(2);

      const blurredOverlay = container?.querySelector(`.${CSS_CLASSES.OVERLAY}--blurred`);
      const clearOverlay = container?.querySelector(`.${CSS_CLASSES.OVERLAY}--clear`);
      expect(blurredOverlay).not.toBeNull();
      expect(clearOverlay).not.toBeNull();
    });

    it('should add blur-reveal-input class to input', () => {
      expect(input.classList.contains(CSS_CLASSES.INPUT)).toBe(true);
    });

    it('should preserve input position in DOM', () => {
      const container = input.parentElement;
      expect(container?.contains(input)).toBe(true);
    });
  });

  describe('CSS Variables', () => {
    beforeEach(() => {
      renderer = new BlurRenderer(input, DEFAULT_CONFIG);
    });

    it('should set blur intensity CSS variable', () => {
      const container = input.parentElement as HTMLElement;
      const intensity = container.style.getPropertyValue(CSS_VARS.BLUR_INTENSITY);
      expect(intensity).toBe(`${DEFAULT_CONFIG.blurIntensity}px`);
    });

    it('should set reveal radius CSS variable', () => {
      const container = input.parentElement as HTMLElement;
      const radius = container.style.getPropertyValue(CSS_VARS.REVEAL_RADIUS);
      expect(radius).toBe(`${DEFAULT_CONFIG.revealRadius}px`);
    });

    it('should apply custom blur intensity from config', () => {
      renderer.destroy();
      renderer = new BlurRenderer(input, { ...DEFAULT_CONFIG, blurIntensity: 12 });
      const container = input.parentElement as HTMLElement;
      const intensity = container.style.getPropertyValue(CSS_VARS.BLUR_INTENSITY);
      expect(intensity).toBe('12px');
    });

    it('should apply custom reveal radius from config', () => {
      renderer.destroy();
      renderer = new BlurRenderer(input, { ...DEFAULT_CONFIG, revealRadius: 50 });
      const container = input.parentElement as HTMLElement;
      const radius = container.style.getPropertyValue(CSS_VARS.REVEAL_RADIUS);
      expect(radius).toBe('50px');
    });
  });

  describe('updateText', () => {
    beforeEach(() => {
      renderer = new BlurRenderer(input, DEFAULT_CONFIG);
    });

    it('should update both overlay text content with actual password text', () => {
      renderer.updateText('newpassword');
      const blurredOverlay = input.parentElement?.querySelector(`.${CSS_CLASSES.OVERLAY}--blurred`);
      const clearOverlay = input.parentElement?.querySelector(`.${CSS_CLASSES.OVERLAY}--clear`);
      // Overlays show actual text (CSS handles the blur)
      expect(blurredOverlay?.textContent).toBe('newpassword');
      expect(clearOverlay?.textContent).toBe('newpassword');
    });

    it('should show actual password characters', () => {
      renderer.updateText('123456');
      const blurredOverlay = input.parentElement?.querySelector(`.${CSS_CLASSES.OVERLAY}--blurred`);
      expect(blurredOverlay?.textContent).toBe('123456');
    });

    it('should handle empty text', () => {
      renderer.updateText('');
      const blurredOverlay = input.parentElement?.querySelector(`.${CSS_CLASSES.OVERLAY}--blurred`);
      expect(blurredOverlay?.textContent).toBe('');
    });
  });

  describe('setRevealPosition', () => {
    beforeEach(() => {
      renderer = new BlurRenderer(input, DEFAULT_CONFIG);
    });

    it('should set reveal X position CSS variable', () => {
      renderer.setRevealPosition(100, 50);
      const container = input.parentElement as HTMLElement;
      const x = container.style.getPropertyValue(CSS_VARS.REVEAL_X);
      expect(x).toBe('100px');
    });

    it('should set reveal Y position CSS variable', () => {
      renderer.setRevealPosition(100, 50);
      const container = input.parentElement as HTMLElement;
      const y = container.style.getPropertyValue(CSS_VARS.REVEAL_Y);
      expect(y).toBe('50px');
    });

    it('should add active class to container', () => {
      renderer.setRevealPosition(100, 50);
      const container = input.parentElement as HTMLElement;
      expect(container.classList.contains(CSS_CLASSES.ACTIVE)).toBe(true);
    });
  });

  describe('clearRevealPosition', () => {
    beforeEach(() => {
      renderer = new BlurRenderer(input, DEFAULT_CONFIG);
      renderer.setRevealPosition(100, 50);
    });

    it('should remove active class from container', () => {
      renderer.clearRevealPosition();
      const container = input.parentElement as HTMLElement;
      expect(container.classList.contains(CSS_CLASSES.ACTIVE)).toBe(false);
    });

    it('should remove fading class from container', () => {
      renderer.startFadeOut();
      renderer.clearRevealPosition();
      const container = input.parentElement as HTMLElement;
      expect(container.classList.contains(CSS_CLASSES.FADING)).toBe(false);
    });

    it('should reset reveal position CSS variables', () => {
      renderer.clearRevealPosition();
      const container = input.parentElement as HTMLElement;
      const x = container.style.getPropertyValue(CSS_VARS.REVEAL_X);
      const y = container.style.getPropertyValue(CSS_VARS.REVEAL_Y);
      expect(x).toBe('-9999px');
      expect(y).toBe('-9999px');
    });
  });

  describe('startFadeOut', () => {
    beforeEach(() => {
      renderer = new BlurRenderer(input, DEFAULT_CONFIG);
      renderer.setRevealPosition(100, 50);
    });

    it('should keep active class and add fading class for smooth fade', () => {
      renderer.startFadeOut();
      const container = input.parentElement as HTMLElement;
      // ACTIVE class stays so the mask position is preserved during fade animation
      expect(container.classList.contains(CSS_CLASSES.ACTIVE)).toBe(true);
      expect(container.classList.contains(CSS_CLASSES.FADING)).toBe(true);
    });

    it('should preserve reveal position during fade', () => {
      renderer.startFadeOut();
      const container = input.parentElement as HTMLElement;
      const x = container.style.getPropertyValue(CSS_VARS.REVEAL_X);
      const y = container.style.getPropertyValue(CSS_VARS.REVEAL_Y);
      expect(x).toBe('100px');
      expect(y).toBe('50px');
    });
  });

  describe('cancelFadeOut', () => {
    beforeEach(() => {
      renderer = new BlurRenderer(input, DEFAULT_CONFIG);
      renderer.setRevealPosition(100, 50);
      renderer.startFadeOut();
    });

    it('should remove fading class while keeping existing active class', () => {
      renderer.cancelFadeOut();
      const container = input.parentElement as HTMLElement;
      expect(container.classList.contains(CSS_CLASSES.FADING)).toBe(false);
      // ACTIVE was already present from setRevealPosition, cancelFadeOut preserves it
      expect(container.classList.contains(CSS_CLASSES.ACTIVE)).toBe(true);
    });
  });

  describe('setEnabled', () => {
    beforeEach(() => {
      renderer = new BlurRenderer(input, DEFAULT_CONFIG);
    });

    it('should add disabled class when disabled', () => {
      renderer.setEnabled(false);
      const container = input.parentElement as HTMLElement;
      expect(container.classList.contains(CSS_CLASSES.DISABLED)).toBe(true);
    });

    it('should remove disabled class when enabled', () => {
      renderer.setEnabled(false);
      renderer.setEnabled(true);
      const container = input.parentElement as HTMLElement;
      expect(container.classList.contains(CSS_CLASSES.DISABLED)).toBe(false);
    });
  });

  describe('updateConfig', () => {
    beforeEach(() => {
      renderer = new BlurRenderer(input, DEFAULT_CONFIG);
    });

    it('should update blur intensity', () => {
      renderer.updateConfig({ blurIntensity: 16 });
      const container = input.parentElement as HTMLElement;
      const intensity = container.style.getPropertyValue(CSS_VARS.BLUR_INTENSITY);
      expect(intensity).toBe('16px');
    });

    it('should update reveal radius', () => {
      renderer.updateConfig({ revealRadius: 60 });
      const container = input.parentElement as HTMLElement;
      const radius = container.style.getPropertyValue(CSS_VARS.REVEAL_RADIUS);
      expect(radius).toBe('60px');
    });
  });

  describe('destroy', () => {
    beforeEach(() => {
      renderer = new BlurRenderer(input, DEFAULT_CONFIG);
    });

    it('should remove container and restore input', () => {
      const originalParent = input.parentElement?.parentElement;
      renderer.destroy();
      expect(input.parentElement).toBe(originalParent);
    });

    it('should remove blur-reveal-input class from input', () => {
      renderer.destroy();
      expect(input.classList.contains(CSS_CLASSES.INPUT)).toBe(false);
    });

    it('should remove overlay element', () => {
      renderer.destroy();
      const overlay = document.querySelector(`.${CSS_CLASSES.OVERLAY}`);
      expect(overlay).toBeNull();
    });

    it('should be safe to call multiple times', () => {
      renderer.destroy();
      expect(() => renderer.destroy()).not.toThrow();
    });
  });

  describe('getters', () => {
    beforeEach(() => {
      renderer = new BlurRenderer(input, DEFAULT_CONFIG);
    });

    it('should return the input element', () => {
      expect(renderer.input).toBe(input);
    });

    it('should return the container element', () => {
      expect(renderer.container).toBe(input.parentElement);
    });

    it('should return the blurred overlay element via overlay getter', () => {
      expect(renderer.overlay).toBe(
        input.parentElement?.querySelector(`.${CSS_CLASSES.OVERLAY}--blurred`)
      );
    });

    it('should return both overlay elements via specific getters', () => {
      expect(renderer.blurredOverlay).toBe(
        input.parentElement?.querySelector(`.${CSS_CLASSES.OVERLAY}--blurred`)
      );
      expect(renderer.clearOverlay).toBe(
        input.parentElement?.querySelector(`.${CSS_CLASSES.OVERLAY}--clear`)
      );
    });

    it('should return isDestroyed status', () => {
      expect(renderer.isDestroyed).toBe(false);
      renderer.destroy();
      expect(renderer.isDestroyed).toBe(true);
    });
  });

  describe('synchronization with input', () => {
    beforeEach(() => {
      renderer = new BlurRenderer(input, DEFAULT_CONFIG);
    });

    it('should sync overlay text on input event', () => {
      input.value = 'updated';
      input.dispatchEvent(new Event('input'));
      const blurredOverlay = input.parentElement?.querySelector(`.${CSS_CLASSES.OVERLAY}--blurred`);
      expect(blurredOverlay?.textContent).toBe('updated');
    });
  });
});
