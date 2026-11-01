import { useQuery } from '@tanstack/react-query';
import { listClientFeedback } from '../services/clientFeedback';
import { ClientFeedback } from '../types';
import { fetchWithTimeout } from '../lib/queryTimeout';

export const useClientFeedback = (options: { enabled?: boolean } = {}) => useQuery({
  queryKey: ['clientFeedback'],
  queryFn: () => fetchWithTimeout('umpan balik klien', listClientFeedback),
  staleTime: 30 * 1000,
  enabled: options.enabled !== false,
});
