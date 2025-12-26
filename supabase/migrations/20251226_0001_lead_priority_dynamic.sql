begin;

-- 1) Novas colunas (idempotente)
alter table public.lead_statuses
  add column if not exists priority_weight int4 not null default 0;

alter table public.lead_origins
  add column if not exists priority_weight int4 not null default 0;

-- 2) Seed opcional de pesos (somente onde ainda está 0)
--    Se seus códigos forem diferentes, edite o CASE/IN abaixo ou comente esta seção inteira.

update public.lead_statuses
set priority_weight = case code
  when 'qualified' then 15
  when 'contacted' then 10
  when 'new'       then 5
  else priority_weight
end
where priority_weight = 0
  and code in ('qualified', 'contacted', 'new');

update public.lead_origins
set priority_weight = case code
  when 'inbound'  then 12
  when 'partner'  then 15
  when 'outbound' then 8
  when 'referral' then 10
  when 'event'    then 7
  else priority_weight
end
where priority_weight = 0
  and code in ('inbound', 'partner', 'outbound', 'referral', 'event');

-- 3) Config global (system_settings)
--    Não sobrescreve se já existir (DO NOTHING).
insert into public.system_settings (key, value, description)
values (
  'lead_priority_config',
  '{
    "thresholds": { "hot": 70, "warm": 40 },
    "defaultScores": { "hot": 85, "warm": 65, "cold": 40 },
    "descriptions": {
      "hot": "Alta probabilidade de conversão",
      "warm": "Lead morno - precisa acompanhamento",
      "cold": "Sem interação recente"
    },
    "scoring": {
      "recencyBase": 15,
      "recencyPenaltyPerDay": 0.5,
      "recencyMaxDays": 60,
      "engagementMultiplier": 0.2,
      "engagementMaxPoints": 20,
      "minScore": 0,
      "maxScore": 100
    }
  }'::jsonb,
  'Lead priority configuration (thresholds, descriptions, scoring params)'
)
on conflict (key) do nothing;

-- Se você quiser FORÇAR atualização mesmo quando já existir, use este UPDATE (descomente):
-- update public.system_settings
-- set value = '{
--   "thresholds": { "hot": 70, "warm": 40 },
--   "defaultScores": { "hot": 85, "warm": 65, "cold": 40 },
--   "descriptions": {
--     "hot": "Alta probabilidade de conversão",
--     "warm": "Lead morno - precisa acompanhamento",
--     "cold": "Sem interação recente"
--   },
--   "scoring": {
--     "recencyBase": 15,
--     "recencyPenaltyPerDay": 0.5,
--     "recencyMaxDays": 60,
--     "engagementMultiplier": 0.2,
--     "engagementMaxPoints": 20,
--     "minScore": 0,
--     "maxScore": 100
--   }
-- }'::jsonb,
-- description = 'Lead priority configuration (thresholds, descriptions, scoring params)',
-- updated_at = now()
-- where key = 'lead_priority_config';

commit;
