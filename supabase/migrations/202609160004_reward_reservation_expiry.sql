create or replace function public.expire_reward_reservations(
  p_now timestamptz,
  p_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation public.reward_reservations%rowtype;
  v_reward public.reward_catalog_items%rowtype;
  v_inventory public.reward_inventory%rowtype;
  v_wallet public.olive_wallets%rowtype;
  v_expired_count integer := 0;
begin
  if p_now is null then
    raise exception 'expiry timestamp is required' using errcode = '22023';
  end if;

  if p_limit is null or p_limit < 1 or p_limit > 500 then
    raise exception 'expiry batch limit must be between 1 and 500' using errcode = '22023';
  end if;

  for v_reservation in
    select rr.*
    from public.reward_reservations rr
    where rr.status = 'reserved'
      and rr.expires_at <= p_now
    order by rr.expires_at, rr.id
    limit p_limit
    for update skip locked
  loop
    select * into v_reward
    from public.reward_catalog_items
    where id = v_reservation.reward_id;

    if not found then
      raise exception 'reward missing for reservation %', v_reservation.id
        using errcode = '55000';
    end if;

    select * into v_wallet
    from public.olive_wallets
    where user_id = v_reservation.user_id
    for update;

    if not found or v_wallet.reserved < v_reservation.olive_cost then
      raise exception 'reserved olive balance inconsistent for reservation %', v_reservation.id
        using errcode = '55000';
    end if;

    if v_reward.stock_mode = 'tracked' then
      select * into v_inventory
      from public.reward_inventory
      where reward_id = v_reservation.reward_id
        and pickup_location_id = v_reservation.pickup_location_id
      for update;

      if not found or v_inventory.reserved_quantity < 1 then
        raise exception 'reserved inventory inconsistent for reservation %', v_reservation.id
          using errcode = '55000';
      end if;
    end if;

    insert into public.olive_ledger (
      user_id,
      movement_type,
      amount,
      source_key,
      reservation_id,
      occurred_at,
      metadata
    ) values (
      v_reservation.user_id,
      'release',
      v_reservation.olive_cost,
      'reservation:' || v_reservation.id::text || ':expiry-release',
      v_reservation.id,
      p_now,
      jsonb_build_object('reason', 'expired')
    );

    update public.olive_wallets
    set
      available = available + v_reservation.olive_cost,
      reserved = reserved - v_reservation.olive_cost,
      updated_at = p_now
    where user_id = v_reservation.user_id;

    if v_reward.stock_mode = 'tracked' then
      update public.reward_inventory
      set
        available_quantity = available_quantity + 1,
        reserved_quantity = reserved_quantity - 1,
        updated_at = p_now
      where id = v_inventory.id;
    end if;

    update public.reward_redemption_credentials
    set status = 'expired'
    where reservation_id = v_reservation.id
      and status = 'active';

    update public.reward_reservations
    set
      status = 'expired',
      closed_at = p_now,
      metadata = metadata || jsonb_build_object('expiredAt', p_now)
    where id = v_reservation.id;

    insert into public.reward_audit_log (
      actor_user_id,
      partner_id,
      action,
      subject_type,
      subject_id,
      metadata,
      occurred_at
    ) values (
      null,
      v_reservation.partner_id,
      'reward.expire',
      'reservation',
      v_reservation.id,
      jsonb_build_object(
        'rewardId', v_reservation.reward_id,
        'oliveCost', v_reservation.olive_cost,
        'pickupLocationId', v_reservation.pickup_location_id
      ),
      p_now
    );

    v_expired_count := v_expired_count + 1;
  end loop;

  return jsonb_build_object(
    'status', 'ok',
    'expiredCount', v_expired_count,
    'processedAt', p_now
  );
end;
$$;

revoke all on function public.expire_reward_reservations(timestamptz, integer) from public;
revoke all on function public.expire_reward_reservations(timestamptz, integer) from anon;
revoke all on function public.expire_reward_reservations(timestamptz, integer) from authenticated;
grant execute on function public.expire_reward_reservations(timestamptz, integer) to service_role;
