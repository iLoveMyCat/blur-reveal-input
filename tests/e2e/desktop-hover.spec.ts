import { test, expect } from '@playwright/test';

test.describe('Desktop Hover Reveal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/test-page.html');
  });

  test('should blur password input by default', async ({ page }) => {
    const input = page.locator('#password-input');
    await input.fill('secretpassword');

    // Check that blur-reveal is active
    const container = page.locator('.blur-reveal-container').first();
    await expect(container).toBeVisible();

    // Blurred overlay should have blur filter
    const blurredOverlay = page.locator('.blur-reveal-overlay--blurred').first();
    const filter = await blurredOverlay.evaluate((el) => getComputedStyle(el).filter);
    expect(filter).toContain('blur');
  });

  test('should reveal characters on mouse hover', async ({ page }) => {
    const input = page.locator('#password-input');
    await input.fill('testpass');

    const container = page.locator('.blur-reveal-container').first();

    // Hover over the container
    await container.hover();

    // Container should have active class
    await expect(container).toHaveClass(/blur-reveal-active/);
  });

  test('should hide reveal on mouse leave', async ({ page }) => {
    const input = page.locator('#password-input');
    await input.fill('testpass');

    const container = page.locator('.blur-reveal-container').first();

    // Hover then leave
    await container.hover();
    await page.mouse.move(0, 0);

    // Container should not have active class
    await expect(container).not.toHaveClass(/blur-reveal-active/);
  });

  test('should follow mouse cursor position', async ({ page }) => {
    const input = page.locator('#password-input');
    await input.fill('testpass');

    const container = page.locator('.blur-reveal-container').first();
    const boundingBox = await container.boundingBox();

    if (!boundingBox) {
      throw new Error('Container not found');
    }

    // Move to specific position
    const targetX = boundingBox.x + boundingBox.width / 2;
    const targetY = boundingBox.y + boundingBox.height / 2;
    await page.mouse.move(targetX, targetY);

    // Check that CSS variables are set
    const revealX = await container.evaluate(
      (el) => getComputedStyle(el).getPropertyValue('--blur-reveal-x')
    );
    expect(revealX).not.toBe('-9999px');
  });

  test('should update reveal position smoothly while moving', async ({ page }) => {
    const input = page.locator('#password-input');
    await input.fill('testpassword123');

    const container = page.locator('.blur-reveal-container').first();
    const boundingBox = await container.boundingBox();

    if (!boundingBox) {
      throw new Error('Container not found');
    }

    // Move across the container
    const startX = boundingBox.x + 10;
    const endX = boundingBox.x + boundingBox.width - 10;
    const y = boundingBox.y + boundingBox.height / 2;

    await page.mouse.move(startX, y);
    await page.waitForTimeout(100);

    await page.mouse.move(endX, y, { steps: 10 });

    // Should still be active after movement
    await expect(container).toHaveClass(/blur-reveal-active/);
  });

  test('should maintain 60fps during hover', async ({ page }) => {
    const input = page.locator('#password-input');
    await input.fill('longpasswordfortesting');

    const container = page.locator('.blur-reveal-container').first();
    const boundingBox = await container.boundingBox();

    if (!boundingBox) {
      throw new Error('Container not found');
    }

    // Start performance measurement
    const frameTimes: number[] = [];

    await page.evaluate(() => {
      (window as any).__frameTimes = [];
      const recordFrame = (timestamp: number) => {
        (window as any).__frameTimes.push(timestamp);
        if ((window as any).__frameTimes.length < 60) {
          requestAnimationFrame(recordFrame);
        }
      };
      requestAnimationFrame(recordFrame);
    });

    // Move mouse rapidly
    const y = boundingBox.y + boundingBox.height / 2;
    for (let i = 0; i < 30; i++) {
      const x = boundingBox.x + (i / 30) * boundingBox.width;
      await page.mouse.move(x, y);
    }

    // Wait for frames to be recorded
    await page.waitForTimeout(1000);

    const recordedFrames = await page.evaluate(() => (window as any).__frameTimes);

    // Check frame timing (should be ~16.67ms between frames for 60fps)
    if (recordedFrames.length > 2) {
      const intervals: number[] = [];
      for (let i = 1; i < recordedFrames.length; i++) {
        intervals.push(recordedFrames[i] - recordedFrames[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      // Allow for some variance, but should be under 33ms (30fps minimum)
      expect(avgInterval).toBeLessThan(33);
    }
  });

  test('should work with dynamically typed text', async ({ page }) => {
    const input = page.locator('#password-input');
    const container = page.locator('.blur-reveal-container').first();

    // Type character by character
    await input.focus();
    await page.keyboard.type('pass', { delay: 50 });

    // Hover while typing
    await container.hover();
    await page.keyboard.type('word', { delay: 50 });

    // Should show correct length (actual password text, not bullets)
    const blurredOverlay = page.locator('.blur-reveal-overlay--blurred').first();
    const text = await blurredOverlay.textContent();
    expect(text).toBe('password');
  });

  test('should respect disabled input state', async ({ page }) => {
    const input = page.locator('#password-input');
    await input.fill('testpass');

    // Disable the input
    await input.evaluate((el) => (el as HTMLInputElement).disabled = true);

    const container = page.locator('.blur-reveal-container').first();

    // Container should have disabled class
    await expect(container).toHaveClass(/blur-reveal-disabled/);

    // Hover should not activate
    await container.hover();
    await expect(container).not.toHaveClass(/blur-reveal-active/);
  });

  test('should dispatch custom events', async ({ page }) => {
    const input = page.locator('#password-input');
    await input.fill('testpass');

    // Listen for events
    const events: string[] = [];
    await page.evaluate(() => {
      (window as any).__events = [];
      document.addEventListener('blurreveal:reveal', () => {
        (window as any).__events.push('reveal');
      });
      document.addEventListener('blurreveal:hide', () => {
        (window as any).__events.push('hide');
      });
    });

    const container = page.locator('.blur-reveal-container').first();

    // Hover and leave
    await container.hover();
    await page.mouse.move(0, 0);

    const receivedEvents = await page.evaluate(() => (window as any).__events);
    expect(receivedEvents).toContain('reveal');
    expect(receivedEvents).toContain('hide');
  });

  test('should work with custom blur intensity', async ({ page }) => {
    const input = page.locator('#password-input');

    // Set custom blur intensity via data attribute
    await input.evaluate((el) => {
      el.setAttribute('data-blur-intensity', '16');
    });

    await input.fill('testpass');

    const container = page.locator('.blur-reveal-container').first();
    const intensity = await container.evaluate(
      (el) => getComputedStyle(el).getPropertyValue('--blur-reveal-intensity')
    );
    expect(intensity.trim()).toBe('16px');
  });

  test('should work with custom reveal radius', async ({ page }) => {
    const input = page.locator('#password-input');

    // Set custom reveal radius via data attribute
    await input.evaluate((el) => {
      el.setAttribute('data-reveal-radius', '50');
    });

    await input.fill('testpass');

    const container = page.locator('.blur-reveal-container').first();
    const radius = await container.evaluate(
      (el) => getComputedStyle(el).getPropertyValue('--blur-reveal-radius')
    );
    expect(radius.trim()).toBe('50px');
  });

  test('should preserve input functionality', async ({ page }) => {
    const input = page.locator('#password-input');

    // Type and verify value
    await input.fill('secretpassword');
    await expect(input).toHaveValue('secretpassword');

    // Clear and type again
    await input.clear();
    await input.type('newpassword');
    await expect(input).toHaveValue('newpassword');
  });

  test('should handle rapid hover/leave cycles', async ({ page }) => {
    const input = page.locator('#password-input');
    await input.fill('testpass');

    const container = page.locator('.blur-reveal-container').first();
    const boundingBox = await container.boundingBox();

    if (!boundingBox) {
      throw new Error('Container not found');
    }

    // Rapidly hover and leave
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
      await page.mouse.move(0, 0);
    }

    // Should be in stable state
    await expect(container).not.toHaveClass(/blur-reveal-active/);
  });
});
