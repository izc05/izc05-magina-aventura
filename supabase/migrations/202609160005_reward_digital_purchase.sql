create or replace function public.purchase_digital_reward(
  p_user_id uuid,
  p_reward_id uuid,
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
  v_existing_spend public.olive_ledger%rowtype;
  v_existing_entitlement public.reward_entitlements%rowtype;
  v_previous_count integer;
  v_spend_source_key text;
  v_entitlement_source_key text;
  v_entitlement_id uuid;
begin
  if p_user_id is null or p_reward_id is null then
    raise exception 'user and reward are required' using errcode = '22023';
  end if;

  if p_idempotency_key is null or char_length(btrim(p_idempotency_key)) = 0 then
    raise exception 'idempotency key is required' using errcode = '22023';
  end if;

  v_spend_source_key := 'digital-purchase:' || btrim(p_idempotency_key) || ':spend';
  v_entitlement_source_key := 'digital-purchase:' || btrim(p_idempotency_key) || ':entitlement';

  select * into v_existing_spend
  from public.olive_ledger
  where source_key = v_spend_source_key;

  if found then
    if v_existing_spend.user_id <> p_user_id
       or v_existing_spend.movement_type <> 'spend'
       or v_existing_spend.metadata->>'rewardId' is distinct from p_reward_id::text then
      raise exception 'conflicting digital purchase replay' using errcode = '23505';
    end if;

    select * into v_existing_entitlement
    from public.reward_entitlements
    where source_key = v_entitlement_source_key;

    if not found
       or v_existing_entitlement.user_id <> p_user_id
       or v_existing_entitlement.reward_id <> p_reward_id then
      raise exception 'digital purchase replay is inconsistent' using errcode = '55000';
    end if;

    select * into v_wallet
    from public.olive_wallets
    where user_id = p_user_id;

    return jsonb_build_object(
      'status', 'already-purchased',
      'rewardId', p_reward_id,
      'entitlementId', v_existing_entitlement.id,
      'available', coalesce(v_wallet.available, 0),
      'lifetimeSpent', coalesce(v_wallet.lifetime_spent, 0)
    );
  end if;

  insert into public.olive_wallets (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select * into v_wallet
  from public.olive_wallets
  where user_id = p_user_id
  for update;

  select * into v_reward
  from public.reward_catalog_items
  where id = p_reward_id;

  if not found or not v_reward.active then
    raise exception 'reward unavailable' using errcode = '55000';
  end if;

  if v_reward.reward_type <> 'digital' then
    raise exception 'reward is not digital' using errcode = '55000';
  end if;

  if v_reward.starts_at is not null and now() < v_reward.starts_at then
    raise exception 'reward has not started' using errcode = '55000';
  end if;

  if v_reward.ends_at is not null and now() > v_reward.ends_at then
    raise exception 'reward expired' using errcode = '55000';
  end if;

  if v_reward.olive_cost <= 0 then
    raise exception 'digital reward has invalid olive cost' using errcode = '55000';
  end if;

  select count(*)::integer into v_previous_count
  from public.reward_entitlements re
  where re.user_id = p_user_id
    and re.reward_id = p_reward_id;

  if not v_reward.repeatable and v_previous_count >= 1 then
    raise exception 'reward user limit reached' using errcode = '55000';
  end if;

  if v_reward.per_user_limit is not null and v_previous_count >= v_reward.per_user_limit then
    raise exception 'reward user limit reached' using errcode = '55000';
  end if;

  if v_wallet.available < v_reward.olive_cost then
    raise exception 'insufficient olives' using errcode = '55000';
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
    p_user_id,
    'spend',
    v_reward.olive_cost,
    v_spend_source_key,
    null,
    now(),
    jsonb_build_object(
      'rewardId', p_reward_id,
      'purchaseKey', btrim(p_idempotency_key)
    )
  );

  update public.olive_wallets
  set
    available = available - v_reward.olive_cost,
    lifetime_spent = lifetime_spent + v_reward.olive_cost,
    updated_at = now()
  where user_id = p_user_id
  returning * into v_wallet;

  v_entitlement_id := gen_random_uuid();

  insert into public.reward_entitlements (
    id,
    user_id,
    reward_id,
    source_key,
    quantity,
    acquired_at,
    metadata
  ) values (
    v_entitlement_id,
    p_user_id,
    p_reward_id,
    v_entitlement_source_key,
    1,
    now(),
    jsonb_build_object(
      'digitalAssetKey', v_reward.digital_asset_key,
      'purchaseKey', btrim(p_idempotency_key)
    )
  );

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
    'reward.digital-purchase',
    'entitlement',
    v_entitlement_id,
    jsonb_build_object(
      'rewardId', p_reward_id,
      'oliveCost', v_reward.olive_cost,
      'purchaseKey', btrim(p_idempotency_key),
      'digitalAssetKey', v_reward.digital_asset_key
    )
  );

  return jsonb_build_object(
    'status', 'purchased',
    'rewardId', p_reward_id,
    'entitlementId', v_entitlement_id,
    'available', v_wallet.available,
    'lifetimeSpent', v_wallet.lifetime_spent
  );
end;
$$;

revoke all on function public.purchase_digital_reward(uuid, uuid, text) from public;
grant execute on function public.purchase_digital_reward(uuid, uuid, text) to service_role;
