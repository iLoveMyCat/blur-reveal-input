import { useEffect, useRef } from 'react';
import { BlurRevealInput, type BlurRevealInputOptions } from 'blur-reveal-input';

/**
 * React hook for blur-reveal-input
 *
 * Usage:
 *   const ref = useBlurReveal<HTMLInputElement>();
 *   return <input ref={ref} type="password" />;
 */
export function useBlurReveal<T extends HTMLInputElement>(
  options?: BlurRevealInputOptions
) {
  const ref = useRef<T>(null);
  const instanceRef = useRef<BlurRevealInput | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    instanceRef.current = new BlurRevealInput(ref.current, options);

    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, []);

  return ref;
}
