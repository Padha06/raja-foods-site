# Raja Foods CRM

This is a React/Vite browser-local demo, not a production accounting system.

## Development

Install with pnpm, run `pnpm dev`, and build with `pnpm build`.
Run regression checks with `node --test tests/accounting.test.js`.
Vercel uses the Vite preset and `dist` output directory.

## Fixes in this working copy

- Wholesale invoice headings use Raja Foods without the internal District Wholesale label.
- Fresh invoice series start at 0001 (RFD-0001, RWL-0001, RBH-0001, RBC-0001).
  Previously saved invoice numbers and linked receipts remain intact.
- Owner product management is available at More > Products and from Manage products
  in the New bill form. Products have a name, price per kg, business unit and active status.
  New retail stock can be received with a source reference. Catalog changes flow into
  billing, counter sales, stock, low-stock alerts and reports; historic bills retain
  their original descriptions/rates. Products and stock remain browser-local in this demo.

- Preserve version-4 browser records across day changes.
- Show overdue status from actual overdue amounts, including 1–7 day overdue invoices.
- Navigate cashier login/role switching to Bills.
- Worker creation includes address, joining date and active status.
- Receipt date selection and explicit unallocated account credit.
- Validate aggregated retail stock, bird counts, processing yield and payment amounts.
- Prevent repeated invoice voids and repeated route closures from restoring stock twice.
- Use local dates consistently in audit displays.
- Add annual dashboard view and make chart days match the selected period.
- Describe daily cash as net movement, not a closing cash balance.
- Replace unsupported security/ownership/backup claims with actual demo status.

## Supabase preparation — not connected

`supabase/migrations/001_foundation.sql` is a draft foundation with profiles,
module/unit read policies, parties, invoices, stock movements and audit storage.
It has not been executed or tested on a Supabase project. Client writes are denied
until validated transaction functions exist. Setting environment variables alone
does not connect the current UI to Supabase.

Still required: invoice lines, receipts/allocations, batches/feed, routes, processing,
workers/payroll and expense tables; atomic posting/reversal functions with stock
locking and idempotency; Auth integration; owner user administration; private
Storage bucket/policies and uploads; data migration; permission and concurrency tests.

Follow Supabase's official RLS documentation:
https://supabase.com/docs/guides/database/postgres/row-level-security
https://supabase.com/docs/guides/storage/security/access-control

Only the project URL and publishable key belong in browser environment variables.
Keep service-role credentials server-side. Bootstrap the first owner through trusted
administration, never from user-editable signup metadata.

## Remaining acceptance work

The audit's full requirement scope is not complete. Remaining items include master-data
editing, custom/dashboard filters, transfer/return/adjustment workflows, hotel acceptance
and returns, route planning, period payroll, opening cash and supplier payments,
download verification, cross-device persistence, backup restoration, and handover.
The expense file picker currently records only an attachment flag, not file contents.
Do not use it for real documents until private Storage is connected.

The GitHub target repository and live Supabase project must be supplied before
integration and publication. Do not replace a live production deployment with this demo.
