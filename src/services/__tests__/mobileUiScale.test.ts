import { beforeEach, describe, expect, it, vi } from 'vitest';

// --- Mocks ---

const fromMock = vi.fn();
const getSessionMock = vi.fn();
const onAuthStateChangeMock = vi.fn();
type MobileScaleMockResult = {
  data: { id?: string; mobile_ui_scale: number | null } | null;
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

const PROFILE_ROW_ID = '38c9aa0c-2d60-4cce-a7cd-f76a76a2136b';

// Chainable `from()` mock. Every query method returns the same chain and each
// `maybeSingle()` consumes the next scripted result, repeating the last one once
// the list is exhausted — that is how a fallback lookup or the post-update read
// is distinguished from the first query.
function makeProfileChain(...results: MobileScaleMockResult[]) {
  const calls: { eq: Array<[string, unknown]>; update: unknown[]; limited: number } = {
    eq: [],
    update: [],
    limited: 0,
  };
  let index = 0;
  const nextResult = () => results[Math.min(index++, results.length - 1)];
  const chain: any = {
    calls,
    select: () => chain,
    update: (payload: unknown) => {
      calls.update.push(payload);
      return chain;
    },
    eq: (column: string, value: unknown) => {
      calls.eq.push([column, value]);
      return chain;
    },
    limit: () => {
      calls.limited += 1;
      return chain;
    },
    maybeSingle: async () => nextResult(),
  };
  return chain;
}

function ownedRow(mobile_ui_scale: number | null): MobileScaleMockResult {
  return { data: { id: PROFILE_ROW_ID, mobile_ui_scale }, error: null };
}

const NO_ROW: MobileScaleMockResult = { data: null, error: null };

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
    fromMock.mockReturnValue(makeProfileChain(ownedRow(null)));
    const { loadRemoteMobileUiScale } = await import('../mobileUiScale');
    const result = await loadRemoteMobileUiScale();
    expect(result).toBe(1);
  });

  it('returns undefined when no profile row exists at all (never falls back to the default)', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    const chain = makeProfileChain(NO_ROW);
    fromMock.mockReturnValue(chain);
    const { loadRemoteMobileUiScale } = await import('../mobileUiScale');
    const result = await loadRemoteMobileUiScale();
    expect(result).toBeUndefined();
    expect(chain.calls.eq).toContainEqual(['admin_user_id', 'user-uuid-1']);
    expect(chain.calls.limited).toBe(1);
  });

  it('falls back to the active profile row when admin_user_id matches nobody', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    const chain = makeProfileChain(NO_ROW, ownedRow(0.8));
    fromMock.mockReturnValue(chain);
    const { loadRemoteMobileUiScale } = await import('../mobileUiScale');
    const result = await loadRemoteMobileUiScale();
    expect(result).toBe(0.8);
    expect(chain.calls.limited).toBe(1);
  });

  it('treats a PGRST116 (zero rows) error like a not-ready profile', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    fromMock.mockReturnValue(makeProfileChain({ data: null, error: { code: 'PGRST116', message: 'no rows' } }));
    const { loadRemoteMobileUiScale } = await import('../mobileUiScale');
    const result = await loadRemoteMobileUiScale();
    expect(result).toBeUndefined();
  });

  it('propagates a real query error instead of silently using the fallback', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    const deniedError = Object.assign(new Error('denied'), { code: '42501' });
    fromMock.mockReturnValue(makeProfileChain({ data: null, error: deniedError }));
    const { loadRemoteMobileUiScale } = await import('../mobileUiScale');
    await expect(loadRemoteMobileUiScale()).rejects.toBe(deniedError);
  });

  it('returns a normalized number when the column has a valid value', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    fromMock.mockReturnValue(makeProfileChain(ownedRow(0.8)));
    const { loadRemoteMobileUiScale } = await import('../mobileUiScale');
    const result = await loadRemoteMobileUiScale();
    expect(result).toBe(0.8);
  });

  it('clamps an out-of-range value from the database', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    fromMock.mockReturnValue(makeProfileChain(ownedRow(2.5)));
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

  it('updates the row matched by admin_user_id', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    const chain = makeProfileChain(ownedRow(0.8), { data: { mobile_ui_scale: 0.8 }, error: null });
    fromMock.mockReturnValue(chain);
    const { saveRemoteMobileUiScale } = await import('../mobileUiScale');
    const result = await saveRemoteMobileUiScale(0.8);
    expect(chain.calls.update).toEqual([{ mobile_ui_scale: 0.8 }]);
    expect(chain.calls.eq).toEqual([
      ['admin_user_id', 'user-uuid-1'],
      ['id', PROFILE_ROW_ID],
    ]);
    expect(result).toBe(0.8);
  });

  it('updates the active profile row when admin_user_id matches nobody', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    const chain = makeProfileChain(
      NO_ROW,
      ownedRow(0.8),
      { data: { mobile_ui_scale: 0.8 }, error: null },
    );
    fromMock.mockReturnValue(chain);
    const { saveRemoteMobileUiScale } = await import('../mobileUiScale');
    const result = await saveRemoteMobileUiScale(0.8);
    expect(chain.calls.update).toEqual([{ mobile_ui_scale: 0.8 }]);
    expect(chain.calls.eq).toEqual([
      ['admin_user_id', 'user-uuid-1'],
      ['id', PROFILE_ROW_ID],
    ]);
    expect(result).toBe(0.8);
  });

  it('persists the default scale explicitly as 1.0', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    const chain = makeProfileChain(ownedRow(null), { data: { mobile_ui_scale: null }, error: null });
    fromMock.mockReturnValue(chain);
    const { saveRemoteMobileUiScale } = await import('../mobileUiScale');
    const result = await saveRemoteMobileUiScale(1.0);
    expect(chain.calls.update).toEqual([{ mobile_ui_scale: 1 }]);
    expect(result).toBe(1.0);
  });

  it('rejects when there is no session instead of claiming a successful save', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });
    const { saveRemoteMobileUiScale } = await import('../mobileUiScale');
    await expect(saveRemoteMobileUiScale(0.8)).rejects.toThrow('Sesi akun Supabase tidak ditemukan.');
  });

  it('rejects when the database has no profile row at all', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    const chain = makeProfileChain(NO_ROW);
    fromMock.mockReturnValue(chain);
    const { saveRemoteMobileUiScale } = await import('../mobileUiScale');
    await expect(saveRemoteMobileUiScale(0.8)).rejects.toThrow('Profil akun tidak ditemukan; preferensi tidak disimpan.');
    expect(chain.calls.update).toEqual([]);
  });

  it('rejects when the update matches no row', async () => {
    getSessionMock.mockResolvedValue({ data: VALID_SESSION, error: null });
    const chain = makeProfileChain(ownedRow(0.8), NO_ROW);
    fromMock.mockReturnValue(chain);
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
    fromMock.mockReturnValue(makeProfileChain(ownedRow(0.75)));
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
    fromMock.mockReturnValue(makeProfileChain(ownedRow(0.8)));
    const { refreshMobileUiScaleForUser } = await import('../mobileUiScale');

    const first = refreshMobileUiScaleForUser('user-uuid-1');
    const second = refreshMobileUiScaleForUser('user-uuid-1');

    expect(fromMock).toHaveBeenCalledTimes(1);
    await expect(first).resolves.toBe(0.8);
    await expect(second).resolves.toBe(0.8);
  });

  it('never overwrites the cached value when no profile row is available', async () => {
    localStorage.setItem(STORAGE_KEY, '0.85');
    fromMock.mockReturnValue(makeProfileChain(NO_ROW));
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

    releaseFetch({ data: { id: PROFILE_ROW_ID, mobile_ui_scale: 0.4 }, error: null });

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
    fromMock.mockReturnValue(makeProfileChain(ownedRow(0.8)));
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
    fromMock.mockReturnValue(makeProfileChain(ownedRow(0.8)));
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
    fromMock.mockReturnValue(makeProfileChain(ownedRow(0.8)));
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
    fromMock.mockReturnValue(makeProfileChain(ownedRow(0.8)));
    const { initializeMobileUiScale } = await import('../mobileUiScale');

    const first = initializeMobileUiScale();
    const second = initializeMobileUiScale();
    expect(second).toBe(first);
    await first;
  });
});
