create extension if not exists pgcrypto;

create table if not exists public.plaid_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plaid_item_id text not null unique,
  access_token_ciphertext text not null,
  access_token_iv text not null,
  access_token_auth_tag text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plaid_item_id uuid not null references public.plaid_items(id) on delete cascade,
  plaid_account_id text not null unique,
  name text not null,
  official_name text,
  type text not null,
  subtype text,
  mask text,
  current_balance numeric,
  available_balance numeric,
  credit_limit numeric,
  iso_currency_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Manually entered credit cards are separate from Plaid accounts. They contain
-- no bank credentials and are scoped to the signed-in user.
create table if not exists public.manual_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  last_four text not null check (char_length(last_four) = 4),
  current_balance numeric not null default 0,
  credit_limit numeric not null check (credit_limit > 0),
  spending_categories jsonb not null default '[]'::jsonb,
  catalog_card_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Privacy-preserving historical spending: monthly category totals only.
-- No merchant, transaction description, or individual transaction date is retained.
create table if not exists public.monthly_spending_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  financial_account_id uuid not null references public.financial_accounts(id) on delete cascade,
  month text not null check (month ~ '^\\d{4}-(0[1-9]|1[0-2])$'),
  category text not null,
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, financial_account_id, month, category)
);

create index if not exists financial_accounts_user_id_idx on public.financial_accounts(user_id);
create index if not exists plaid_items_user_id_idx on public.plaid_items(user_id);
create index if not exists manual_cards_user_id_idx on public.manual_cards(user_id);
create index if not exists monthly_spending_summaries_user_month_idx on public.monthly_spending_summaries(user_id, month);

alter table public.plaid_items enable row level security;
alter table public.financial_accounts enable row level security;
alter table public.manual_cards enable row level security;
alter table public.monthly_spending_summaries enable row level security;

-- Only server-side code using the service-role key can access encrypted Plaid tokens.
-- Signed-in users may view only their own non-sensitive account display data.
create policy "Users can view their own financial accounts"
on public.financial_accounts for select to authenticated
using ((select auth.uid()) = user_id);

grant select on public.financial_accounts to authenticated;

create policy "Users can manage their own manual cards"
on public.manual_cards for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.manual_cards to authenticated;

create policy "Users can view their own monthly spending summaries"
on public.monthly_spending_summaries for select to authenticated
using ((select auth.uid()) = user_id);

grant select on public.monthly_spending_summaries to authenticated;

-- Create a private `avatars` bucket in the Supabase dashboard before applying
-- these policies. Users can only read and manage files inside their own folder.
create policy "Users can view their own avatars"
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can upload their own avatars"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can update their own avatars"
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can delete their own avatars"
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
