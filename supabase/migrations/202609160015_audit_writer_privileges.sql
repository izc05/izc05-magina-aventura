-- The audit writer is an internal implementation detail. Trigger functions and
-- privileged SECURITY DEFINER routines execute it as their owner; browser roles
-- must never be able to forge audit events directly.

revoke execute on function private.write_admin_audit(text,text,text,jsonb,jsonb,uuid)
  from anon, authenticated;
