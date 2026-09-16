create or replace function public.credit_reward_olives(
  p_user_id uuid,
  p_amount integer,
  p_source_key text,
  p_occurred_at timestamptz,
  p_metadata jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.olive_ledger%rowtype;
  v_wallet public.olive_wallets%rowtype;
begin
  if p_user_id is null then
    raise exception 'user id is required' using errcode = '22023';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive' using errcode = '22023';
  end if;
  if p_source_key is null or char_length(btrim(p_source_key)) = 0 then
    raise exception 'source key is required' using errcode = '22023';
  end if;
  if p_occurred_at is null then
    raise exception 'occurred_at is required' using errcode = '22023';
  end if;

  select * into v_existing
  from public.olive_ledger
  where source_key = btrim(p_source_key);

  if found then
    if v_existing.user_id <> p_user_id
       or v_existing.movement_type <> 'grant'
       or v_existing.amount <> p_amount then
      raise exception 'conflicting olive credit replay' using errcode = '23505';
    end if;

    select * into v_wallet
    from public.olive_wallets
    where user_id = p_user_id;

    return jsonb_build_object(
      'status', 'already-credited',
      'available', coalesce(v_wallet.available, 0),
      'reserved', coalesce(v_wallet.reserved, 0)
    );
  end if;

  insert into public.olive_wallets (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select * into v_wallet
  from public.olive_wallets
  where user_id = p_user_id
  for update;

  insert into public.olive_ledger (
    user_id,
    movement_type,
    amount,
    source_key,
    reservation_id,
    occurred_at,
    metadata
  ) values (
    p_user_id,
    'grant',
    p_amount,
    btrim(p_source_key),
    null,
    p_occurred_at,
    coalesce(p_metadata, '{}'::jsonb)
  );

  update public.olive_wallets
  set
    available = available + p_amount,
    lifetime_granted = lifetime_granted + p_amount,
    updated_at = now()
  where user_id = p_user_id
  returning * into v_wallet;

  insert into public.reward_audit_log (
    actor_user_id,
    action,
    subject_type,
    subject_id,
    metadata,
    occurred_at
  ) values (
    null,
    'olive.credit',
    'wallet',
    p_user_id,
    jsonb_build_object(
      'amount', p_amount,
      'sourceKey', btrim(p_source_key)
    ),
    p_occurred_at
  );

  return jsonb_build_object(
    'status', 'credited',
    'available', v_wallet.available,
    'reserved', v_wallet.reserved
  );
end;
$$;

revoke all on function public.credit_reward_olives(uuid, integer, text, timestamptz, jsonb) from public;
grant execute on function public.credit_reward_olives(uuid, integer, text, timestamptz, jsonb) to service_role;

create or replace function public.rotate_reward_redemption_token(
  p_reservation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation public.reward_reservations%rowtype;
  v_token text;
  v_token_hash text;
  v_credential_id uuid;
  v_actor uuid := auth.uid();
begin
  select * into v_reservation
  from public.reward_reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'reservation not found' using errcode = 'P0002';
  end if;

  if v_actor is not null and v_actor <> v_reservation.user_id then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if v_reservation.status <> 'reserved' then
    raise exception 'reservation is not active' using errcode = '55000';
  end if;

  if v_reservation.expires_at <= now() then
    raise exception 'reservation expired' using errcode = '55000';
  end if;

  update public.reward_redemption_credentials
  set
    status = 'revoked',
    revoked_at = now()
  where reservation_id = p_reservation_id
    and status = 'active';

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_token_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');
  v_credential_id := gen_random_uuid();

  insert into public.reward_redemption_credentials (
    id,
    reservation_id,
    token_hash,
    status,
    issued_at,
    expires_at
  ) values (
    v_credential_id,
    p_reservation_id,
    v_token_hash,
    'active',
    now(),
    v_reservation.expires_at
  );

  insert into public.reward_audit_log (
    actor_user_id,
    partner_id,
    action,
    subject_type,
    subject_id,
    metadata
  ) values (
    v_actor,
    v_reservation.partner_id,
    'redemption-token.rotate',
    'reservation',
    p_reservation_id,
    jsonb_build_object('credentialId', v_credential_id)
  );

  return jsonb_build_object(
    'credentialId', v_credential_id,
    'reservationId', p_reservation_id,
    'token', v_token,
    'expiresAt', v_reservation.expires_at
  );
end;
$$;

revoke all on function public.rotate_reward_redemption_token(uuid) from public;
grant execute on function public.rotate_reward_redemption_token(uuid) to authenticated, service_role;

create or replace function public.reserve_physical_reward(
  p_user_id uuid,
  p_reward_id uuid,
  p_pickup_location_id uuid,
  p_expires_at timestamptz,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_wallet public.olive_wallets%rowtype;
  v_reward public.reward_catalog_items%rowtype;
  v_location public.reward_pickup_locations%rowtype;
  v_inventory public.reward_inventory%rowtype;
  v_existing public.reward_reservations%rowtype;
  v_reservation_id uuid;
  v_token_result jsonb;
  v_previous_count integer;
begin
  if p_user_id is null or p_reward_id is null or p_pickup_location_id is null then
    raise exception 'user, reward and pickup location are required' using errcode = '22023';
  end if;
  if p_idempotency_key is null or char_length(btrim(p_idempotency_key)) = 0 then
    raise exception 'idempotency key is required' using errcode = '22023';
  end if;
  if p_expires_at is null or p_expires_at <= now() then
    raise exception 'reservation expiry must be in the future' using errcode = '22023';
  end if;

  insert into public.olive_wallets (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select * into v_wallet
  from public.olive_wallets
  where user_id = p_user_id
  for update;

  select * into v_existing
  from public.reward_reservations
  where user_id = p_user_id
    and idempotency_key = btrim(p_idempotency_key)
  for update;

  if found then
    if v_existing.reward_id <> p_reward_id
       or v_existing.pickup_location_id is distinct from p_pickup_location_id then
      raise exception 'conflicting reservation replay' using errcode = '23505';
    end if;

    if v_existing.status <> 'reserved' then
      return jsonb_build_object(
        'status', v_existing.status,
        'reservationId', v_existing.id,
        'rewardId', v_existing.reward_id,
        'expiresAt', v_existing.expires_at
      );
    end if;

    v_token_result := public.rotate_reward_redemption_token(v_existing.id);
    return jsonb_build_object(
      'status', 'reserved',
      'reservationId', v_existing.id,
      'rewardId', v_existing.reward_id,
      'token', v_token_result->>'token',
      'expiresAt', v_existing.expires_at
    );
  end if;

  select * into v_reward
  from public.reward_catalog_items
  where id = p_reward_id;

  if not found or not v_reward.active then
    raise exception 'reward unavailable' using errcode = '55000';
  end if;
  if v_reward.reward_type = 'digital' then
    raise exception 'digital reward is not reservable' using errcode = '55000';
  end if;
  if v_reward.partner_id is null then
    raise exception 'physical reward requires a partner' using errcode = '55000';
  end if;
  if v_reward.olive_cost <= 0 then
    raise exception 'physical reward has invalid olive cost' using errcode = '55000';
  end if;
  if v_reward.starts_at is not null and now() < v_reward.starts_at then
    raise exception 'reward has not started' using errcode = '55000';
  end if;
  if v_reward.ends_at is not null and now() > v_reward.ends_at then
    raise exception 'reward expired' using errcode = '55000';
  end if;

  select * into v_location
  from public.reward_pickup_locations
  where id = p_pickup_location_id;

  if not found or not v_location.active or v_location.partner_id <> v_reward.partner_id then
    raise exception 'pickup location unavailable' using errcode = '55000';
  end if;

  select count(*)::integer into v_previous_count
  from public.reward_reservations rr
  where rr.user_id = p_user_id
    and rr.reward_id = p_reward_id
    and rr.status in ('reserved', 'redeemed');

  if not v_reward.repeatable and v_previous_count >= 1 then
    raise exception 'reward user limit reached' using errcode = '55000';
  end if;
  if v_reward.per_user_limit is not null and v_previous_count >= v_reward.per_user_limit then
    raise exception 'reward user limit reached' using errcode = '55000';
  end if;

  if v_wallet.available < v_reward.olive_cost then
    raise exception 'insufficient olives' using errcode = '55000';
  end if;

  if v_reward.stock_mode = 'tracked' then
    select * into v_inventory
    from public.reward_inventory
    where reward_id = p_reward_id
      and pickup_location_id = p_pickup_location_id
    for update;

    if not found or v_inventory.available_quantity < 1 then
      raise exception 'reward out of stock' using errcode = '55000';
    end if;
  end if;

  v_reservation_id := gen_random_uuid();

  insert into public.reward_reservations (
    id,
    user_id,
    reward_id,
    partner_id,
    pickup_location_id,
    status,
    olive_cost,
    idempotency_key,
    reserved_at,
    expires_at
  ) values (
    v_reservation_id,
    p_user_id,
    p_reward_id,
    v_reward.partner_id,
    p_pickup_location_id,
    'reserved',
    v_reward.olive_cost,
    btrim(p_idempotency_key),
    now(),
    p_expires_at
  );

  insert into public.olive_ledger (
    user_id,
    movement_type,
    amount,
    source_key,
    reservation_id,
    occurred_at,
    metadata
  ) values (
    p_user_id,
    'reserve',
    v_reward.olive_cost,
    'reservation:' || v_reservation_id::text || ':olives',
    v_reservation_id,
    now(),
    jsonb_build_object('rewardId', p_reward_id)
  );

  update public.olive_wallets
  set
    available = available - v_reward.olive_cost,
    reserved = reserved + v_reward.olive_cost,
    updated_at = now()
  where user_id = p_user_id;

  if v_reward.stock_mode = 'tracked' then
    update public.reward_inventory
    set
      available_quantity = available_quantity - 1,
      reserved_quantity = reserved_quantity + 1,
      updated_at = now()
    where id = v_inventory.id;
  end if;

  insert into public.reward_audit_log (
    actor_user_id,
    partner_id,
    action,
    subject_type,
    subject_id,
    metadata
  ) values (
    p_user_id,
    v_reward.partner_id,
    'reward.reserve',
    'reservation',
    v_reservation_id,
    jsonb_build_object(
      'rewardId', p_reward_id,
      'oliveCost', v_reward.olive_cost,
      'pickupLocationId', p_pickup_location_id
    )
  );

  v_token_result := public.rotate_reward_redemption_token(v_reservation_id);

  return jsonb_build_object(
    'status', 'reserved',
    'reservationId', v_reservation_id,
    'rewardId', p_reward_id,
    'token', v_token_result->>'token',
    'expiresAt', p_expires_at
  );
end;
$$;

revoke all on function public.reserve_physical_reward(uuid, uuid, uuid, timestamptz, text) from public;
grant execute on function public.reserve_physical_reward(uuid, uuid, uuid, timestamptz, text) to service_role;

create or replace function public.validate_reward_redemption_token(
  p_token text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token_hash text;
  v_credential public.reward_redemption_credentials%rowtype;
  v_reservation public.reward_reservations%rowtype;
  v_reward public.reward_catalog_items%rowtype;
  v_actor uuid := auth.uid();
  v_authorized boolean;
begin
  if p_token is null or char_length(btrim(p_token)) < 32 then
    return jsonb_build_object('valid', false, 'reason', 'invalid-token');
  end if;

  v_token_hash := encode(extensions.digest(btrim(p_token), 'sha256'), 'hex');

  select * into v_credential
  from public.reward_redemption_credentials
  where token_hash = v_token_hash;

  if not found then
    return jsonb_build_object('valid', false, 'reason', 'invalid-token');
  end if;

  select * into v_reservation
  from public.reward_reservations
  where id = v_credential.reservation_id;

  if not found then
    return jsonb_build_object('valid', false, 'reason', 'invalid-token');
  end if;

  select exists (
    select 1
    from public.reward_partner_memberships rpm
    where rpm.partner_id = v_reservation.partner_id
      and rpm.user_id = v_actor
      and rpm.active = true
      and rpm.role in ('admin', 'operator')
  ) into v_authorized;

  if v_actor is null or not v_authorized then
    return jsonb_build_object('valid', false, 'reason', 'not-authorized');
  end if;

  if v_credential.status <> 'active' then
    return jsonb_build_object('valid', false, 'reason', 'credential-not-active');
  end if;
  if v_credential.expires_at <= now() or v_reservation.expires_at <= now() then
    return jsonb_build_object('valid', false, 'reason', 'expired');
  end if;
  if v_reservation.status <> 'reserved' then
    return jsonb_build_object('valid', false, 'reason', 'reservation-not-active');
  end if;

  select * into v_reward
  from public.reward_catalog_items
  where id = v_reservation.reward_id;

  return jsonb_build_object(
    'valid', true,
    'reservationId', v_reservation.id,
    'rewardId', v_reservation.reward_id,
    'rewardName', v_reward.name,
    'partnerId', v_reservation.partner_id,
    'pickupLocationId', v_reservation.pickup_location_id,
    'expiresAt', least(v_reservation.expires_at, v_credential.expires_at)
  );
end;
$$;

revoke all on function public.validate_reward_redemption_token(text) from public;
grant execute on function public.validate_reward_redemption_token(text) to authenticated, service_role;

create or replace function public.confirm_reward_redemption(
  p_token text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token_hash text;
  v_credential public.reward_redemption_credentials%rowtype;
  v_reservation public.reward_reservations%rowtype;
  v_reward public.reward_catalog_items%rowtype;
  v_inventory public.reward_inventory%rowtype;
  v_wallet public.olive_wallets%rowtype;
  v_existing_redemption public.reward_redemptions%rowtype;
  v_actor uuid := auth.uid();
  v_authorized boolean;
  v_redemption_id uuid;
begin
  if p_token is null or char_length(btrim(p_token)) < 32 then
    return jsonb_build_object('status', 'invalid-token');
  end if;
  if p_idempotency_key is null or char_length(btrim(p_idempotency_key)) = 0 then
    raise exception 'idempotency key is required' using errcode = '22023';
  end if;

  v_token_hash := encode(extensions.digest(btrim(p_token), 'sha256'), 'hex');

  select * into v_credential
  from public.reward_redemption_credentials
  where token_hash = v_token_hash
  for update;

  if not found then
    return jsonb_build_object('status', 'invalid-token');
  end if;

  select * into v_reservation
  from public.reward_reservations
  where id = v_credential.reservation_id
  for update;

  if not found then
    return jsonb_build_object('status', 'invalid-token');
  end if;

  select exists (
    select 1
    from public.reward_partner_memberships rpm
    where rpm.partner_id = v_reservation.partner_id
      and rpm.user_id = v_actor
      and rpm.active = true
      and rpm.role in ('admin', 'operator')
  ) into v_authorized;

  if v_actor is null or not v_authorized then
    return jsonb_build_object('status', 'not-authorized');
  end if;

  select * into v_existing_redemption
  from public.reward_redemptions
  where reservation_id = v_reservation.id;

  if found then
    return jsonb_build_object(
      'status', 'already-redeemed',
      'redemptionId', v_existing_redemption.id,
      'reservationId', v_reservation.id
    );
  end if;

  if v_credential.status <> 'active' then
    return jsonb_build_object('status', 'credential-not-active');
  end if;
  if v_credential.expires_at <= now() or v_reservation.expires_at <= now() then
    return jsonb_build_object('status', 'expired');
  end if;
  if v_reservation.status <> 'reserved' then
    return jsonb_build_object('status', 'reservation-not-active');
  end if;

  select * into v_reward
  from public.reward_catalog_items
  where id = v_reservation.reward_id;

  select * into v_wallet
  from public.olive_wallets
  where user_id = v_reservation.user_id
  for update;

  if not found or v_wallet.reserved < v_reservation.olive_cost then
    raise exception 'reserved olive balance inconsistent' using errcode = '55000';
  end if;

  if v_reward.stock_mode = 'tracked' then
    select * into v_inventory
    from public.reward_inventory
    where reward_id = v_reservation.reward_id
      and pickup_location_id = v_reservation.pickup_location_id
    for update;

    if not found or v_inventory.reserved_quantity < 1 then
      raise exception 'reserved inventory inconsistent' using errcode = '55000';
    end if;
  end if;

  v_redemption_id := gen_random_uuid();

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
    'spend',
    v_reservation.olive_cost,
    'redemption:' || v_reservation.id::text || ':olives',
    v_reservation.id,
    now(),
    jsonb_build_object('redemptionId', v_redemption_id)
  );

  update public.olive_wallets
  set
    reserved = reserved - v_reservation.olive_cost,
    lifetime_spent = lifetime_spent + v_reservation.olive_cost,
    updated_at = now()
  where user_id = v_reservation.user_id;

  if v_reward.stock_mode = 'tracked' then
    update public.reward_inventory
    set
      reserved_quantity = reserved_quantity - 1,
      updated_at = now()
    where id = v_inventory.id;
  end if;

  update public.reward_redemption_credentials
  set
    status = 'consumed',
    consumed_at = now()
  where id = v_credential.id;

  update public.reward_reservations
  set
    status = 'redeemed',
    closed_at = now()
  where id = v_reservation.id;

  insert into public.reward_redemptions (
    id,
    reservation_id,
    credential_id,
    reward_id,
    partner_id,
    pickup_location_id,
    operator_user_id,
    idempotency_key,
    redeemed_at
  ) values (
    v_redemption_id,
    v_reservation.id,
    v_credential.id,
    v_reservation.reward_id,
    v_reservation.partner_id,
    v_reservation.pickup_location_id,
    v_actor,
    btrim(p_idempotency_key),
    now()
  );

  insert into public.reward_audit_log (
    actor_user_id,
    partner_id,
    action,
    subject_type,
    subject_id,
    metadata
  ) values (
    v_actor,
    v_reservation.partner_id,
    'reward.redeem',
    'redemption',
    v_redemption_id,
    jsonb_build_object(
      'reservationId', v_reservation.id,
      'rewardId', v_reservation.reward_id,
      'oliveCost', v_reservation.olive_cost
    )
  );

  return jsonb_build_object(
    'status', 'redeemed',
    'redemptionId', v_redemption_id,
    'reservationId', v_reservation.id,
    'rewardId', v_reservation.reward_id,
    'redeemedAt', now()
  );
end;
$$;

revoke all on function public.confirm_reward_redemption(text, text) from public;
grant execute on function public.confirm_reward_redemption(text, text) to authenticated, service_role;

create or replace function public.cancel_reward_reservation(
  p_reservation_id uuid,
  p_reason text
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
  v_actor uuid := auth.uid();
begin
  select * into v_reservation
  from public.reward_reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'reservation not found' using errcode = 'P0002';
  end if;

  if v_actor is not null and v_actor <> v_reservation.user_id then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if v_reservation.status <> 'reserved' then
    return jsonb_build_object(
      'status', v_reservation.status,
      'reservationId', v_reservation.id
    );
  end if;

  select * into v_reward
  from public.reward_catalog_items
  where id = v_reservation.reward_id;

  select * into v_wallet
  from public.olive_wallets
  where user_id = v_reservation.user_id
  for update;

  if not found or v_wallet.reserved < v_reservation.olive_cost then
    raise exception 'reserved olive balance inconsistent' using errcode = '55000';
  end if;

  if v_reward.stock_mode = 'tracked' then
    select * into v_inventory
    from public.reward_inventory
    where reward_id = v_reservation.reward_id
      and pickup_location_id = v_reservation.pickup_location_id
    for update;

    if not found or v_inventory.reserved_quantity < 1 then
      raise exception 'reserved inventory inconsistent' using errcode = '55000';
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
    'reservation:' || v_reservation.id::text || ':release',
    v_reservation.id,
    now(),
    jsonb_build_object('reason', coalesce(nullif(btrim(p_reason), ''), 'cancelled'))
  );

  update public.olive_wallets
  set
    available = available + v_reservation.olive_cost,
    reserved = reserved - v_reservation.olive_cost,
    updated_at = now()
  where user_id = v_reservation.user_id;

  if v_reward.stock_mode = 'tracked' then
    update public.reward_inventory
    set
      available_quantity = available_quantity + 1,
      reserved_quantity = reserved_quantity - 1,
      updated_at = now()
    where id = v_inventory.id;
  end if;

  update public.reward_redemption_credentials
  set
    status = 'revoked',
    revoked_at = now()
  where reservation_id = v_reservation.id
    and status = 'active';

  update public.reward_reservations
  set
    status = 'cancelled',
    closed_at = now(),
    metadata = metadata || jsonb_build_object(
      'cancelReason', coalesce(nullif(btrim(p_reason), ''), 'cancelled')
    )
  where id = v_reservation.id;

  insert into public.reward_audit_log (
    actor_user_id,
    partner_id,
    action,
    subject_type,
    subject_id,
    metadata
  ) values (
    coalesce(v_actor, v_reservation.user_id),
    v_reservation.partner_id,
    'reward.cancel',
    'reservation',
    v_reservation.id,
    jsonb_build_object(
      'reason', coalesce(nullif(btrim(p_reason), ''), 'cancelled'),
      'oliveCost', v_reservation.olive_cost
    )
  );

  return jsonb_build_object(
    'status', 'cancelled',
    'reservationId', v_reservation.id
  );
end;
$$;

revoke all on function public.cancel_reward_reservation(uuid, text) from public;
grant execute on function public.cancel_reward_reservation(uuid, text) to authenticated, service_role;
