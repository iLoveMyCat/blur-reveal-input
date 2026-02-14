import { test, expect, devices } from '@playwright/test';

// Use mobile device emulation
test.use({ ...devices['iPhone 13'] });

test.describe('Mobile Touch Reveal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tests/fixtures/test-page.html');
  });

  test('should blur password input by default on mobile', async ({ page }) => {
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

  test('should reveal characters on touch', async ({ page }) => {
    const input = page.locator('#password-input');
    await input.fill('testpass');

    const container = page.locator('.blur-reveal-container').first();
    const boundingBox = await container.boundingBox();

    if (!boundingBox) {
      throw new Error('Container not found');
    }

    // Tap on the container
    await page.touchscreen.tap(
      boundingBox.x + boundingBox.width / 2,
      boundingBox.y + boundingBox.height / 2
    );

    // Container should have active class
    await expect(container).toHaveClass(/blur-reveal-active/);
  });

  test('should follow touch drag position', async ({ page }) => {
    const input = page.locator('#password-input');
    await input.fill('testpassword');

    const container = page.locator('.blur-reveal-container').first();
    const boundingBox = await container.boundingBox();

    if (!boundingBox) {
      throw new Error('Container not found');
    }

    const startX = boundingBox.x + 20;
    const endX = boundingBox.x + boundingBox.width - 20;
    const y = boundingBox.y + boundingBox.height / 2;

    // Simulate touch drag using page.evaluate for direct touch events
    await page.evaluate(
      ({ startX, endX, y }) => {
        const container = document.querySelector('.blur-reveal-container');
        if (!container) return;

        // Create touch start
        const startTouch = new Touch({
          identifier: 0,
          target: container,
          clientX: startX,
          clientY: y,
        });
        container.dispatchEvent(
          new TouchEvent('touchstart', {
            touches: [startTouch],
            bubbles: true,
          })
        );

        // Create touch move
        const moveTouch = new Touch({
          identifier: 0,
          target: container,
          clientX: endX,
          clientY: y,
        });
        container.dispatchEvent(
          new TouchEvent('touchmove', {
            touches: [moveTouch],
            bubbles: true,
          })
        );
      },
      { startX, endX, y }
    );

    // Check that CSS variables are updated
    const revealX = await container.evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--blur-reveal-x')
    );
    expect(revealX).not.toBe('-9999px');
  });

  test('should fade back after touch ends', async ({ page }) => {
    const input = page.locator('#password-input');
    await input.fill('testpass');

    const container = page.locator('.blur-reveal-container').first();
    const boundingBox = await container.boundingBox();

    if (!boundingBox) {
      throw new Error('Container not found');
    }

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;

    // Simulate touch start and end
    await page.evaluate(
      ({ x, y }) => {
        const container = document.querySelector('.blur-reveal-container');
        if (!container) return;

        const touch = new Touch({
          identifier: 0,
          target: container,
          clientX: x,
          clientY: y,
        });

        container.dispatchEvent(
          new TouchEvent('touchstart', { touches: [touch], bubbles: true })
        );
        container.dispatchEvent(
          new TouchEvent('touchend', { touches: [], bubbles: true })
        );
      },
      { x, y }
    );

    // Should still be active immediately after touch end
    await expect(container).toHaveClass(/blur-reveal-active/);

    // Wait for fade delay (500ms) + fade duration (300ms) + buffer
    await page.waitForTimeout(1000);

    // Should be inactive after fade
    await expect(container).not.toHaveClass(/blur-reveal-active/);
  });

  test('should cancel fade if touch restarts', async ({ page }) => {
    const input = page.locator('#password-input');
    await input.fill('testpass');

    const container = page.locator('.blur-reveal-container').first();
    const boundingBox = await container.boundingBox();

    if (!boundingBox) {
      throw new Error('Container not found');
    }

    const x = boundingBox.x + boundingBox.width / 2;
    const y = boundingBox.y + boundingBox.height / 2;

    // Start touch, end, wait partial fade, touch again
    await page.evaluate(
      ({ x, y }) => {
        const container = document.querySelector('.blur-reveal-container');
        if (!container) return;

        const touch = new Touch({
          identifier: 0,
          target: container,
          clientX: x,
          clientY: y,
        });

        container.dispatchEvent(
          new TouchEvent('touchstart', { touches: [touch], bubbles: true })
        );
        container.dispatchEvent(
          new TouchEvent('touchend', { touches: [], bubbles: true })
        );
      },
      { x, y }
    );

    // Wait partial fade delay
    await page.waitForTimeout(250);

    // Touch again
    await page.evaluate(
      ({ x, y }) => {
        const container = document.querySelector('.blur-reveal-container');
        if (!container) return;

        const touch = new Touch({
          identifier: 0,
          target: container,
          clientX: x,
          clientY: y,
        });

        container.dispatchEvent(
          new TouchEvent('touchstart', { touches: [touch], bubbles: true })
        );
      },
      { x, y }
    );

    // Wait original fade time
    await page.waitForTimeout(600);

    // Should still be active because new touch cancelled fade
    await expect(container).toHaveClass(/blur-reveal-active/);
  });

  test('should use larger reveal radius on mobile', async ({ page }) => {
    const input = page.locator('#password-input');
    await input.fill('testpass');

    const container = page.locator('.blur-reveal-container').first();

    // Mobile should have 40px radius by default (vs 30px desktop)
    const radius = await container.evaluate((el) =>
      getComputedStyle(el).getPropertyValue('--blur-reveal-radius')
    );
    expect(radius.trim()).toBe('40px');
  });

  test('should work with multi-touch (use first touch only)', async ({
    page,
  }) => {
    const input = page.locator('#password-input');
    await input.fill('testpass');

    const container = page.locator('.blur-reveal-container').first();
    const boundingBox = await container.boundingBox();

    if (!boundingBox) {
      throw new Error('Container not found');
    }

    // Simulate multi-touch
    await page.evaluate(
      ({ boundingBox }) => {
        const container = document.querySelector('.blur-reveal-container');
        if (!container) return;

        const touch1 = new Touch({
          identifier: 0,
          target: container,
          clientX: boundingBox.x + 50,
          clientY: boundingBox.y + boundingBox.height / 2,
        });
        const touch2 = new Touch({
          identifier: 1,
          target: container,
          clientX: boundingBox.x + 150,
          clientY: boundingBox.y + boundingBox.height / 2,
        });

        container.dispatchEvent(
          new TouchEvent('touchstart', {
            touches: [touch1, touch2],
            bubbles: true,
          })
        );
      },
      { boundingBox }
    );

    // Should be active with first touch position
    await expect(container).toHaveClass(/blur-reveal-active/);
  });

  test('should dispatch custom events', async ({ page }) => {
    const input = page.locator('#password-input');
    await input.fill('testpass');

    // Listen for events
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
    const boundingBox = await container.boundingBox();

    if (!boundingBox) {
      throw new Error('Container not found');
    }

    // Touch and release
    await page.evaluate(
      ({ boundingBox }) => {
        const container = document.querySelector('.blur-reveal-container');
        if (!container) return;

        const touch = new Touch({
          identifier: 0,
          target: container,
          clientX: boundingBox.x + boundingBox.width / 2,
          clientY: boundingBox.y + boundingBox.height / 2,
        });

        container.dispatchEvent(
          new TouchEvent('touchstart', { touches: [touch], bubbles: true })
        );
        container.dispatchEvent(
          new TouchEvent('touchend', { touches: [], bubbles: true })
        );
      },
      { boundingBox }
    );

    // Wait for fade
    await page.waitForTimeout(1000);

    const receivedEvents = await page.evaluate(() => (window as any).__events);
    expect(receivedEvents).toContain('reveal');
    expect(receivedEvents).toContain('hide');
  });

  test('should prevent scrolling during touch reveal', async ({ page }) => {
    const input = page.locator('#password-input');
    await input.fill('testpass');

    const container = page.locator('.blur-reveal-container').first();
    const boundingBox = await container.boundingBox();

    if (!boundingBox) {
      throw new Error('Container not found');
    }

    // Check that touchmove default is prevented
    const prevented = await page.evaluate(({ boundingBox }) => {
      const container = document.querySelector('.blur-reveal-container');
      if (!container) return false;

      let wasDefaultPrevented = false;

      const handler = (e: Event) => {
        wasDefaultPrevented = e.defaultPrevented;
      };

      container.addEventListener('touchmove', handler);

      const touch = new Touch({
        identifier: 0,
        target: container,
        clientX: boundingBox.x + boundingBox.width / 2,
        clientY: boundingBox.y + boundingBox.height / 2,
      });

      container.dispatchEvent(
        new TouchEvent('touchstart', { touches: [touch], bubbles: true })
      );

      const moveEvent = new TouchEvent('touchmove', {
        touches: [touch],
        bubbles: true,
        cancelable: true,
      });
      container.dispatchEvent(moveEvent);

      container.removeEventListener('touchmove', handler);

      return moveEvent.defaultPrevented;
    }, { boundingBox });

    expect(prevented).toBe(true);
  });
});
