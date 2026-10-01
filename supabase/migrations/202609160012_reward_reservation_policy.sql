create or replace function private.reserve_reward(target_reward_id uuid, actor uuid default auth.uid())
returns text
language plpgsql
security definer
set search_path=''
as $$
declare
  rw public.rewards%rowtype;
  balance integer;
  token text;
  redemption_id uuid;
  used_count integer;
  reservation_minutes integer := 60;
  user_state text;
begin
  if actor is null then raise exception 'authentication required'; end if;

  select status into user_state from public.user_moderation_states where user_id=actor;
  if user_state='suspended' then raise exception 'user suspended'; end if;

  select * into rw from public.rewards where id=target_reward_id for update;
  if rw.id is null
     or not rw.active
     or rw.stock<=0
     or rw.valid_from>now()
     or (rw.valid_until is not null and rw.valid_until<=now())
     or not exists(select 1 from public.reward_partners p where p.id=rw.partner_id and p.active)
  then
    raise exception 'reward unavailable';
  end if;

  select coalesce(sum(amount),0)::integer into balance from public.olive_transactions where user_id=actor;
  if balance < rw.olive_cost then raise exception 'insufficient olives'; end if;

  select count(*) into used_count
  from public.reward_redemptions
  where user_id=actor and reward_id=rw.id and status in ('reserved','redeemed');
  if used_count >= rw.per_user_limit then raise exception 'reward limit reached'; end if;

  begin
    select greatest(5,least(10080,(value #>> '{}')::integer))
    into reservation_minutes
    from public.app_settings
    where key='rewards.reservation_minutes';
  exception when others then
    reservation_minutes := 60;
  end;
  reservation_minutes := coalesce(reservation_minutes,60);

  token := encode(extensions.gen_random_bytes(24),'hex');
  update public.rewards set stock=stock-1,updated_at=now() where id=rw.id;

  insert into public.reward_redemptions(user_id,reward_id,partner_id,olive_cost,token_hash,expires_at)
  values(
    actor,
    rw.id,
    rw.partner_id,
    rw.olive_cost,
    encode(extensions.digest(token,'sha256'),'hex'),
    now()+make_interval(mins=>reservation_minutes)
  )
  returning id into redemption_id;

  insert into public.olive_transactions(user_id,amount,reason,source_type,source_id,actor_user_id)
  values(actor,-rw.olive_cost,'Reserva de premio','reward_redemption',redemption_id::text,actor);

  perform private.write_admin_audit(
    'reward.reserve',
    'reward_redemptions',
    redemption_id::text,
    null,
    jsonb_build_object(
      'user_id',actor,
      'reward_id',rw.id,
      'partner_id',rw.partner_id,
      'olive_cost',rw.olive_cost,
      'reservation_minutes',reservation_minutes
    ),
    actor
  );
  return token;
end;
$$;

revoke all on function private.reserve_reward(uuid,uuid) from public;
grant execute on function private.reserve_reward(uuid,uuid) to authenticated;
