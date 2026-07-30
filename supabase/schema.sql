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

create index if not exists financial_accounts_user_id_idx on public.financial_accounts(user_id);
create index if not exists plaid_items_user_id_idx on public.plaid_items(user_id);

alter table public.plaid_items enable row level security;
alter table public.financial_accounts enable row level security;

-- Only server-side code using the service-role key can access encrypted Plaid tokens.
-- Signed-in users may view only their own non-sensitive account display data.
create policy "Users can view their own financial accounts"
on public.financial_accounts for select to authenticated
using ((select auth.uid()) = user_id);

grant select on public.financial_accounts to authenticated;

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
