import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientStatus, ClientType } from '../../types';

const insertMock = vi.fn();
const selectMock = vi.fn();
const singleMock = vi.fn();
const updateMock = vi.fn();
const fromMock = vi.fn();

vi.mock('../../lib/supabaseClient', () => ({
  default: {
    from: fromMock,
  },
}));

const mockSupabaseChain = () => ({
  insert: insertMock,
  update: updateMock,
  select: selectMock,
  eq: vi.fn(),
  maybeSingle: vi.fn(),
});

describe('client service defaults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fromMock.mockReturnValue(mockSupabaseChain());

    insertMock.mockReturnValue({
      select: () => ({
        single: singleMock,
      }),
    });

    updateMock.mockReturnValue({
      eq: () => ({
        select: () => ({
          single: singleMock,
        }),
      }),
    });

    selectMock.mockReturnValue({
      single: singleMock,
    });

    singleMock.mockResolvedValue({
      data: {
        id: 'client-1',
        name: 'Ayu',
        email: 'ayu@test.com',
        phone: '0812',
        whatsapp: '0812',
        since: '2026-09-23',
        instagram: null,
        status: ClientStatus.ACTIVE,
        client_type: ClientType.DIRECT,
        last_contact: '2026-09-23',
        portal_access_id: 'portal-123',
        address: 'Serang',
        created_at: '2026-09-23',
        updated_at: '2026-09-23',
      },
      error: null,
    });
  });

  it('adds required supabase client fields even when import payload is missing them', async () => {
    const { createClient } = await import('../clients');

    await createClient({
      name: 'Ayu',
      email: 'ayu@test.com',
      phone: '0812',
      since: '2026-09-23',
      status: ClientStatus.ACTIVE,
      lastContact: '2026-09-23',
      portalAccessId: 'portal-123',
    } as any);

    expect(insertMock).toHaveBeenCalledWith([
      expect.objectContaining({
        status: ClientStatus.ACTIVE,
        client_type: ClientType.DIRECT,
        since: '2026-09-23',
        last_contact: '2026-09-23',
        portal_access_id: 'portal-123',
      }),
    ]);
  });
});
