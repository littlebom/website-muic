-- Migration: Add SMTP Settings columns to webapp_settings
-- Date: 2026-01-30
-- Description: Adds SMTP configuration fields for email sending

ALTER TABLE webapp_settings
  ADD COLUMN smtpHost VARCHAR(255) NULL,
  ADD COLUMN smtpPort INT NULL,
  ADD COLUMN smtpUsername VARCHAR(255) NULL,
  ADD COLUMN smtpPassword VARCHAR(255) NULL,
  ADD COLUMN smtpFromEmail VARCHAR(255) NULL,
  ADD COLUMN smtpFromName VARCHAR(255) NULL,
  ADD COLUMN smtpSecure TINYINT(1) DEFAULT 0;

-- Optional: If you want to set default values
-- UPDATE webapp_settings SET smtpPort = 587, smtpSecure = 1 WHERE id IS NOT NULL;
