-- Execute no SQL Editor do SEU projeto Supabase.
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '',
 email text,
 created_at timestamptz not null default now()
);
create table if not exists public.admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
create table if not exists public.purchases (
 id bigint generated always as identity primary key,
 user_id uuid not null references public.profiles(id),
 amount numeric(12,2) not null check (amount > 0),
 note text not null default '',
 confirmed_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
create table if not exists public.star_ledger (
 id bigint generated always as identity primary key,
 user_id uuid not null references public.profiles(id),
 stars integer not null,
 purchase_id bigint references public.purchases(id),
 note text not null default '',
 created_at timestamptz not null default now()
);
create unique index if not exists star_ledger_purchase_once on public.star_ledger(purchase_id) where purchase_id is not null;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.admins where user_id=(select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
create or replace function public.create_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,full_name,email) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.email)
 on conflict (id) do update set email=excluded.email;
 return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile();
alter table public.profiles enable row level security;
alter table public.admins enable row level security;
alter table public.purchases enable row level security;
alter table public.star_ledger enable row level security;
drop policy if exists "profile read self or admin" on public.profiles;
create policy "profile read self or admin" on public.profiles for select to authenticated using (id=(select auth.uid()) or (select public.is_admin()));
drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "purchases read self or admin" on public.purchases;
create policy "purchases read self or admin" on public.purchases for select to authenticated using (user_id=(select auth.uid()) or (select public.is_admin()));
drop policy if exists "ledger read self or admin" on public.star_ledger;
create policy "ledger read self or admin" on public.star_ledger for select to authenticated using (user_id=(select auth.uid()) or (select public.is_admin()));
-- Sem políticas de escrita no navegador: só a função administrativa pode confirmar compras.
create or replace function public.confirm_purchase(p_user_id uuid,p_amount numeric,p_note text default '')
returns integer language plpgsql security definer set search_path='' as $$
declare n integer; purchase_id bigint;
begin
 if not public.is_admin() then raise exception 'Acesso administrativo necessário'; end if;
 if p_amount is null or p_amount<=0 or p_amount>1000000 then raise exception 'Valor inválido'; end if;
 if not exists(select 1 from public.profiles where id=p_user_id) then raise exception 'Cliente não encontrado'; end if;
 n:=floor(p_amount/5)::integer;
 insert into public.purchases(user_id,amount,note,confirmed_by)
 values(p_user_id,round(p_amount,2),left(coalesce(p_note,''),500),auth.uid()) returning id into purchase_id;
 insert into public.star_ledger(user_id,stars,purchase_id,note)
 values(p_user_id,n,purchase_id,'Compra confirmada');
 return n;
end $$;
revoke all on function public.confirm_purchase(uuid,numeric,text) from public;
grant execute on function public.confirm_purchase(uuid,numeric,text) to authenticated;
-- APÓS criar sua conta, promova-a manualmente no SQL Editor, substituindo o e-mail:
-- insert into public.admins(user_id)
-- select id from auth.users where email='SEU_EMAIL_AQUI'
-- on conflict do nothing;
-- Não permita cadastro público de administradores.
