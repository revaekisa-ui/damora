/**
 * Tests for src/init.ts startup behavior.
 *
 * Verifies that the locally cached mobile UI scale is applied synchronously
 * (before any auth round-trip) and that the global preference bootstrap is
 * started at import time and exposed for main.tsx to await before rendering.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---- Top-level mocks (hoisted by Vitest) ----

const applyMobileUiScaleMock = vi.fn((v: number) => v);
const readMobileUiScaleMock = vi.fn(() => 1.0);
const initializeMobileUiScaleMock = vi.fn();

vi.mock('../utils/mobileUiScale', () => ({
  applyMobileUiScale: applyMobileUiScaleMock,
  readMobileUiScale: readMobileUiScaleMock,
}));

vi.mock('../services/mobileUiScale', () => ({
  initializeMobileUiScale: initializeMobileUiScaleMock,
}));

describe('init.ts startup sequence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    readMobileUiScaleMock.mockReturnValue(1.0);
    initializeMobileUiScaleMock.mockReturnValue(Promise.resolve());
  });

  it('applies the locally cached scale synchronously (before any auth call)', async () => {
    readMobileUiScaleMock.mockReturnValue(0.85);

    await import('../init');

    // readMobileUiScale must have been called and its value forwarded to applyMobileUiScale
    expect(readMobileUiScaleMock).toHaveBeenCalled();
    expect(applyMobileUiScaleMock).toHaveBeenCalledWith(0.85);
  });

  it('starts the global preference bootstrap at import time', async () => {
    await import('../init');

    expect(initializeMobileUiScaleMock).toHaveBeenCalledTimes(1);
  });

  it('exports mobileUiScaleReady that resolves once the global bootstrap settles', async () => {
    let release: (() => void) | undefined;
    initializeMobileUiScaleMock.mockReturnValue(
      new Promise<void>(resolve => {
        release = resolve;
      }),
    );

    const module = await import('../init');

    let ready = false;
    void module.mobileUiScaleReady.then(() => {
      ready = true;
    });

    await Promise.resolve();
    expect(ready).toBe(false);

    release?.();
    await module.mobileUiScaleReady;
    expect(ready).toBe(true);
  });
});
