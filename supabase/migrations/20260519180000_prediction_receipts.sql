-- prediction_receipts: one row per user (UNIQUE on user_id = upsert semantics)
-- Public SELECT by token enables /recibo page without auth.
-- Only service role writes — no user-facing INSERT/UPDATE policy.

CREATE TABLE IF NOT EXISTS prediction_receipts (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token                text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  display_name         text NOT NULL,
  predictions_snapshot jsonb NOT NULL DEFAULT '[]',
  bonus_snapshot       jsonb,
  last_sent_at         timestamptz,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now(),
  CONSTRAINT prediction_receipts_user_id_unique UNIQUE (user_id)
);

ALTER TABLE prediction_receipts ENABLE ROW LEVEL SECURITY;

-- Anyone with the token can read (the /recibo public page)
CREATE POLICY "receipts_public_select"
  ON prediction_receipts
  FOR SELECT
  USING (true);

-- Auto-update updated_at on every change
CREATE OR REPLACE FUNCTION update_receipt_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_receipt_updated
  BEFORE UPDATE ON public.prediction_receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_receipt_updated_at();
