-- 013_add_operation_type_to_leads.sql
-- Adds operation_type column to leads table

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'operation_type') THEN
        ALTER TABLE leads ADD COLUMN operation_type TEXT;
        -- Optional: Add check constraint if we want to restrict values to the same as deals, or keep it open.
        -- Using the same types as Master Deals for consistency
        ALTER TABLE leads ADD CONSTRAINT leads_operation_type_check CHECK (operation_type IN (
            'acquisition', 'merger', 'investment', 'divestment', -- Legacy/Basic
            'ccb', 'cri_land', 'cri_construction', 'cri_corporate',
            'debt_construction', 'receivables_advance', 'working_capital',
            'built_to_suit', 'preferred_equity', 'repurchase',
            'sale_and_lease_back', 'inventory_purchase',
            'financial_swap', 'physical_swap', 'hybrid_swap'
        ));
    END IF;
END $$;
