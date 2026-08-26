# Multi-Godown Backend Contract

This frontend expects the backend to support godown master records and to scope every godown stock movement by `godownId`.

## Godown Master

Fields:

- `id`: string
- `name`: string
- `code`: string, unique per tenant/company
- `location`: string, optional
- `address`: string, optional
- `capacityBirds`: number, optional
- `managerName`: string, optional
- `phone`: string, optional
- `status`: `active` or `inactive`
- `notes`: string, optional
- `createdAt`, `updatedAt`: ISO strings

Endpoints:

- `GET /godowns?page=&limit=&search=&status=`
- `GET /godowns/active/list`
- `GET /godowns/:id`
- `POST /godowns`
- `PATCH /godowns/:id`
- `DELETE /godowns/:id`

## Stock Movement Scoping

The following records must include `godownId`; responses should also include `godownName` where possible:

- Godown inward entries
- Godown sales
- Godown mortality
- Godown expenses when godown-specific
- Godown stock ledger entries
- Cages or stock movement rows linked to godown inventory

Existing godown endpoints should accept `godownId` as a query parameter for reads and in the JSON body for creates/updates:

- `GET /godown/summary?godownId=...`
- `GET /godown/stock-ledger?godownId=...`
- `GET /godown/inward?godownId=...`
- `GET /godown/sales?godownId=...`
- `GET /godown/mortality?godownId=...`
- `GET /godown/expenses?godownId=...`

## Migration Rules

- Create one `Default Godown` during migration.
- Backfill existing godown stock records with the default `godownId`.
- Add indexes for `godownId`, date fields, and tenant/company fields.
- Prevent hard delete of godowns that have stock movements; use inactive status instead.
- Validate sale and mortality quantities against the selected godown stock only.
