import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fromMock, insertMock, updateMock, eqMock, selectMock, singleMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  insertMock: vi.fn(),
  updateMock: vi.fn(),
  eqMock: vi.fn(),
  selectMock: vi.fn(),
  singleMock: vi.fn(),
}));

vi.mock('../../lib/supabaseClient', () => ({
  default: {
    from: fromMock,
  },
}));

describe('package service persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const query = {
      insert: insertMock,
      update: updateMock,
      eq: eqMock,
      select: selectMock,
      single: singleMock,
    };
    fromMock.mockReturnValue(query);
    insertMock.mockReturnValue(query);
    updateMock.mockReturnValue(query);
    eqMock.mockReturnValue(query);
    selectMock.mockReturnValue(query);
  });

  it('does not retry package creation after a transient server error', async () => {
    singleMock.mockResolvedValue({
      data: null,
      error: { code: '503', message: 'Service unavailable' },
    });
    const { createPackage } = await import('../packages');

    await expect(createPackage({ name: 'Paket A', price: 100 } as any))
      .rejects.toMatchObject({ code: '503' });

    expect(insertMock).toHaveBeenCalledTimes(1);
  });

  it('retries with the legacy package shape when a newer column is missing', async () => {
    singleMock
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST204', message: 'Column not found in schema cache' },
      })
      .mockResolvedValueOnce({
        data: { id: 'pkg-1', name: 'Paket A', price: 100 },
        error: null,
      });
    const { createPackage } = await import('../packages');

    const created = await createPackage({
      name: 'Paket A',
      price: 100,
      physicalItems: [{ name: 'Album', price: 50 }],
    } as any);

    expect(created.id).toBe('pkg-1');
    expect(insertMock).toHaveBeenCalledTimes(2);
    expect(insertMock).toHaveBeenLastCalledWith([expect.objectContaining({
      name: 'Paket A',
      price: 100,
    })]);
  });

  it('does not retry package updates after a transient server error', async () => {
    singleMock.mockResolvedValue({
      data: null,
      error: { code: '503', message: 'Service unavailable' },
    });
    const { updatePackage } = await import('../packages');

    await expect(updatePackage('pkg-1', { name: 'Paket B' }))
      .rejects.toMatchObject({ code: '503' });

    expect(updateMock).toHaveBeenCalledTimes(1);
  });
});
