import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Settings from './SettingsPage';

const mocks = vi.hoisted(() => ({
    upsertProfile: vi.fn(),
    updatePackage: vi.fn(),
    uploadProfileLogo: vi.fn(),
    uploadProfileSignature: vi.fn(),
}));

vi.mock('../../services/profile', async importOriginal => ({
    ...await importOriginal<typeof import('../../services/profile')>(),
    upsertProfile: mocks.upsertProfile,
}));
vi.mock('../../services/packages', () => ({ updatePackage: mocks.updatePackage }));
vi.mock('../../services/storage', () => ({
    uploadGalleryImage: vi.fn(),
    uploadProfileLogo: mocks.uploadProfileLogo,
    uploadProfileSignature: mocks.uploadProfileSignature,
}));

describe('Settings package category rename', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renames the category on every matching package when changes are saved', async () => {
        const profile = {
            id: 'profile-1',
            adminUserId: 'admin-1',
            email: 'admin@example.com',
            fullName: 'Admin',
            packageCategories: ['Candid & Before-After'],
            projectStatusConfig: [],
        } as any;
        const packages = [
            { id: 'package-1', name: 'Paket Satu', category: 'Candid & Before-After' },
            { id: 'package-2', name: 'Paket Dua', category: 'Candid & Before-After' },
        ] as any[];
        const setPackages = vi.fn();
        const renamedCategory = 'Candid & Before-After Premium';

        mocks.upsertProfile.mockImplementation(async (patch: Record<string, unknown>) => ({ ...profile, ...patch }));
        mocks.updatePackage.mockImplementation(async (id: string, patch: Record<string, unknown>) => ({
            ...packages.find(pkg => pkg.id === id),
            ...patch,
        }));

        render(
            <Settings
                profile={profile}
                setProfile={vi.fn()}
                transactions={[]}
                projects={[]}
                packages={packages}
                setPackages={setPackages}
                leads={[]}
                users={[]}
                setUsers={vi.fn()}
                currentUser={{ id: 'admin-1', email: 'admin@example.com', fullName: 'Admin', role: 'Admin' } as any}
            />,
        );

        fireEvent.click(screen.getAllByRole('button', { name: 'Kustomisasi Kategori' })[0]);
        const categoryLabel = screen.getByText('Candid & Before-After');
        const categoryRow = categoryLabel.closest('div.flex.items-center.justify-between');
        fireEvent.click(categoryRow?.querySelector('button[title="Edit"]') as HTMLButtonElement);
        fireEvent.change(document.getElementById('input-KategoriPackage') as HTMLInputElement, {
            target: { value: renamedCategory },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Update' }));
        fireEvent.click(screen.getByRole('button', { name: 'Simpan perubahan' }));

        await waitFor(() => expect(mocks.updatePackage).toHaveBeenCalledTimes(2));
        expect(mocks.updatePackage).toHaveBeenCalledWith('package-1', { category: renamedCategory });
        expect(mocks.updatePackage).toHaveBeenCalledWith('package-2', { category: renamedCategory });
        expect(mocks.upsertProfile).toHaveBeenCalledWith({
            id: 'profile-1',
            packageCategories: [renamedCategory],
        });

        const updateCache = setPackages.mock.calls[0][0] as (current: typeof packages) => typeof packages;
        expect(updateCache(packages).map(pkg => pkg.category)).toEqual([renamedCategory, renamedCategory]);
    });
});

describe('Settings company logo upload', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('previews the selected logo and saves it with the profile', async () => {
        const profile = {
            id: 'profile-logo',
            adminUserId: 'admin-logo',
            email: 'admin@example.com',
            fullName: 'Admin',
            logoBase64: '',
        } as any;
        mocks.upsertProfile.mockImplementation(async (patch: Record<string, unknown>) => ({ ...profile, ...patch }));
        mocks.uploadProfileLogo.mockResolvedValue('https://cdn.example.test/logo.png');
        mocks.uploadProfileSignature.mockResolvedValue('https://cdn.example.test/signature.png');

        render(
            <Settings
                profile={profile}
                setProfile={vi.fn()}
                transactions={[]}
                projects={[]}
                packages={[]}
                setPackages={vi.fn()}
                leads={[]}
                users={[]}
                setUsers={vi.fn()}
                currentUser={{ id: 'admin-logo', email: 'admin@example.com', fullName: 'Admin', role: 'Admin' } as any}
            />,
        );

        const saveButton = screen.getByRole('button', { name: 'Simpan Perubahan' });
        fireEvent.change(screen.getByLabelText('Logo Perusahaan (u/ Invoice)'), {
            target: { files: [new File(['logo-image'], 'company-logo.png', { type: 'image/png' })] },
        });
        fireEvent.change(screen.getByLabelText(/Tanda Tangan \(TTD\)/), {
            target: { files: [new File(['signature-image'], 'signature.png', { type: 'image/png' })] },
        });

        expect(saveButton.hasAttribute('disabled')).toBe(true);
        const preview = await screen.findByAltText('Logo preview');
        expect(preview.getAttribute('src')).toBe('https://cdn.example.test/logo.png');
        expect((await screen.findByAltText('TTD preview')).getAttribute('src')).toBe('https://cdn.example.test/signature.png');
        await waitFor(() => expect(saveButton.hasAttribute('disabled')).toBe(false));

        fireEvent.click(saveButton);
        await waitFor(() => expect(mocks.upsertProfile).toHaveBeenCalledWith(expect.objectContaining({
            id: 'profile-logo',
            logoBase64: 'https://cdn.example.test/logo.png',
            signatureBase64: 'https://cdn.example.test/signature.png',
        })));
    });
});