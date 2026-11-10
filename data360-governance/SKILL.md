---
name: data360-governance
license: Apache-2.0
description: Enforce Salesforce Data 360 naming, source-of-truth, preflight, key-stability, and safe-change rules. Use before creating or changing Data Streams, mappings, model metadata, transforms, identity rules, calculated insights, segments, or activations.
---

# Data 360 governance

Apply the governing project convention before proposing or mutating a Data 360 asset.

## Start here

1. Locate the active repository and inspect its naming convention, current source-to-target mapping, machine-readable contracts, and deployment manifests. Do not rely on an old planning document when a newer approved artifact exists.
2. Run the project's naming validator before every mutation. Prefer a guarded project command over a lower-level command when one exists.
3. Retrieve or query the live org before creating anything. Treat repository configuration as desired state and the live org as observed state; report drift instead of silently overwriting it.
4. Require explicit authorization before deleting, replacing, or deactivating assets. An instruction to deploy does not authorize cleanup of unrelated or incompatible live definitions.
5. Verify the final runtime state. A successful HTTP response, metadata deployment, or accepted asynchronous job is not proof that a Data Stream, DLO, mapping, relationship, transform, CI, segment, or activation is usable.
6. After an authorized live mutation, invoke the project's refresh post-hook for affected dependencies. Use `$data360-refresh-orchestration` when installed; do not broaden the refresh scope beyond the assets changed or dependent on them.

## Sources of truth

Use the naming guide for project-managed names and the latest approved STTM for source fields, keys, paths, refresh behavior, and target mappings. When they conflict, record the conflict and obtain a decision; do not invent a compromise.

For the portable project configuration and review checklist, read [references/project-conventions.md](references/project-conventions.md).

## Change discipline

- Plan first with a read-only inventory and a field-level diff.
- Make operations idempotent: skip exact matches, stop on incompatible definitions, and never auto-delete or auto-replace.
- Keep credentials, private keys, session tokens, and host secrets outside source control and generated reports.
- Respect API limits with bounded retries for transient errors only. Do not retry validation failures or error-state definitions as if they were transient.
- A post-hook must inspect status before triggering work, join an existing pending run instead of duplicating it, enforce stage timeouts, and stop downstream processing after failure or timeout.
- Preserve user-created assets unless the user identifies them as in scope.
- Treat source primary keys as immutable operational contracts. Do not change a key merely to match an activation alias; an upsert does not remove records omitted from a later file, and a changed key creates a new record.
- Do not add physical or model fields solely to reproduce an output column name when an activation alias can express the same business value.
- Call out UI-only or unsupported steps clearly and hand them to the user with exact verification criteria.

## Completion criteria

Report the asset's developer name, environment/data space, observed status, and any remaining manual step. If the status cannot be verified, say so plainly.
