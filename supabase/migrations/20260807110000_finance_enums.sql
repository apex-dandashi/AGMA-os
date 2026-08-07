-- Phase 5a: extend document_type for finance (docs/05 §B3).
-- Separate migration: new enum values cannot be USED in the same transaction
-- that adds them.
alter type public.document_type add value if not exists 'invoice';
alter type public.document_type add value if not exists 'credit_note';
