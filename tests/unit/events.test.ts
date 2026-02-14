import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  EVENTS,
  dispatch,
  dispatchInit,
  dispatchReveal,
  dispatchHide,
  dispatchDestroy,
  isBlurRevealEvent,
  isRevealEvent,
  type BlurRevealEventDetail,
  type BlurRevealRevealEventDetail,
} from '../../src/events';
import { DEFAULT_CONFIG } from '../../src/config';

describe('events', () => {
  describe('EVENTS', () => {
    it('should have correct event names', () => {
      expect(EVENTS.INIT).toBe('blurreveal:init');
      expect(EVENTS.REVEAL).toBe('blurreveal:reveal');
      expect(EVENTS.HIDE).toBe('blurreveal:hide');
      expect(EVENTS.DESTROY).toBe('blurreveal:destroy');
    });
  });

  describe('dispatch', () => {
    let element: HTMLInputElement;

    beforeEach(() => {
      element = document.createElement('input');
      element.type = 'password';
      document.body.appendChild(element);
    });

    it('should dispatch custom event with correct type', () => {
      const handler = vi.fn();
      element.addEventListener(EVENTS.INIT, handler);

      const detail: BlurRevealEventDetail = {
        input: element,
        config: DEFAULT_CONFIG,
      };

      dispatch(element, EVENTS.INIT, detail);

      expect(handler).toHaveBeenCalledOnce();
      const event = handler.mock.calls[0]?.[0] as CustomEvent<BlurRevealEventDetail>;
      expect(event.type).toBe(EVENTS.INIT);
    });

    it('should dispatch event with correct detail', () => {
      const handler = vi.fn();
      element.addEventListener(EVENTS.INIT, handler);

      const detail: BlurRevealEventDetail = {
        input: element,
        config: DEFAULT_CONFIG,
      };

      dispatch(element, EVENTS.INIT, detail);

      const event = handler.mock.calls[0]?.[0] as CustomEvent<BlurRevealEventDetail>;
      expect(event.detail.input).toBe(element);
      expect(event.detail.config).toBe(DEFAULT_CONFIG);
    });

    it('should bubble by default', () => {
      const parentHandler = vi.fn();
      document.body.addEventListener(EVENTS.INIT, parentHandler);

      dispatch(element, EVENTS.INIT, { input: element, config: DEFAULT_CONFIG });

      expect(parentHandler).toHaveBeenCalledOnce();
    });

    it('should be cancelable', () => {
      element.addEventListener(EVENTS.INIT, (e) => {
        e.preventDefault();
      });

      const result = dispatch(element, EVENTS.INIT, {
        input: element,
        config: DEFAULT_CONFIG,
      });

      expect(result).toBe(false);
    });

    it('should return true when not prevented', () => {
      const result = dispatch(element, EVENTS.INIT, {
        input: element,
        config: DEFAULT_CONFIG,
      });

      expect(result).toBe(true);
    });
  });

  describe('dispatchInit', () => {
    let element: HTMLInputElement;

    beforeEach(() => {
      element = document.createElement('input');
      element.type = 'password';
    });

    it('should dispatch init event', () => {
      const handler = vi.fn();
      element.addEventListener(EVENTS.INIT, handler);

      dispatchInit(element, DEFAULT_CONFIG);

      expect(handler).toHaveBeenCalledOnce();
    });

    it('should include input and config in detail', () => {
      const handler = vi.fn();
      element.addEventListener(EVENTS.INIT, handler);

      dispatchInit(element, DEFAULT_CONFIG);

      const event = handler.mock.calls[0]?.[0] as CustomEvent<BlurRevealEventDetail>;
      expect(event.detail.input).toBe(element);
      expect(event.detail.config).toBe(DEFAULT_CONFIG);
    });
  });

  describe('dispatchReveal', () => {
    let element: HTMLInputElement;

    beforeEach(() => {
      element = document.createElement('input');
      element.type = 'password';
    });

    it('should dispatch reveal event', () => {
      const handler = vi.fn();
      element.addEventListener(EVENTS.REVEAL, handler);

      dispatchReveal(element, DEFAULT_CONFIG, 100, 50, 30);

      expect(handler).toHaveBeenCalledOnce();
    });

    it('should include position in detail', () => {
      const handler = vi.fn();
      element.addEventListener(EVENTS.REVEAL, handler);

      dispatchReveal(element, DEFAULT_CONFIG, 100, 50, 30);

      const event = handler.mock.calls[0]?.[0] as CustomEvent<BlurRevealRevealEventDetail>;
      expect(event.detail.x).toBe(100);
      expect(event.detail.y).toBe(50);
      expect(event.detail.radius).toBe(30);
    });
  });

  describe('dispatchHide', () => {
    let element: HTMLInputElement;

    beforeEach(() => {
      element = document.createElement('input');
      element.type = 'password';
    });

    it('should dispatch hide event', () => {
      const handler = vi.fn();
      element.addEventListener(EVENTS.HIDE, handler);

      dispatchHide(element, DEFAULT_CONFIG);

      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe('dispatchDestroy', () => {
    let element: HTMLInputElement;

    beforeEach(() => {
      element = document.createElement('input');
      element.type = 'password';
    });

    it('should dispatch destroy event', () => {
      const handler = vi.fn();
      element.addEventListener(EVENTS.DESTROY, handler);

      dispatchDestroy(element, DEFAULT_CONFIG);

      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe('isBlurRevealEvent', () => {
    it('should return true for init event', () => {
      const event = new CustomEvent(EVENTS.INIT);
      expect(isBlurRevealEvent(event)).toBe(true);
    });

    it('should return true for reveal event', () => {
      const event = new CustomEvent(EVENTS.REVEAL);
      expect(isBlurRevealEvent(event)).toBe(true);
    });

    it('should return true for hide event', () => {
      const event = new CustomEvent(EVENTS.HIDE);
      expect(isBlurRevealEvent(event)).toBe(true);
    });

    it('should return true for destroy event', () => {
      const event = new CustomEvent(EVENTS.DESTROY);
      expect(isBlurRevealEvent(event)).toBe(true);
    });

    it('should return false for other events', () => {
      const event = new Event('click');
      expect(isBlurRevealEvent(event)).toBe(false);
    });
  });

  describe('isRevealEvent', () => {
    it('should return true for reveal event', () => {
      const event = new CustomEvent(EVENTS.REVEAL);
      expect(isRevealEvent(event)).toBe(true);
    });

    it('should return false for other blur reveal events', () => {
      const initEvent = new CustomEvent(EVENTS.INIT);
      const hideEvent = new CustomEvent(EVENTS.HIDE);
      const destroyEvent = new CustomEvent(EVENTS.DESTROY);

      expect(isRevealEvent(initEvent)).toBe(false);
      expect(isRevealEvent(hideEvent)).toBe(false);
      expect(isRevealEvent(destroyEvent)).toBe(false);
    });

    it('should return false for non-blur-reveal events', () => {
      const event = new Event('mousemove');
      expect(isRevealEvent(event)).toBe(false);
    });
  });
});
