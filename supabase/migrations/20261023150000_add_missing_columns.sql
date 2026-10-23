-- Migration: Add missing columns to transactions, clients, leads, and team_members tables
-- These columns are used by the application but were not yet present in the database schema.

-- ─── transactions ──────────────────────────────────────────────────────────────
-- printing_item_id: references which printing item this payment covers
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS printing_item_id TEXT,
  ADD COLUMN IF NOT EXISTS vendor_signature TEXT;

-- ─── clients ───────────────────────────────────────────────────────────────────
-- portal_access_id: UUID for client portal link (shared with team_members approach)
-- home_address: pengiriman cetak / delivery address
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS portal_access_id TEXT,
  ADD COLUMN IF NOT EXISTS home_address TEXT;

-- Give every existing client a unique portal_access_id if they don't have one yet
UPDATE clients
SET portal_access_id = gen_random_uuid()::TEXT
WHERE portal_access_id IS NULL OR portal_access_id = '';

-- ─── leads ─────────────────────────────────────────────────────────────────────
-- event_date: planned wedding / event date for this lead
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS event_date DATE;

-- ─── team_members ──────────────────────────────────────────────────────────────
-- portal_access_id: UUID for vendor/team portal link
-- category: 'Tim' | 'Vendor' — distinguish internal team vs external vendor
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS portal_access_id TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Tim';

-- Give every existing team member a unique portal_access_id if they don't have one yet
UPDATE team_members
SET portal_access_id = gen_random_uuid()::TEXT
WHERE portal_access_id IS NULL OR portal_access_id = '';
