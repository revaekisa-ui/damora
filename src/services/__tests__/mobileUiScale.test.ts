import { beforeEach, describe, expect, it, vi } from 'vitest';

// --- Mocks ---

const fromMock = vi.fn();
const getSessionMock = vi.fn();
const onAuthStateChangeMock = vi.fn();
type MobileScaleMockResult = {
  data: { mobile_ui_scale: number | null } | null;
  error: { message?: string; code?: string } | null;
};

vi.mock('../../lib/supabaseClient', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: fromMock,
    auth: { getSession: getSessionMock, onAuthStateChange: onAuthStateChangeMock },
  },
  default: {
    from: fromMock,
    auth: { getSession: getSessionMock, onAuthStateChange: onAuthStateChangeMock },
  },
}));

// Mock localStorage + window.dispatchEvent for jsdom env
const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

const STORAGE_KEY = 'venapindah.mobile-ui-scale.v1';

const VALID_SESSION = {
  session: {
    user: { id: 'user-uuid-1' },
    access_token: 'token',
  },
};

// Helper to build a chainable from() mock for .select().eq().maybeSingle()
function makeSelectChain(resolvedValue: { data: any; error: any }) {
  const eqMock = vi.fn(() => ({ maybeSingle: async () => resolvedValue }));
  return {
    eqMock,
    select: () => ({
      eq: eqMock,
    }),
  };
}

describe('loadRemoteMobileUiScale', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    dispatchEventSpy.mockClear();
    localStorage.removeItem(STORAGE_KEY);
  });

  it('returns undefined when there is no session', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });
    const { loadRemoteMobileUiScale } = await import('../mobileUiScale');
    const result = await loadRemoteMobileUiScale();
    expect(result).toBeUndefined();
  });

  it('propagates session errors so the settings UI can report a load failure', async () => {
    const sessionError = new Error('Session request failed.');
    getSessionMock.mockResolvedValue({ data: { session: null }, error: sessionError });
    const { loadRemoteMobileUiScale } = await import('../mobileUiScale');
    await expect(loadRemoteMobileUiScale()).rejects.toBe(sessionError);
  });

  it('returns the default when the profile row exists but mobile_ui_scale is NULL', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    fromMock.mockReturnValue(makeSelectChain({ data: { mobile_ui_scale: null }, error: null }));
    const { loadRemoteMobileUiScale } = await import('../mobileUiScale');
    const result = await loadRemoteMobileUiScale();
    expect(result).toBe(1);
  });

  it('returns undefined when no profile row is available yet (never falls back to the default)', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    const chain = makeSelectChain({ data: null, error: null });
    fromMock.mockReturnValue(chain);
    const { loadRemoteMobileUiScale } = await import('../mobileUiScale');
    const result = await loadRemoteMobileUiScale();
    expect(result).toBeUndefined();
    expect(chain.eqMock).toHaveBeenCalledWith('admin_user_id', 'user-uuid-1');
  });

  it('treats a PGRST116 (zero rows) error like a not-ready profile', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    fromMock.mockReturnValue(makeSelectChain({ data: null, error: { code: 'PGRST116', message: 'no rows' } }));
    const { loadRemoteMobileUiScale } = await import('../mobileUiScale');
    const result = await loadRemoteMobileUiScale();
    expect(result).toBeUndefined();
  });

  it('returns a normalized number when the column has a valid value', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    fromMock.mockReturnValue(makeSelectChain({ data: { mobile_ui_scale: 0.8 }, error: null }));
    const { loadRemoteMobileUiScale } = await import('../mobileUiScale');
    const result = await loadRemoteMobileUiScale();
    expect(result).toBe(0.8);
  });

  it('clamps an out-of-range value from the database', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    fromMock.mockReturnValue(makeSelectChain({ data: { mobile_ui_scale: 2.5 }, error: null }));
    const { loadRemoteMobileUiScale } = await import('../mobileUiScale');
    const result = await loadRemoteMobileUiScale();
    // normalizeMobileUiScale clamps to max 1.4
    expect(result).toBe(1.4);
  });
});

describe('saveRemoteMobileUiScale', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    dispatchEventSpy.mockClear();
    localStorage.removeItem(STORAGE_KEY);
  });

  it('calls update with the given scale value', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    const successfulUpdate: MobileScaleMockResult = { data: { mobile_ui_scale: 0.8 }, error: null };
    const eqMock = vi.fn((_column: string, _value: string) => ({
      select: () => ({
        maybeSingle: async (): Promise<typeof successfulUpdate> => successfulUpdate,
      }),
    }));
    const updateFn = vi.fn().mockReturnValue({
      eq: eqMock,
    });
    fromMock.mockReturnValue({ update: updateFn });
    const { saveRemoteMobileUiScale } = await import('../mobileUiScale');
    const result = await saveRemoteMobileUiScale(0.8);
    expect(updateFn).toHaveBeenCalledWith({ mobile_ui_scale: 0.8 });
    expect(eqMock).toHaveBeenCalledWith('admin_user_id', 'user-uuid-1');
    expect(result).toBe(0.8);
  });

  it('persists the default scale explicitly as 1.0', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    const defaultUpdate: MobileScaleMockResult = { data: { mobile_ui_scale: null }, error: null };
    const updateFn = vi.fn().mockReturnValue({
      eq: () => ({
        select: () => ({
          maybeSingle: async (): Promise<typeof defaultUpdate> => defaultUpdate,
        }),
      }),
    });
    fromMock.mockReturnValue({ update: updateFn });
    const { saveRemoteMobileUiScale } = await import('../mobileUiScale');
    const result = await saveRemoteMobileUiScale(1.0);
    expect(updateFn).toHaveBeenCalledWith({ mobile_ui_scale: 1 });
    expect(result).toBe(1.0);
  });

  it('rejects when there is no session instead of claiming a successful save', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });
    const { saveRemoteMobileUiScale } = await import('../mobileUiScale');
    await expect(saveRemoteMobileUiScale(0.8)).rejects.toThrow('Sesi akun Supabase tidak ditemukan.');
  });

  it('rejects when no profile row matches the authenticated account', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    const missingProfile: MobileScaleMockResult = { data: null, error: null };
    const updateFn = vi.fn().mockReturnValue({
      eq: () => ({
        select: () => ({
          maybeSingle: async (): Promise<typeof missingProfile> => missingProfile,
        }),
      }),
    });
    fromMock.mockReturnValue({ update: updateFn });
    const { saveRemoteMobileUiScale } = await import('../mobileUiScale');
    await expect(saveRemoteMobileUiScale(0.8)).rejects.toThrow('Profil akun tidak ditemukan; preferensi tidak disimpan.');
  });
});

describe('refreshMobileUiScaleForUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    dispatchEventSpy.mockClear();
    localStorage.removeItem(STORAGE_KEY);
  });

  it('applies, caches and broadcasts the remote value', async () => {
    fromMock.mockReturnValue(makeSelectChain({ data: { mobile_ui_scale: 0.75 }, error: null }));
    const { refreshMobileUiScaleForUser } = await import('../mobileUiScale');

    const result = await refreshMobileUiScaleForUser('user-uuid-1');

    expect(result).toBe(0.75);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('0.75');
    expect(document.documentElement.style.getPropertyValue('--mobile-ui-scale')).toBe('0.75');
    expect(dispatchEventSpy).toHaveBeenCalledOnce();
    const event = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe('venapindah-mobile-ui-scale-sync');
    expect(event.detail).toBe(0.75);
  });

  it('does nothing when signed out but keeps the cached value', async () => {
    localStorage.setItem(STORAGE_KEY, '0.8');
    const { refreshMobileUiScaleForUser } = await import('../mobileUiScale');

    const result = await refreshMobileUiScaleForUser(null);

    expect(result).toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('0.8');
    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });

  it('de-duplicates concurrent requests for the same account', async () => {
    fromMock.mockReturnValue(makeSelectChain({ data: { mobile_ui_scale: 0.8 }, error: null }));
    const { refreshMobileUiScaleForUser } = await import('../mobileUiScale');

    const first = refreshMobileUiScaleForUser('user-uuid-1');
    const second = refreshMobileUiScaleForUser('user-uuid-1');

    expect(fromMock).toHaveBeenCalledTimes(1);
    await expect(first).resolves.toBe(0.8);
    await expect(second).resolves.toBe(0.8);
  });

  it('never overwrites the cached value when the profile row is not ready', async () => {
    localStorage.setItem(STORAGE_KEY, '0.85');
    fromMock.mockReturnValue(makeSelectChain({ data: null, error: null }));
    const { refreshMobileUiScaleForUser } = await import('../mobileUiScale');

    const result = await refreshMobileUiScaleForUser('user-uuid-1');

    expect(result).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('0.85');
    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });

  it('never overwrites the cached value when the fetch fails', async () => {
    localStorage.setItem(STORAGE_KEY, '0.85');
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            throw new Error('Network error');
          },
        }),
      }),
    });
    const { refreshMobileUiScaleForUser } = await import('../mobileUiScale');

    await expect(refreshMobileUiScaleForUser('user-uuid-1')).rejects.toThrow('Network error');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('0.85');
    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });

  it('discards a stale response when the account signs out mid-flight', async () => {
    localStorage.setItem(STORAGE_KEY, '0.85');
    let releaseFetch: (value: { data: any; error: any }) => void = () => {};
    const deferred = new Promise<{ data: any; error: any }>(resolve => {
      releaseFetch = resolve;
    });
    fromMock.mockReturnValue({
      select: () => ({ eq: () => ({ maybeSingle: () => deferred }) }),
    });
    const { refreshMobileUiScaleForUser } = await import('../mobileUiScale');

    const pending = refreshMobileUiScaleForUser('user-uuid-1');
    refreshMobileUiScaleForUser(null);

    releaseFetch({ data: { mobile_ui_scale: 0.4 }, error: null });

    await expect(pending).resolves.toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('0.85');
    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });
});

describe('initializeMobileUiScale', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    dispatchEventSpy.mockClear();
    localStorage.removeItem(STORAGE_KEY);
    onAuthStateChangeMock.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  });

  it('applies the saved preference before resolving when a session exists at startup', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    fromMock.mockReturnValue(makeSelectChain({ data: { mobile_ui_scale: 0.8 }, error: null }));
    const { initializeMobileUiScale } = await import('../mobileUiScale');

    await initializeMobileUiScale();

    expect(localStorage.getItem(STORAGE_KEY)).toBe('0.8');
    expect(document.documentElement.style.getPropertyValue('--mobile-ui-scale')).toBe('0.8');
  });

  it('resolves without touching the cache when there is no session', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });
    const { initializeMobileUiScale } = await import('../mobileUiScale');

    await initializeMobileUiScale();

    expect(fromMock).not.toHaveBeenCalled();
    expect(dispatchEventSpy).not.toHaveBeenCalled();
  });

  it('applies the preference when the Supabase session is recovered shortly after startup', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });
    let authCallback: ((event: string, session: any) => void) | undefined;
    onAuthStateChangeMock.mockImplementation((callback: (event: string, session: any) => void) => {
      authCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    fromMock.mockReturnValue(makeSelectChain({ data: { mobile_ui_scale: 0.8 }, error: null }));
    const { initializeMobileUiScale } = await import('../mobileUiScale');

    // No session yet → the bootstrap resolves and the cache is untouched.
    await initializeMobileUiScale();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    // The session is restored a moment later.
    authCallback?.('SIGNED_IN', VALID_SESSION.session);

    await vi.waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEY)).toBe('0.8');
      expect(dispatchEventSpy).toHaveBeenCalled();
    });
  });

  it('clears account tracking when the session is signed out', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    let authCallback: ((event: string, session: any) => void) | undefined;
    onAuthStateChangeMock.mockImplementation((callback: (event: string, session: any) => void) => {
      authCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
    fromMock.mockReturnValue(makeSelectChain({ data: { mobile_ui_scale: 0.8 }, error: null }));
    const { initializeMobileUiScale } = await import('../mobileUiScale');

    await initializeMobileUiScale();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('0.8');

    authCallback?.('SIGNED_OUT', null);
    await new Promise(resolve => window.setTimeout(resolve, 0));

    // The cached value survives a sign-out instead of being reset to 100%.
    expect(localStorage.getItem(STORAGE_KEY)).toBe('0.8');
  });

  it('starts the bootstrap only once', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    fromMock.mockReturnValue(makeSelectChain({ data: { mobile_ui_scale: 0.8 }, error: null }));
    const { initializeMobileUiScale } = await import('../mobileUiScale');

    const first = initializeMobileUiScale();
    const second = initializeMobileUiScale();
    expect(second).toBe(first);
    await first;
  });
});
