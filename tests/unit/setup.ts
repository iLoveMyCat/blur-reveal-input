/**
 * Vitest setup file
 * Runs before all tests to configure the test environment
 */

import { vi } from 'vitest';

// Mock requestAnimationFrame for JSDOM
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  return setTimeout(() => callback(performance.now()), 16) as unknown as number;
});

global.cancelAnimationFrame = vi.fn((id: number) => {
  clearTimeout(id);
});

// Mock matchMedia for prefers-reduced-motion tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock getComputedStyle for direction detection
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = vi.fn((element: Element) => {
  const styles = originalGetComputedStyle(element);
  return {
    ...styles,
    direction: element.getAttribute('dir') ?? 'ltr',
    getPropertyValue: (prop: string) => {
      if (prop === 'direction') {
        return element.getAttribute('dir') ?? 'ltr';
      }
      return styles.getPropertyValue(prop);
    },
  } as CSSStyleDeclaration;
});

// Mock Touch API for JSDOM (not available by default)
class MockTouch implements Touch {
  readonly identifier: number;
  readonly target: EventTarget;
  readonly clientX: number;
  readonly clientY: number;
  readonly screenX: number;
  readonly screenY: number;
  readonly pageX: number;
  readonly pageY: number;
  readonly radiusX: number;
  readonly radiusY: number;
  readonly rotationAngle: number;
  readonly force: number;

  constructor(init: TouchInit) {
    this.identifier = init.identifier;
    this.target = init.target;
    this.clientX = init.clientX ?? 0;
    this.clientY = init.clientY ?? 0;
    this.screenX = init.screenX ?? 0;
    this.screenY = init.screenY ?? 0;
    this.pageX = init.pageX ?? 0;
    this.pageY = init.pageY ?? 0;
    this.radiusX = init.radiusX ?? 0;
    this.radiusY = init.radiusY ?? 0;
    this.rotationAngle = init.rotationAngle ?? 0;
    this.force = init.force ?? 0;
  }
}

// Add Touch to global scope
(global as any).Touch = MockTouch;

// Clean up DOM after each test
afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});
