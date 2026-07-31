-- Migration 002: Add is_banned column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;
