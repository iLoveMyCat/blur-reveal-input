import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_CONFIG,
  DEFAULT_MOBILE_REVEAL_RADIUS,
  CSS_VARS,
  CSS_CLASSES,
  DATA_ATTRIBUTES,
  mergeConfig,
  validateConfig,
  parseDataAttributes,
  type BlurRevealConfig,
} from '../../src/config';

describe('config', () => {
  describe('DEFAULT_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_CONFIG.blurIntensity).toBe(4);
      expect(DEFAULT_CONFIG.revealRadius).toBe(30);
      expect(DEFAULT_CONFIG.fadeDelay).toBe(500);
      expect(DEFAULT_CONFIG.fadeDuration).toBe(300);
      expect(DEFAULT_CONFIG.enabled).toBe(true);
    });

    it('should be readonly', () => {
      expect(() => {
        // @ts-expect-error - Testing readonly
        DEFAULT_CONFIG.blurIntensity = 10;
      }).toThrow();
    });
  });

  describe('DEFAULT_MOBILE_REVEAL_RADIUS', () => {
    it('should be 40px', () => {
      expect(DEFAULT_MOBILE_REVEAL_RADIUS).toBe(40);
    });
  });

  describe('CSS_VARS', () => {
    it('should have correct CSS custom property names', () => {
      expect(CSS_VARS.BLUR_INTENSITY).toBe('--blur-reveal-intensity');
      expect(CSS_VARS.REVEAL_RADIUS).toBe('--blur-reveal-radius');
      expect(CSS_VARS.REVEAL_X).toBe('--blur-reveal-x');
      expect(CSS_VARS.REVEAL_Y).toBe('--blur-reveal-y');
      expect(CSS_VARS.FONT).toBe('--blur-reveal-font');
    });
  });

  describe('CSS_CLASSES', () => {
    it('should have correct class names', () => {
      expect(CSS_CLASSES.CONTAINER).toBe('blur-reveal-container');
      expect(CSS_CLASSES.OVERLAY).toBe('blur-reveal-overlay');
      expect(CSS_CLASSES.INPUT).toBe('blur-reveal-input');
      expect(CSS_CLASSES.CURSOR).toBe('blur-reveal-cursor');
      expect(CSS_CLASSES.ACTIVE).toBe('blur-reveal-active');
      expect(CSS_CLASSES.DISABLED).toBe('blur-reveal-disabled');
    });
  });

  describe('DATA_ATTRIBUTES', () => {
    it('should have correct data attribute names', () => {
      expect(DATA_ATTRIBUTES.BLUR_INTENSITY).toBe('data-blur-intensity');
      expect(DATA_ATTRIBUTES.REVEAL_RADIUS).toBe('data-reveal-radius');
      expect(DATA_ATTRIBUTES.FADE_DELAY).toBe('data-fade-delay');
      expect(DATA_ATTRIBUTES.ENABLED).toBe('data-blur-reveal');
    });
  });

  describe('mergeConfig', () => {
    it('should return defaults when no partial provided', () => {
      const result = mergeConfig();
      expect(result).toEqual(DEFAULT_CONFIG);
    });

    it('should merge partial config with defaults', () => {
      const result = mergeConfig({ blurIntensity: 12 });
      expect(result.blurIntensity).toBe(12);
      expect(result.revealRadius).toBe(DEFAULT_CONFIG.revealRadius);
      expect(result.fadeDelay).toBe(DEFAULT_CONFIG.fadeDelay);
    });

    it('should override multiple values', () => {
      const result = mergeConfig({
        blurIntensity: 10,
        revealRadius: 50,
        enabled: false,
      });
      expect(result.blurIntensity).toBe(10);
      expect(result.revealRadius).toBe(50);
      expect(result.enabled).toBe(false);
      expect(result.fadeDelay).toBe(DEFAULT_CONFIG.fadeDelay);
    });

    it('should return a new object', () => {
      const result = mergeConfig();
      expect(result).not.toBe(DEFAULT_CONFIG);
    });
  });

  describe('validateConfig', () => {
    it('should not throw for valid config', () => {
      const config: BlurRevealConfig = {
        blurIntensity: 8,
        revealRadius: 30,
        fadeDelay: 500,
        fadeDuration: 300,
        enabled: true,
      };
      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should throw for negative blurIntensity', () => {
      const config = mergeConfig({ blurIntensity: -1 });
      expect(() => validateConfig(config)).toThrow('blurIntensity must be non-negative');
    });

    it('should allow zero blurIntensity', () => {
      const config = mergeConfig({ blurIntensity: 0 });
      expect(() => validateConfig(config)).not.toThrow();
    });

    it('should throw for zero or negative revealRadius', () => {
      const config = mergeConfig({ revealRadius: 0 });
      expect(() => validateConfig(config)).toThrow('revealRadius must be positive');

      const config2 = mergeConfig({ revealRadius: -10 });
      expect(() => validateConfig(config2)).toThrow('revealRadius must be positive');
    });

    it('should throw for negative fadeDelay', () => {
      const config = mergeConfig({ fadeDelay: -100 });
      expect(() => validateConfig(config)).toThrow('fadeDelay must be non-negative');
    });

    it('should throw for negative fadeDuration', () => {
      const config = mergeConfig({ fadeDuration: -50 });
      expect(() => validateConfig(config)).toThrow('fadeDuration must be non-negative');
    });
  });

  describe('parseDataAttributes', () => {
    let element: HTMLElement;

    beforeEach(() => {
      element = document.createElement('div');
    });

    it('should return empty object for element with no data attributes', () => {
      const result = parseDataAttributes(element);
      expect(result).toEqual({});
    });

    it('should parse blur-intensity', () => {
      element.setAttribute('data-blur-intensity', '12');
      const result = parseDataAttributes(element);
      expect(result.blurIntensity).toBe(12);
    });

    it('should parse reveal-radius', () => {
      element.setAttribute('data-reveal-radius', '50');
      const result = parseDataAttributes(element);
      expect(result.revealRadius).toBe(50);
    });

    it('should parse fade-delay', () => {
      element.setAttribute('data-fade-delay', '1000');
      const result = parseDataAttributes(element);
      expect(result.fadeDelay).toBe(1000);
    });

    it('should parse enabled as true', () => {
      element.setAttribute('data-blur-reveal', 'true');
      const result = parseDataAttributes(element);
      expect(result.enabled).toBe(true);
    });

    it('should parse enabled as false', () => {
      element.setAttribute('data-blur-reveal', 'false');
      const result = parseDataAttributes(element);
      expect(result.enabled).toBe(false);
    });

    it('should handle case-insensitive false', () => {
      element.setAttribute('data-blur-reveal', 'FALSE');
      const result = parseDataAttributes(element);
      expect(result.enabled).toBe(false);
    });

    it('should treat any non-false value as true', () => {
      element.setAttribute('data-blur-reveal', 'yes');
      const result = parseDataAttributes(element);
      expect(result.enabled).toBe(true);
    });

    it('should ignore invalid numeric values', () => {
      element.setAttribute('data-blur-intensity', 'invalid');
      const result = parseDataAttributes(element);
      expect(result.blurIntensity).toBeUndefined();
    });

    it('should parse float values', () => {
      element.setAttribute('data-blur-intensity', '8.5');
      const result = parseDataAttributes(element);
      expect(result.blurIntensity).toBe(8.5);
    });

    it('should parse multiple attributes', () => {
      element.setAttribute('data-blur-intensity', '10');
      element.setAttribute('data-reveal-radius', '40');
      element.setAttribute('data-fade-delay', '750');
      element.setAttribute('data-blur-reveal', 'true');

      const result = parseDataAttributes(element);
      expect(result.blurIntensity).toBe(10);
      expect(result.revealRadius).toBe(40);
      expect(result.fadeDelay).toBe(750);
      expect(result.enabled).toBe(true);
    });
  });
});
