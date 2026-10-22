import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PackageTermsModal } from './PackageTermsModal';

describe('PackageTermsModal', () => {
  it('keeps an in-progress edit when profile data refreshes', () => {
    const onSaveTerms = vi.fn().mockResolvedValue(undefined);
    const profile = {
      id: 'profile-1',
      publicPageConfig: {
        packageTerms: [{ id: 'term-1', title: 'Pembayaran', items: ['DP minimal 30%.'] }],
      },
    } as any;
    const props = {
      isOpen: true,
      onClose: vi.fn(),
      profile,
      regions: [{ value: 'banten', label: 'Banten' }],
      onSaveTerms,
      showNotification: vi.fn(),
    };
    const { rerender } = render(<PackageTermsModal {...props} />);

    fireEvent.click(screen.getByTitle('Edit kategori syarat'));
    const textarea = screen.getByPlaceholderText(/Booking dinyatakan sah/);
    fireEvent.change(textarea, { target: { value: 'Draft hasil paste' } });

    rerender(
      <PackageTermsModal
        {...props}
        profile={{
          ...profile,
          publicPageConfig: {
            packageTerms: [{ id: 'term-1', title: 'Pembayaran', items: ['DP minimal 35%.'] }],
          },
        }}
      />,
    );

    expect(screen.getByPlaceholderText(/Booking dinyatakan sah/)).toHaveProperty('value', 'Draft hasil paste');
    expect(screen.getByRole('button', { name: 'Simpan Semua Perubahan' })).toBeTruthy();
    expect(screen.queryByText('Kembalikan Template Default')).toBeNull();
  });
});