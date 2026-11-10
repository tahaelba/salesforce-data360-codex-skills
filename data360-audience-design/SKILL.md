---
name: data360-audience-design
description: Design and validate Salesforce Data 360 identity resolution, Calculated Insights, segments, and activations. Use for audience grain, Prospect versus Unified Individual selection, CI SQL, segment fields, activation payloads, or UI handoff instructions.
---

# Data 360 audience design

Start from the audience grain and business decision, then trace every condition and payload field back to an active DMO mapping.

## Identity and segment grain

- Use Prospect when the journey must include unreconciled prospects or pre-customer behavior whose stable key is the Prospect record.
- Use Unified Individual when the journey depends on reconciled customer identity or cross-source customer activity.
- Do not assume an Individual mapping automatically produces a Unified Individual. Verify the identity resolution ruleset, Party Identification inputs, reconciliation run, and identity-link records.
- Before segment construction, verify that every required relationship path is active and that the intended segment root can traverse it.
- Re-run identity resolution when new identities, match carriers, rules, or reconciliation inputs changed, or when immediate unified values are required. A child-event refresh alone may reuse existing links when stable identity data is unchanged; verify the last successful ruleset run before deciding.

## Segment plan

For each journey, document:

1. Segment name and root DMO.
2. Eligibility filters and suppression filters.
3. Direct mapped attributes used by filters.
4. Calculated Insights and their grain, lookback, refresh cadence, and null behavior.
5. Activation name, destination, contact key, contact point selection, and payload attributes.
6. Unconfirmed vocabularies or fields that must remain out of the MVP.

Separate filter-only data from activation payload. Do not send sensitive or operational attributes merely because they are available to the segment.

## Calculated Insights

- Define the fact grain and output dimension before writing SQL.
- Use the actual live unified DMO and identity-link developer names; ruleset-specific names cannot be inferred from generic documentation.
- When comparing an aggregate such as `COUNT`, keep the comparison inside `CASE WHEN` if required by the CI SQL engine.
- Treat established output schema as immutable unless the platform explicitly supports a type change. Editing a measure expression does not authorize changing its stored data type.
- Aggregate outputs used as measures should remain numeric. For a yes/no aggregate, prefer `CASE WHEN COUNT(...) > 0 THEN 1 ELSE 0 END` and filter on `= 1`.
- Retain the underlying count when it is useful for audit or later thresholds.
- Use bounded time functions and document whether the lookback is rolling or calendar-based.
- Validate status and event-type vocabularies; a syntactically valid CI can still encode the wrong business event.

For identity-link SQL, activation contracts, and rollout order, read [references/audience-rollout.md](references/audience-rollout.md).

## Segments and activations

- Follow the active project's naming convention for segments and activations.
- Build with no filters only when the user explicitly wants a shell definition; otherwise require approved eligibility logic.
- Verify segment publication and population separately from definition creation.
- Verify activation target compatibility, activation key, contact channel, payload fields, refresh cadence, and status.
- Treat activation aliases as an output contract. One source key may be both the activation key and an exported alias when it has the same business meaning; do not create duplicate physical fields for output labels alone.
- Resolve one-to-many related attributes to the intended activation grain before exporting them, or they can duplicate audience members and produce ambiguous payload values.
- If creation is too fragile or UI-only, give the user exact names, root object, selectable fields, and verification steps; do not pretend an unsupported API path is reliable.

## Completion

After an authorized audience mutation or upstream data refresh, invoke `$data360-refresh-orchestration` from the earliest affected stage. Preserve this order: identity resolution when required, Calculated Insights, segments, then activations. Stop before any UI-only or manually approved stage and hand it to the user; never let a downstream job run against stale upstream results.

Return a concise dependency checklist showing what is mapped, calculated, unresolved, and ready for activation. Distinguish a saved definition from a successfully published segment or completed activation run.
