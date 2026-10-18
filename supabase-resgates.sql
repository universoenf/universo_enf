-- === RESGATES UNIVERSO STARS (execute este trecho no SQL Editor) ===
create table if not exists public.star_redemptions (
 id uuid primary key,
 user_id uuid not null references public.profiles(id),
 reward_type text not null check (reward_type in ('cards4','discount10')),
 order_amount numeric(12,2) not null check (order_amount>=30),
 note text not null default '',
 redeemed_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
alter table public.star_redemptions enable row level security;
drop policy if exists "redemptions read self or admin" on public.star_redemptions;
create policy "redemptions read self or admin" on public.star_redemptions
for select to authenticated using (user_id=(select auth.uid()) or (select public.is_admin()));
create or replace function public.redeem_stars(p_user_id uuid,p_reward_type text,p_order_amount numeric,p_note text default '',p_request_id uuid default null)
returns integer language plpgsql security definer set search_path='' as $$
declare balance integer;
begin
 if not public.is_admin() then raise exception 'Acesso administrativo necessário'; end if;
 if p_user_id is null or not exists(select 1 from public.profiles where id=p_user_id) then raise exception 'Cliente não encontrado'; end if;
 if p_reward_type is null or p_reward_type not in ('cards4','discount10') then raise exception 'Recompensa inválida'; end if;
 if p_order_amount is null or p_order_amount<30 or p_order_amount>1000000 then raise exception 'Pedido mínimo de R$ 30 necessário'; end if;
 if p_request_id is null then raise exception 'Identificador obrigatório'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,2026));
 if exists(select 1 from public.star_redemptions where id=p_request_id) then
  if not exists(select 1 from public.star_redemptions where id=p_request_id and user_id=p_user_id) then raise exception 'Identificador já utilizado'; end if;
  select coalesce(sum(stars),0) into balance from public.star_ledger where user_id=p_user_id;return balance;
 end if;
 select coalesce(sum(stars),0) into balance from public.star_ledger where user_id=p_user_id;
 if balance<10 then raise exception 'Saldo insuficiente'; end if;
 insert into public.star_redemptions(id,user_id,reward_type,order_amount,note,redeemed_by)
 values(p_request_id,p_user_id,p_reward_type,round(p_order_amount,2),left(coalesce(p_note,''),500),auth.uid());
 insert into public.star_ledger(user_id,stars,note)
 values(p_user_id,-10,'Resgate: '||case when p_reward_type='cards4' then '4 cards grátis' else 'R$ 10 de desconto' end||' • '||p_request_id::text);
 return balance-10;
end $$;
revoke all on function public.redeem_stars(uuid,text,numeric,text,uuid) from public;
grant execute on function public.redeem_stars(uuid,text,numeric,text,uuid) to authenticated;
