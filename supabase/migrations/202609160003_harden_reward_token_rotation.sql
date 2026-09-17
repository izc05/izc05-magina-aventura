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
begin
  select * into v_reservation
  from public.reward_reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'reservation not found' using errcode = 'P0002';
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
    null,
    v_reservation.partner_id,
    'redemption-token.rotate',
    'reservation',
    p_reservation_id,
    jsonb_build_object(
      'credentialId', v_credential_id,
      'issuedForUserId', v_reservation.user_id
    )
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
revoke all on function public.rotate_reward_redemption_token(uuid) from anon;
revoke all on function public.rotate_reward_redemption_token(uuid) from authenticated;
grant execute on function public.rotate_reward_redemption_token(uuid) to service_role;
