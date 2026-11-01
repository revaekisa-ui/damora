const QUERY_TIMEOUT_MS = 20_000;

export class QueryTimeoutError extends Error {
  readonly code = 'QUERY_TIMEOUT';

  constructor(queryName: string, timeoutMs: number) {
    super(`Permintaan data ${queryName} melewati batas waktu ${Math.round(timeoutMs / 1000)} detik.`);
    this.name = 'QueryTimeoutError';
  }
}

/** Gives every Supabase read a finite loading state, even if the network hangs. */
export async function fetchWithTimeout<T>(queryName: string, request: () => Promise<T>, timeoutMs = QUERY_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      request(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new QueryTimeoutError(queryName, timeoutMs)), timeoutMs);
      }),
    ]);
  } catch (error) {
    if (error instanceof QueryTimeoutError) {
      console.error('[Data] Supabase query timed out', { queryName, timeoutMs });
    }
    throw error;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  return !(error instanceof QueryTimeoutError) && failureCount < 1;
}
