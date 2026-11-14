-- Foundation only. Do not treat this as a completed production backend.
-- Transaction posting functions and the UI adapter must be implemented and tested.
begin;
create table public.rf_profiles (
  user_id uuid primary key references auth.users(id),
  name text not null,
  role text not null check (role in ('owner','manager','cashier')),
  active boolean not null default true
);
create table public.rf_units (
  id text primary key check (id in ('farm','district','local','retail','admin')),
  name text not null
);
insert into public.rf_units values ('farm','Farm'),('district','District Wholesale'),('local','Local Distribution'),('retail','Raja Broilers'),('admin','Administration');
create table public.rf_access (
  user_id uuid references public.rf_profiles(user_id),
  unit_id text references public.rf_units(id),
  module text not null,
  primary key(user_id,unit_id,module)
);
create schema if not exists rf_private;
revoke all on schema rf_private from public;
grant usage on schema rf_private to authenticated;
create function rf_private.can_read(u text, m text) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.rf_profiles p where p.user_id=auth.uid() and p.active
 and (p.role='owner' or exists(select 1 from public.rf_access a where a.user_id=p.user_id and a.unit_id=u and a.module=m)))
$$;
revoke all on function rf_private.can_read(text,text) from public;
grant execute on function rf_private.can_read(text,text) to authenticated;

create table public.rf_parties (
 id uuid primary key default gen_random_uuid(), unit_id text not null references public.rf_units(id),
 name text not null, kind text not null check(kind in ('buyer','hotel','counter','supplier')),
 contact text, phone text, address text, district text, route text,
 credit_days integer not null default 0 check(credit_days>=0),
 credit_limit numeric(14,2) check(credit_limit>=0),
 opening_balance numeric(14,2) not null default 0, opening_date date not null,
 unique(id,unit_id)
);
create table public.rf_invoices (
 id uuid primary key default gen_random_uuid(), unit_id text not null references public.rf_units(id),
 number text not null, party_id uuid not null, date date not null,
 status text not null default 'draft' check(status in ('draft','posted','void')),
 transport numeric(14,2) not null default 0 check(transport>=0),
 discount numeric(14,2) not null default 0 check(discount>=0),
 vehicle text, driver text, note text, void_reason text,
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 unique(unit_id,number), unique(id,unit_id),
 foreign key(party_id,unit_id) references public.rf_parties(id,unit_id),
 check(status<>'void' or length(trim(void_reason))>0)
);
create table public.rf_stock_movements (
 id uuid primary key default gen_random_uuid(), unit_id text not null references public.rf_units(id),
 item_id text not null, batch_id text, date date not null, quantity numeric(14,3) not null check(quantity<>0),
 uom text not null check(uom in ('bird','kg','bag','piece')), reason text not null,
 transfer_id uuid, invoice_id uuid references public.rf_invoices(id),
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table public.rf_audit (
 id bigint generated always as identity primary key, unit_id text not null references public.rf_units(id),
 actor uuid not null references auth.users(id), at timestamptz not null default now(),
 action text not null, entity_id text not null, reason text, details jsonb not null default '{}'
);
alter table public.rf_profiles enable row level security;
alter table public.rf_access enable row level security;
alter table public.rf_units enable row level security;
create policy own_profile on public.rf_profiles for select to authenticated using(user_id=auth.uid());
create policy own_access on public.rf_access for select to authenticated using(user_id=auth.uid());
create policy units_read on public.rf_units for select to authenticated using(exists(select 1 from public.rf_profiles where user_id=auth.uid() and active));
alter table public.rf_parties enable row level security;
alter table public.rf_invoices enable row level security;
alter table public.rf_stock_movements enable row level security;
alter table public.rf_audit enable row level security;
create policy parties_read on public.rf_parties for select to authenticated using(rf_private.can_read(unit_id,'ledgers') or rf_private.can_read(unit_id,'billing'));
create policy invoices_read on public.rf_invoices for select to authenticated using(rf_private.can_read(unit_id,'billing') or rf_private.can_read(unit_id,'ledgers'));
create policy stock_read on public.rf_stock_movements for select to authenticated using(rf_private.can_read(unit_id,'stock'));
create policy audit_read on public.rf_audit for select to authenticated using(rf_private.can_read(unit_id,'activity'));
revoke all on public.rf_profiles,public.rf_access,public.rf_units,public.rf_parties,public.rf_invoices,public.rf_stock_movements,public.rf_audit from anon,authenticated;
grant select on public.rf_profiles,public.rf_access,public.rf_units,public.rf_parties,public.rf_invoices,public.rf_stock_movements,public.rf_audit to authenticated;
-- No client write grants: posting must go through validated, atomic server functions.
commit;
