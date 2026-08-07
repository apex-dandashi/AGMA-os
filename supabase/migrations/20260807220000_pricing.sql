-- Package B: default price per service (Odoo starts from a priced product;
-- ours started every quote from zero). Flows: catalog → scope estimate →
-- quote-from-scope prefill. NULL = «تسعير حسب النطاق».
alter table public.services_catalog
  add column default_price numeric check (default_price is null or default_price >= 0);
