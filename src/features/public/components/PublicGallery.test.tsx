import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PublicGallery from './PublicGallery';

const { mockGetPublicGallery, mockGetProfile } = vi.hoisted(() => ({
  mockGetPublicGallery: vi.fn(),
  mockGetProfile: vi.fn(),
}));

vi.mock('../../../services/galleries', () => ({
  getPublicGallery: mockGetPublicGallery,
}));

vi.mock('../../../services/profile', () => ({
  getProfile: mockGetProfile,
}));

describe('PublicGallery image loading', () => {
  it('prioritizes the first gallery images for a faster initial render', async () => {
    mockGetPublicGallery.mockResolvedValue({
      id: 'gallery-1',
      user_id: 'user-1',
      title: 'Honesty',
      region: 'Jakarta',
      description: 'Portfolio',
      is_public: true,
      public_id: 'honesty-41y4m',
      booking_link: '',
      cover_image_url: '',
      pdf_url: '',
      pdf_name: '',
      images: [
        { id: 'img-1', url: 'https://cdn.example.com/1.jpg', uploadedAt: '2024-01-01T00:00:00.000Z' },
        { id: 'img-2', url: 'https://cdn.example.com/2.jpg', uploadedAt: '2024-01-01T00:00:00.000Z' },
      ],
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    });
    mockGetProfile.mockResolvedValue(null);

    render(<PublicGallery galleryId="honesty-41y4m" />);

    await waitFor(() => {
      expect(screen.getAllByRole('img').length).toBeGreaterThan(0);
    });

    const galleryImages = screen.getAllByRole('img');

    expect(galleryImages[0].getAttribute('loading')).toBe('eager');
    expect(galleryImages[0].getAttribute('fetchpriority')).toBe('high');
    expect(galleryImages[1].getAttribute('loading')).toBe('lazy');
    expect(screen.getAllByRole('link', { name: 'Booking Sekarang' })).toHaveLength(1);
  });
});
