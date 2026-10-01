-- Harden append-only administrative ledgers against direct Data API writes.
-- Mutations continue to happen only through narrowly scoped SECURITY DEFINER functions.

revoke insert, update, delete, truncate, references, trigger
  on public.admin_audit_log
  from anon, authenticated;

revoke insert, update, delete, truncate, references, trigger
  on public.olive_transactions
  from anon, authenticated;

-- Keep read access available; RLS restricts rows to the appropriate audience.
grant select on public.admin_audit_log to authenticated;
grant select on public.olive_transactions to authenticated;
