import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { forceRemoveStyles, resetInstanceCount } from '../../src/styles';

describe('auto-apply', () => {
  beforeEach(() => {
    // Reset styles
    forceRemoveStyles();
    resetInstanceCount();

    // Reset document
    document.body.innerHTML = '';
  });

  afterEach(() => {
    forceRemoveStyles();
    resetInstanceCount();
  });

  describe('initialization', () => {
    it('should apply to existing password inputs on load', async () => {
      // Create password input before loading module
      const input = document.createElement('input');
      input.type = 'password';
      input.id = 'test-password';
      document.body.appendChild(input);

      // Import and trigger initialization
      const { initAutoApply } = await import('../../src/auto-apply');
      initAutoApply();

      // Input should be wrapped in container
      expect(input.parentElement?.classList.contains('blur-reveal-container')).toBe(
        true
      );
    });

    it('should apply to multiple password inputs', async () => {
      const input1 = document.createElement('input');
      input1.type = 'password';
      document.body.appendChild(input1);

      const input2 = document.createElement('input');
      input2.type = 'password';
      document.body.appendChild(input2);

      const { initAutoApply } = await import('../../src/auto-apply');
      initAutoApply();

      expect(input1.parentElement?.classList.contains('blur-reveal-container')).toBe(
        true
      );
      expect(input2.parentElement?.classList.contains('blur-reveal-container')).toBe(
        true
      );
    });

    it('should skip inputs with data-blur-reveal="false"', async () => {
      const input = document.createElement('input');
      input.type = 'password';
      input.setAttribute('data-blur-reveal', 'false');
      document.body.appendChild(input);

      const { initAutoApply } = await import('../../src/auto-apply');
      initAutoApply();

      expect(input.parentElement?.classList.contains('blur-reveal-container')).toBe(
        false
      );
    });

    it('should skip text inputs', async () => {
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);

      const { initAutoApply } = await import('../../src/auto-apply');
      initAutoApply();

      expect(input.parentElement?.classList.contains('blur-reveal-container')).toBe(
        false
      );
    });
  });

  describe('data attribute configuration', () => {
    it('should apply custom blur intensity from data attribute', async () => {
      const input = document.createElement('input');
      input.type = 'password';
      input.setAttribute('data-blur-intensity', '16');
      document.body.appendChild(input);

      const { initAutoApply } = await import('../../src/auto-apply');
      initAutoApply();

      const container = input.parentElement as HTMLElement;
      const intensity = container.style.getPropertyValue('--blur-reveal-intensity');
      expect(intensity).toBe('16px');
    });

    it('should apply custom reveal radius from data attribute', async () => {
      const input = document.createElement('input');
      input.type = 'password';
      input.setAttribute('data-reveal-radius', '50');
      document.body.appendChild(input);

      const { initAutoApply } = await import('../../src/auto-apply');
      initAutoApply();

      const container = input.parentElement as HTMLElement;
      const radius = container.style.getPropertyValue('--blur-reveal-radius');
      expect(radius).toBe('50px');
    });
  });

  describe('MutationObserver for dynamic inputs', () => {
    it('should apply to dynamically added password inputs', async () => {
      const { initAutoApply, observeDOM } = await import('../../src/auto-apply');
      initAutoApply();
      observeDOM();

      // Add input dynamically
      const input = document.createElement('input');
      input.type = 'password';
      document.body.appendChild(input);

      // Wait for MutationObserver
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(input.parentElement?.classList.contains('blur-reveal-container')).toBe(
        true
      );
    });

    it('should apply to inputs added to nested elements', async () => {
      const { initAutoApply, observeDOM } = await import('../../src/auto-apply');
      initAutoApply();
      observeDOM();

      // Add container then input
      const container = document.createElement('div');
      document.body.appendChild(container);

      const input = document.createElement('input');
      input.type = 'password';
      container.appendChild(input);

      // Wait for MutationObserver
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(input.parentElement?.classList.contains('blur-reveal-container')).toBe(
        true
      );
    });

    it('should not double-apply to already enhanced inputs', async () => {
      const { initAutoApply, observeDOM } = await import('../../src/auto-apply');
      initAutoApply();
      observeDOM();

      // Add input that's already wrapped
      const input = document.createElement('input');
      input.type = 'password';
      document.body.appendChild(input);

      // Wait for initial application
      await new Promise((resolve) => setTimeout(resolve, 50));

      const containerBefore = input.parentElement;

      // Trigger another mutation
      const div = document.createElement('div');
      document.body.appendChild(div);

      // Wait again
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should still have same container (not double-wrapped)
      expect(input.parentElement).toBe(containerBefore);
    });
  });

  describe('cleanup', () => {
    it('should provide cleanup function', async () => {
      const input = document.createElement('input');
      input.type = 'password';
      document.body.appendChild(input);

      const { initAutoApply, cleanup } = await import('../../src/auto-apply');
      initAutoApply();

      expect(input.parentElement?.classList.contains('blur-reveal-container')).toBe(
        true
      );

      cleanup();

      expect(input.parentElement?.classList.contains('blur-reveal-container')).toBe(
        false
      );
    });
  });
});
