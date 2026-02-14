import { ref, onMounted, onBeforeUnmount, type Ref } from 'vue';
import { BlurRevealInput, type BlurRevealInputOptions } from 'blur-reveal-input';

/**
 * Vue composable for blur-reveal-input
 *
 * Usage:
 *   const { inputRef } = useBlurReveal();
 *   <input ref="inputRef" type="password" />
 */
export function useBlurReveal(options?: BlurRevealInputOptions) {
  const inputRef: Ref<HTMLInputElement | null> = ref(null);
  let instance: BlurRevealInput | null = null;

  onMounted(() => {
    if (inputRef.value) {
      instance = new BlurRevealInput(inputRef.value, options);
    }
  });

  onBeforeUnmount(() => {
    instance?.destroy();
    instance = null;
  });

  return { inputRef };
}
