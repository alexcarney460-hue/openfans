-- Migration: 002_create_tax_info_table
-- Creates the creator_tax_info table for storing encrypted tax information.

CREATE TABLE IF NOT EXISTS creator_tax_info (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  legal_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  tax_id_encrypted BYTEA NOT NULL,
  tax_id_iv BYTEA NOT NULL,
  tax_id_last4 TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
