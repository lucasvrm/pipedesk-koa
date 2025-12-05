-- Add buying_role and sentiment to contacts table

ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS buying_role text CHECK (buying_role IN ('decision_maker', 'influencer', 'blocker', 'champion', 'user', 'gatekeeper')),
ADD COLUMN IF NOT EXISTS sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative', 'unknown'));

-- Add comment to columns for documentation
COMMENT ON COLUMN contacts.buying_role IS 'Role in the buying committee: decision_maker, influencer, blocker, champion, user, gatekeeper';
COMMENT ON COLUMN contacts.sentiment IS 'Sentiment towards the deal: positive, neutral, negative, unknown';
