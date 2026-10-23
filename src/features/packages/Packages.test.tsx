import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Packages } from './Packages';
import { PhysicalItem } from '../../types';
import * as packageService from '../../services/packages';
import * as addOnService from '../../services/addOns';
import * as attireService from '../../services/attire';

vi.mock('../../services/profile', () => ({
  upsertProfile: vi.fn(() => new Promise(() => {})),
  updateProfile: vi.fn(() => new Promise(() => {})),
}));

afterEach(() => vi.restoreAllMocks());

describe('Packages catalog layout', () => {
  it('renames a region across packages, add-ons and attire', async () => {
    const packages = [{
      id: 'pkg-custom',
      name: 'Paket Wedding',
      price: 5000000,
      category: 'Wedding',
      region: 'pricelist wedding 2026',
      physicalItems: [] as PhysicalItem[],
      digitalItems: [] as string[],
      processingTime: '7 hari',
    }];
    const addOns = [{ id: 'addon-custom', name: 'Album', price: 500000, region: 'pricelist wedding 2026' }];
    const attire = [{ id: 'attire-custom', name: 'Busana Pengantin', price: 2500000, region: 'pricelist wedding 2026' }];
    const setPackages = vi.fn();
    const setAddOns = vi.fn();
    const setAttire = vi.fn();

    vi.spyOn(packageService, 'updatePackage').mockResolvedValue({ ...packages[0], region: 'wedding regional' } as any);
    vi.spyOn(addOnService, 'updateAddOn').mockResolvedValue({ ...addOns[0], region: 'wedding regional' });
    vi.spyOn(attireService, 'updateAttire').mockResolvedValue({ ...attire[0], region: 'wedding regional' });

    render(
      <Packages
        packages={packages}
        setPackages={setPackages}
        addOns={addOns}
        setAddOns={setAddOns}
        attire={attire}
        setAttire={setAttire}
        projects={[]}
        profile={{ packageCategories: ['Wedding'] } as any}
        setProfile={vi.fn()}
        showNotification={vi.fn()}
        initialAction={null}
        setInitialAction={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit grup paket Pricelist Wedding 2026' }));
    expect(screen.getByText('PAKET KUSTOM')).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox', { name: 'Nama grup paket' }), { target: { value: 'Wedding Regional' } });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan Perubahan' }));

    await waitFor(() => {
      expect(setPackages).toHaveBeenCalledWith(expect.any(Function));
      expect(setAddOns).toHaveBeenCalledWith(expect.any(Function));
      expect(setAttire).toHaveBeenCalledWith(expect.any(Function));
    });

    expect((setPackages.mock.calls[0][0] as (previous: typeof packages) => typeof packages)(packages)[0].region).toBe('wedding regional');
    expect((setAddOns.mock.calls[0][0] as (previous: typeof addOns) => typeof addOns)(addOns)[0].region).toBe('wedding regional');
    expect((setAttire.mock.calls[0][0] as (previous: typeof attire) => typeof attire)(attire)[0].region).toBe('wedding regional');
  });

  it('saves an edited package price to its default duration option', async () => {
    const pkg = {
      id: 'pkg-duration',
      name: 'Intimate Gold Package',
      price: 6500000,
      category: 'Wedding',
      region: 'banten',
      physicalItems: [] as PhysicalItem[],
      digitalItems: [] as string[],
      processingTime: '',
      durationOptions: [
        { label: 'Akad', price: 6500000, default: true },
        { label: 'Akad dan Resepsi', price: 9000000, default: false },
      ],
    };
    vi.spyOn(packageService, 'updatePackage').mockImplementation(async (id, patch) => ({ ...pkg, ...patch, id } as any));

    render(
      <Packages
        packages={[pkg] as any}
        setPackages={vi.fn()}
        addOns={[]}
        setAddOns={vi.fn()}
        attire={[]}
        setAttire={vi.fn()}
        projects={[]}
        profile={{ packageCategories: ['Wedding'] } as any}
        setProfile={vi.fn()}
        showNotification={vi.fn()}
        initialAction={null}
        setInitialAction={vi.fn()}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Edit Paket' })[0]);
    fireEvent.change(screen.getByPlaceholderText('Contoh: 12.500.000'), { target: { value: '8.500.000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Perbarui Paket' }));

    await waitFor(() => expect(packageService.updatePackage).toHaveBeenCalledWith('pkg-duration', expect.objectContaining({
      price: 8500000,
      durationOptions: expect.arrayContaining([
        expect.objectContaining({ label: 'Akad', price: 8500000, default: true }),
        expect.objectContaining({ label: 'Akad dan Resepsi', price: 9000000, default: false }),
      ]),
    })));
  });

  it('reorders package rows by dragging in table view', () => {
    const dataTransfer = {
      effectAllowed: '',
      dropEffect: '',
      setData: vi.fn(),
      getData: vi.fn(() => 'pkg-first'),
    };

    render(
      <Packages
        packages={[
          { id: 'pkg-first', name: 'Paket Pertama', price: 5000000, category: 'Wedding', region: 'banten', physicalItems: [], digitalItems: [], processingTime: '' },
          { id: 'pkg-second', name: 'Paket Kedua', price: 7000000, category: 'Wedding', region: 'banten', physicalItems: [], digitalItems: [], processingTime: '' },
        ]}
        setPackages={vi.fn()}
        addOns={[]}
        setAddOns={vi.fn()}
        attire={[]}
        setAttire={vi.fn()}
        projects={[]}
        profile={{ publicPageConfig: { packageOrder: ['pkg-first', 'pkg-second'] } } as any}
        setProfile={vi.fn()}
        showNotification={vi.fn()}
        initialAction={null}
        setInitialAction={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tabel' }));
    const sourceHandle = screen.getByRole('button', { name: 'Seret Paket Pertama untuk mengurutkan' });
    const targetRow = screen.getAllByRole('row')[2];
    fireEvent.dragStart(sourceHandle, { dataTransfer });
    fireEvent.dragOver(targetRow, { dataTransfer });
    fireEvent.drop(targetRow, { dataTransfer });

    expect(screen.getAllByRole('row').slice(1).map(row => row.querySelectorAll('td')[1].textContent)).toEqual([
      'Paket Kedua',
      'Paket Pertama',
    ]);
  });

  it('copies all packages, add-ons and attire from one group to another', async () => {
    const sourceGroup = 'wedding custom';
    vi.spyOn(packageService, 'createPackage').mockImplementation(async payload => ({ ...payload, id: 'pkg-copy' } as any));
    vi.spyOn(addOnService, 'createAddOn').mockImplementation(async payload => ({ ...payload, id: 'addon-copy' } as any));
    vi.spyOn(attireService, 'createAttire').mockImplementation(async payload => ({ ...payload, id: 'attire-copy' } as any));

    render(
      <Packages
        packages={[{ id: 'pkg-source', name: 'Paket Utama', price: 5000000, category: 'Wedding', region: sourceGroup, physicalItems: [], digitalItems: [], processingTime: '' }]}
        setPackages={vi.fn()}
        addOns={[{ id: 'addon-source', name: 'Album', price: 500000, region: sourceGroup }]}
        setAddOns={vi.fn()}
        attire={[{ id: 'attire-source', name: 'Busana', price: 2500000, region: sourceGroup }]}
        setAttire={vi.fn()}
        projects={[]}
        profile={{ packageCategories: ['Wedding'] } as any}
        setProfile={vi.fn()}
        showNotification={vi.fn()}
        initialAction={null}
        setInitialAction={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Salin grup Wedding Custom' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nama grup salinan' }), { target: { value: 'Wedding Custom Baru' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salin 3 Item' }));

    await waitFor(() => {
      expect(packageService.createPackage).toHaveBeenCalledWith(expect.objectContaining({ name: 'Paket Utama (Wedding Custom Baru)', region: 'wedding custom baru' }));
      expect(addOnService.createAddOn).toHaveBeenCalledWith(expect.objectContaining({ name: 'Album (Wedding Custom Baru)', region: 'wedding custom baru' }));
      expect(attireService.createAttire).toHaveBeenCalledWith(expect.objectContaining({ name: 'Busana (Wedding Custom Baru)', region: 'wedding custom baru' }));
    });
  });

  it('filters the catalog to the default region on first open', () => {
    render(
      <Packages
        packages={[
          {
            id: 'pkg-vendor',
            name: 'Paket Vendor',
            price: 5000000,
            category: 'Wedding',
            region: 'vendor',
            physicalItems: [],
            digitalItems: [],
            processingTime: '7 hari',
          },
          {
            id: 'pkg-banten',
            name: 'Paket Banten',
            price: 7000000,
            category: 'Wedding',
            region: 'banten',
            physicalItems: [],
            digitalItems: [],
            processingTime: '7 hari',
          },
        ]}
        setPackages={vi.fn()}
        addOns={[
          { id: 'addon-vendor', name: 'Add-On Vendor', price: 500000, region: 'vendor' },
          { id: 'addon-banten', name: 'Add-On Banten', price: 700000, region: 'banten' },
        ]}
        setAddOns={vi.fn()}
        attire={[]}
        setAttire={vi.fn()}
        projects={[]}
        profile={{ packageCategories: ['Wedding'] } as any}
        setProfile={vi.fn()}
        showNotification={vi.fn()}
        initialAction={null}
        setInitialAction={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Vendor' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText('Paket Vendor')).toBeTruthy();
    expect(screen.queryByText('Paket Banten')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Add-On' }));
    expect(screen.queryByText('Paket Vendor')).toBeNull();
    expect(screen.getByText('Add-On Vendor')).toBeTruthy();
    expect(screen.queryByText('Add-On Banten')).toBeNull();
  });

  it('opens the package catalog in table view by default', () => {
    render(
      <Packages
        packages={[{ id: 'pkg-table', name: 'Paket Tabel', price: 5000000, category: 'Wedding', region: 'banten', physicalItems: [], digitalItems: [], processingTime: '' }]}
        setPackages={vi.fn()}
        addOns={[]}
        setAddOns={vi.fn()}
        attire={[]}
        setAttire={vi.fn()}
        projects={[]}
        profile={{ packageCategories: ['Wedding'] } as any}
        setProfile={vi.fn()}
        showNotification={vi.fn()}
        initialAction={null}
        setInitialAction={vi.fn()}
      />,
    );

    expect(screen.getByRole('table')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tabel' }).className).toContain('bg-white text-brand-accent');
  });

  it('separates packages, add-ons and attire into their own tabs', () => {
    render(
      <Packages
        packages={[
          {
            id: 'pkg-1',
            name: 'Paket Premium',
            price: 5000000,
            category: 'Wedding',
            region: 'vendor',
            physicalItems: [],
            digitalItems: ['Album Digital'],
            processingTime: '7 hari',
            photographers: '2 fotografer',
          },
        ]}
        setPackages={vi.fn()}
        addOns={[
          { id: 'addon-1', name: 'Album', price: 900000, region: 'vendor' },
        ]}
        setAddOns={vi.fn()}
        attire={[{ id: 'attire-1', name: 'Busana Pengantin', price: 2500000, region: 'vendor' }]}
        setAttire={vi.fn()}
        projects={[]}
        profile={{ packageCategories: ['Wedding'] } as any}
        setProfile={vi.fn()}
        showNotification={vi.fn()}
        initialAction={null}
        setInitialAction={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Kartu' }));
    expect(screen.getByRole('heading', { name: 'Paket' })).toBeTruthy();
    expect(screen.getByText('Paket Premium')).toBeTruthy();
    expect(screen.queryByText('Album')).toBeNull();
    expect(screen.queryByText('Busana Pengantin')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Add-On' }));
    expect(screen.queryByRole('heading', { name: 'Paket' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Add-On' })).toBeTruthy();
    expect(screen.getByText('Album')).toBeTruthy();
    expect(screen.queryByText('Busana Pengantin')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Attire / Busana' }));
    expect(screen.queryByRole('heading', { name: 'Add-On' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Attire / Busana' })).toBeTruthy();
    expect(screen.getByText('Busana Pengantin')).toBeTruthy();
    expect(screen.queryByText('Album')).toBeNull();
  });

  it('updates package order immediately while the server save is still pending', () => {
    render(
      <Packages
        packages={[
          {
            id: 'pkg-1',
            name: 'Paket Pertama',
            price: 5000000,
            category: 'Wedding',
            region: 'vendor',
            physicalItems: [],
            digitalItems: [],
            processingTime: '7 hari',
          },
          {
            id: 'pkg-2',
            name: 'Paket Kedua',
            price: 7000000,
            category: 'Wedding',
            region: 'vendor',
            physicalItems: [],
            digitalItems: [],
            processingTime: '7 hari',
          },
        ]}
        setPackages={vi.fn()}
        addOns={[]}
        setAddOns={vi.fn()}
        attire={[]}
        setAttire={vi.fn()}
        projects={[]}
        profile={{
          publicPageConfig: { packageOrder: ['pkg-1', 'pkg-2'] },
        } as any}
        setProfile={vi.fn()}
        showNotification={vi.fn()}
        initialAction={null}
        setInitialAction={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Kartu' }));
    const firstPackageCard = screen.getByText('Paket Pertama').closest('.group');
    expect(firstPackageCard).toBeTruthy();
    const mobileMoveDown = firstPackageCard?.querySelector('.package-card-mobile-toolbar button[aria-label="Pindah ke Bawah"]');
    expect(mobileMoveDown).toBeTruthy();
    fireEvent.click(mobileMoveDown as HTMLButtonElement);

    const firstMobileToolbar = firstPackageCard?.querySelector('.package-card-mobile-toolbar');
    const secondPackageCard = screen.getByText('Paket Kedua').closest('.group');
    const secondMobileToolbar = secondPackageCard?.querySelector('.package-card-mobile-toolbar');
    expect(within(firstMobileToolbar as HTMLElement).getByText('#2')).toBeTruthy();
    expect(within(secondMobileToolbar as HTMLElement).getByText('#1')).toBeTruthy();
  });

  it('offers Add-On duplication with a destination-region selector', () => {
    render(
      <Packages
        packages={[]}
        setPackages={vi.fn()}
        addOns={[{ id: 'addon-1', name: 'Album Tambahan', price: 900000, region: 'banten' }]}
        setAddOns={vi.fn()}
        attire={[]}
        setAttire={vi.fn()}
        projects={[]}
        profile={{ publicPageConfig: { addOnOrder: ['addon-1'] } } as any}
        setProfile={vi.fn()}
        showNotification={vi.fn()}
        initialAction={null}
        setInitialAction={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add-On' }));
    fireEvent.click(screen.getByRole('button', { name: 'Banten' }));
    fireEvent.click(screen.getByRole('button', { name: 'Duplikat Add-On' }));
    expect(screen.getByRole('heading', { name: 'Duplikasi Add-On ke Grup Lain' })).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: 'Banten' })[1]);
    expect(screen.getByText(/Album Tambahan \(Banten\)/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Duplikasi Sekarang' })).toBeTruthy();
  });

  it('keeps Add-On order changes visible immediately while saving', () => {
    const { rerender } = render(
      <Packages
        packages={[]}
        setPackages={vi.fn()}
        addOns={[
          { id: 'addon-1', name: 'Add-On Pertama', price: 900000, region: 'vendor' },
          { id: 'addon-2', name: 'Add-On Kedua', price: 1200000, region: 'vendor' },
        ]}
        setAddOns={vi.fn()}
        attire={[]}
        setAttire={vi.fn()}
        projects={[]}
        profile={{ publicPageConfig: { addOnOrder: ['addon-1', 'addon-2'] } } as any}
        setProfile={vi.fn()}
        showNotification={vi.fn()}
        initialAction={null}
        setInitialAction={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add-On' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kartu' }));
    const firstAddOnCard = screen.getByText('Add-On Pertama').closest('article');
    expect(firstAddOnCard).toBeTruthy();
    fireEvent.click(within(firstAddOnCard as HTMLElement).getByRole('button', { name: 'Pindah ke Bawah' }));

    expect(within(firstAddOnCard as HTMLElement).getByText('#2')).toBeTruthy();
    expect(screen.getByText('Add-On Kedua').closest('article')?.textContent).toContain('#1');

    rerender(
      <Packages
        packages={[]}
        setPackages={vi.fn()}
        addOns={[
          { id: 'addon-1', name: 'Add-On Pertama', price: 900000, region: 'vendor' },
          { id: 'addon-2', name: 'Add-On Kedua', price: 1200000, region: 'vendor' },
        ]}
        setAddOns={vi.fn()}
        attire={[]}
        setAttire={vi.fn()}
        projects={[]}
        profile={{ publicPageConfig: { addOnOrder: ['addon-1', 'addon-2'] } } as any}
        setProfile={vi.fn()}
        showNotification={vi.fn()}
        initialAction={null}
        setInitialAction={vi.fn()}
      />,
    );

    expect(screen.getByText('Add-On Pertama').closest('article')?.textContent).toContain('#2');
    expect(screen.getByText('Add-On Kedua').closest('article')?.textContent).toContain('#1');
  });

  it('keeps Add-Ons missing from the saved order in a stable alphabetical position', () => {
    render(
      <Packages
        packages={[]}
        setPackages={vi.fn()}
        addOns={[
          { id: 'addon-z', name: 'Zulu', price: 900000, region: 'vendor' },
          { id: 'addon-a', name: 'Alpha', price: 1200000, region: 'vendor' },
          { id: 'addon-pinned', name: 'Pilihan Utama', price: 1500000, region: 'vendor' },
        ]}
        setAddOns={vi.fn()}
        attire={[]}
        setAttire={vi.fn()}
        projects={[]}
        profile={{ publicPageConfig: { addOnOrder: ['addon-pinned'] } } as any}
        setProfile={vi.fn()}
        showNotification={vi.fn()}
        initialAction={null}
        setInitialAction={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add-On' }));
    fireEvent.click(screen.getByRole('button', { name: 'Kartu' }));
    const cards = screen.getAllByText(/Pilihan Utama|Alpha|Zulu/).map(element => element.closest('article'));
    expect(cards.map(card => card?.querySelector('h3')?.textContent)).toEqual(['Pilihan Utama', 'Alpha', 'Zulu']);
  });
});
