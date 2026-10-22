import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import {
    MOBILE_UI_SCALE_DEFAULT,
    normalizeMobileUiScale,
    saveMobileUiScale,
} from '../utils/mobileUiScale';

export const MOBILE_UI_SCALE_SYNC_EVENT = 'venapindah-mobile-ui-scale-sync';

/**
 * Single global mechanism for the mobile UI scale preference.
 *
 * Responsibilities:
 *  - load the value from `profiles.mobile_ui_scale` for the active account,
 *  - apply + cache it (CSS variable + localStorage) as soon as it is known,
 *  - keep it in sync with Supabase auth state changes,
 *  - never reset the cached value when the session is missing, the fetch fails,
 *    or the profile row is not ready yet.
 */

/** Never hold the first paint hostage to a slow or offline Supabase. */
export const MOBILE_UI_SCALE_INITIALIZE_TIMEOUT_MS = 8000;

// --- Global state (one load pipeline for the whole app) ---
let activeUserId: string | null = null;
let inFlightPromise: Promise<number | null> | null = null;
let inFlightUserId: string | null = null;
let loadToken = 0;
let bootstrapPromise: Promise<void> | null = null;

/**
 * Load the scale stored in the `profiles` table.
 * Returns `undefined` whenever there is no reliable value (no session, no profile
 * row yet, or an interactive error) so callers keep the cached value instead of
 * falling back to 100%.
 */
export async function loadRemoteMobileUiScale(userId?: string): Promise<number | undefined> {
    if (!isSupabaseConfigured) return undefined;

    try {
        let targetUserId = userId;
        if (!targetUserId) {
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;
            targetUserId = sessionData?.session?.user?.id;
            if (!targetUserId) return undefined;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('mobile_ui_scale')
            .eq('admin_user_id', targetUserId)
            .maybeSingle();

        if (error) {
            // PGRST116 = zero rows. Treat it like "not loaded yet" so the cached
            // preference survives instead of being reset to the default.
            if (error.code === 'PGRST116') return undefined;
            throw error;
        }

        // The profile row is not available (yet) — do not touch the cached value.
        if (!data) return undefined;

        const value = data.mobile_ui_scale;
        // A stored NULL is a deliberate reset to the default, so it is applied.
        if (value === null || value === undefined) return MOBILE_UI_SCALE_DEFAULT;

        const scale = Number(value);
        if (!Number.isFinite(scale)) return MOBILE_UI_SCALE_DEFAULT;
        return normalizeMobileUiScale(scale);
    } catch (err: any) {
        if (err?.name === 'AuthSessionMissingError' || err?.message?.includes('Auth session missing')) {
            return undefined;
        }
        throw err;
    }
}

/** Persist the scale to the `profiles` table for the current user. */
export async function saveRemoteMobileUiScale(value: number): Promise<number | undefined> {
    const scale = normalizeMobileUiScale(value);
    if (!isSupabaseConfigured) return undefined;

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData?.session) throw new Error('Sesi akun Supabase tidak ditemukan.');

    const userId = sessionData.session.user.id;

    // Use update — the profile row is always created at account setup.
    // RLS ensures we can only update the current user's own row.
    const { data, error } = await supabase
        .from('profiles')
        .update({ mobile_ui_scale: scale })
        .eq('admin_user_id', userId)
        .select('mobile_ui_scale')
        .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Profil akun tidak ditemukan; preferensi tidak disimpan.');

    const savedScale = data.mobile_ui_scale;
    return savedScale !== null && savedScale !== undefined
        ? normalizeMobileUiScale(Number(savedScale))
        : MOBILE_UI_SCALE_DEFAULT;
}

/**
 * Load, apply and cache the preference for `userId`.
 *
 * Requests are de-duplicated (same account) and serialised (different account),
 * and stale responses are discarded, so a slow/older fetch can never overwrite a
 * newer or correct value.
 *
 * Passing `null` (signed out) stops tracking the previous account but keeps the
 * cached value untouched.
 */
export function refreshMobileUiScaleForUser(userId: string | null): Promise<number | null> {
    if (!isSupabaseConfigured) return Promise.resolve(null);

    if (!userId) {
        // Invalidate any in-flight response and stop tracking the previous account.
        activeUserId = null;
        loadToken += 1;
        inFlightUserId = null;
        return Promise.resolve(null);
    }

    activeUserId = userId;

    // The same account is already loading → reuse the in-flight request.
    if (inFlightPromise && inFlightUserId === userId) {
        return inFlightPromise;
    }

    // Serialise behind the previous request (even for another account) so fetches
    // never run uncontrolled in parallel.
    const previous = inFlightPromise;
    const token = ++loadToken;

    const run = async (): Promise<number | null> => {
        const remoteScale = await loadRemoteMobileUiScale(userId);
        // `undefined` = no reliable remote value → never touch the cached value.
        if (remoteScale === undefined) return null;
        // A newer request (account switch / sign-out) superseded this one.
        if (token !== loadToken || activeUserId !== userId) return null;

        const applied = saveMobileUiScale(remoteScale);
        window.dispatchEvent(new CustomEvent(MOBILE_UI_SCALE_SYNC_EVENT, { detail: applied }));
        return applied;
    };

    const promise: Promise<number | null> = (previous ? previous.catch((): null => null).then(run) : run())
        .finally(() => {
            // Only the most recent request may release the pipeline.
            if (loadToken === token) {
                inFlightPromise = null;
                inFlightUserId = null;
            }
        });

    inFlightPromise = promise;
    inFlightUserId = userId;
    return promise;
}

/**
 * Bootstrap the global preference once, before the app renders.
 *
 * Resolves after the first load attempt for the initial session has completed
 * (success, failure, or the safety timeout). A Supabase session that is recovered
 * a moment later arrives as `INITIAL_SESSION` / `SIGNED_IN` and is applied then.
 */
export function initializeMobileUiScale(): Promise<void> {
    if (bootstrapPromise) return bootstrapPromise;
    if (!isSupabaseConfigured) {
        bootstrapPromise = Promise.resolve();
        return bootstrapPromise;
    }

    bootstrapPromise = new Promise<void>(resolve => {
        let settled = false;
        let timeoutId = 0;
        // Sesi yang sama bisa dilaporkan dua kali saat startup (getSession() dan
        // event INITIAL_SESSION/SIGNED_IN). Cukup satu muatan per akun.
        let syncedUserId: string | null = null;
        const settle = () => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeoutId);
            resolve();
        };

        const syncForUser = (userId: string, settleAfter: boolean) => {
            if (syncedUserId === userId) {
                if (settleAfter) settle();
                return;
            }
            syncedUserId = userId;
            void refreshMobileUiScaleForUser(userId)
                .catch(error => {
                    console.warn('[MobileUiScale] Failed to load the Supabase preference:', error);
                })
                .then(() => {
                    if (settleAfter) settle();
                });
        };

        // Subscribe first so a session recovered a moment later (INITIAL_SESSION /
        // SIGNED_IN) is never missed.
        supabase.auth.onAuthStateChange((event, session) => {
            // Escape the callback synchronously to avoid Supabase's auth deadlock.
            window.setTimeout(() => {
                const userId = session?.user?.id ?? null;
                if (!userId) {
                    syncedUserId = null;
                    refreshMobileUiScaleForUser(null);
                    settle();
                    return;
                }
                if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                    syncForUser(userId, true);
                }
            }, 0);
        });

        // Also resolve the session that is already available at startup.
        supabase.auth.getSession()
            .then(({ data: sessionData }) => {
                const userId = sessionData?.session?.user?.id ?? null;
                if (!userId) {
                    settle();
                    return;
                }
                syncForUser(userId, true);
            })
            .catch(() => settle());

        // Safety net: the first paint must never wait forever.
        timeoutId = window.setTimeout(settle, MOBILE_UI_SCALE_INITIALIZE_TIMEOUT_MS);
    });

    return bootstrapPromise;
}
