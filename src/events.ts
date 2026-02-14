/**
 * Custom event definitions and dispatch helpers for Blur Reveal Input
 */

import type { BlurRevealConfig } from './config';

/**
 * Event names emitted by BlurRevealInput
 */
export const EVENTS = {
  /** Fired when blur reveal is initialized on an input */
  INIT: 'blurreveal:init',

  /** Fired when characters are being revealed */
  REVEAL: 'blurreveal:reveal',

  /** Fired when reveal ends and blur returns */
  HIDE: 'blurreveal:hide',

  /** Fired when blur reveal is removed from an input */
  DESTROY: 'blurreveal:destroy',
} as const;

/**
 * Event type union
 */
export type BlurRevealEventType = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * Base event detail shared by all events
 */
export interface BlurRevealEventDetail {
  /** The input element this event relates to */
  input: HTMLInputElement;

  /** Current configuration */
  config: BlurRevealConfig;
}

/**
 * Event detail for reveal events, includes position information
 */
export interface BlurRevealRevealEventDetail extends BlurRevealEventDetail {
  /** X coordinate of reveal center (relative to input) */
  x: number;

  /** Y coordinate of reveal center (relative to input) */
  y: number;

  /** Current reveal radius */
  radius: number;
}

/**
 * Type-safe custom event types
 */
export type BlurRevealInitEvent = CustomEvent<BlurRevealEventDetail>;
export type BlurRevealRevealEvent = CustomEvent<BlurRevealRevealEventDetail>;
export type BlurRevealHideEvent = CustomEvent<BlurRevealEventDetail>;
export type BlurRevealDestroyEvent = CustomEvent<BlurRevealEventDetail>;

/**
 * Union of all blur reveal event types
 */
export type BlurRevealEvent =
  | BlurRevealInitEvent
  | BlurRevealRevealEvent
  | BlurRevealHideEvent
  | BlurRevealDestroyEvent;

/**
 * Dispatch a custom event on an element
 */
export function dispatch<T extends BlurRevealEventDetail>(
  element: HTMLElement,
  eventName: BlurRevealEventType,
  detail: T
): boolean {
  const event = new CustomEvent(eventName, {
    bubbles: true,
    cancelable: true,
    detail,
  });

  return element.dispatchEvent(event);
}

/**
 * Dispatch init event
 */
export function dispatchInit(
  element: HTMLInputElement,
  config: BlurRevealConfig
): boolean {
  return dispatch(element, EVENTS.INIT, { input: element, config });
}

/**
 * Dispatch reveal event
 */
export function dispatchReveal(
  element: HTMLInputElement,
  config: BlurRevealConfig,
  x: number,
  y: number,
  radius: number
): boolean {
  return dispatch<BlurRevealRevealEventDetail>(element, EVENTS.REVEAL, {
    input: element,
    config,
    x,
    y,
    radius,
  });
}

/**
 * Dispatch hide event
 */
export function dispatchHide(
  element: HTMLInputElement,
  config: BlurRevealConfig
): boolean {
  return dispatch(element, EVENTS.HIDE, { input: element, config });
}

/**
 * Dispatch destroy event
 */
export function dispatchDestroy(
  element: HTMLInputElement,
  config: BlurRevealConfig
): boolean {
  return dispatch(element, EVENTS.DESTROY, { input: element, config });
}

/**
 * Type guard to check if an event is a BlurReveal event
 */
export function isBlurRevealEvent(event: Event): event is BlurRevealEvent {
  return (
    event.type === EVENTS.INIT ||
    event.type === EVENTS.REVEAL ||
    event.type === EVENTS.HIDE ||
    event.type === EVENTS.DESTROY
  );
}

/**
 * Type guard to check if event is a reveal event
 */
export function isRevealEvent(event: Event): event is BlurRevealRevealEvent {
  return event.type === EVENTS.REVEAL;
}

// Extend global event map for TypeScript support
declare global {
  interface HTMLElementEventMap {
    [EVENTS.INIT]: BlurRevealInitEvent;
    [EVENTS.REVEAL]: BlurRevealRevealEvent;
    [EVENTS.HIDE]: BlurRevealHideEvent;
    [EVENTS.DESTROY]: BlurRevealDestroyEvent;
  }
}
