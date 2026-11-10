---
name: data360-model-deployment
license: Apache-2.0
description: Plan, deploy, and verify Salesforce Data 360 formulas, DLO-to-DMO mappings, DMO relationships, custom model fields, and batch transforms. Use for API-driven model changes, identity carriers, mapping drift, or relationship troubleshooting.
---

# Data 360 model deployment

Treat model work as desired-state reconciliation, not a sequence of blind creates.

## Preflight

1. Apply `$data360-governance` rules when available.
2. Retrieve live DLOs, DMOs, fields, mappings, relationships, transforms, and statuses before mutation.
3. Verify every source and target field, data type, length, precision/scale, and key. Every DLO-to-DMO mapping must populate the source and target primary keys.
4. Produce a field-level diff. Skip exact or compatible definitions; stop on conflicting mappings or incompatible relationships.
5. Deploy a pilot first when the change introduces a new API shape or object category.

For the API reconciliation sequence, read [references/api-workflow.md](references/api-workflow.md). For reusable relationship and resolution patterns, read [references/model-patterns.md](references/model-patterns.md).

## Formulas and mappings

- Store formula definitions and field mappings in version-controlled manifests.
- A Data Stream formula update must preserve the live source fields and existing mappings. Verify the formula expression and return type after the update.
- Formula keys must be deterministic, stable, non-null at the required grain, and prefixed `FRM_`.
- One DLO may map to multiple DMOs. Use an explicit manifest entry for each target.
- When one source field maps more than once, use a manifest-only disambiguator if the runner supports it; do not alter the live source developer name.
- Poll asynchronous mappings to `ACTIVE`; stop on an error state or timeout.
- A transformed output should be the sole authoritative source when it resolves a relationship key. Do not also map the unresolved raw source to the same target DMO.

## Relationships

- Model the child foreign key to parent primary key as `ManyToOne`.
- Create relationships only after the carrier fields are mapped and active.
- Validate standard relationships rather than attempting to recreate them.
- If a standard relationship is deactivated by a user and the API cannot reactivate it safely, hand the UI step to the user and verify its status afterward.
- The same party identifier may support relationships to Individual and Prospect when identifiers are globally stable and overlap is intentional. Report records resolving to both or neither.
- Do not populate conditional party relationships from the same source identifier unless the data contract and resolver explicitly support that behavior.

## Batch transforms

Validate the transform definition before creation. For composite resolution, join on the full approved business key, require exactly one match, and route unmatched and ambiguous rows to auditable outputs. Never assign an arbitrary parent from duplicate matches. Preserve text join carriers at their original grain; do not aggregate them merely to obtain uniqueness because aggregate outputs may be coerced to Number.

## Identity carriers

When reconciling records through Party Identification:

- Use the same governed identification type and identification name for identifiers that are semantically the same across sources.
- Use the shared business identifier as the identification number.
- Keep the Party Identification record ID unique per source-party record.
- Map the Party ID to the source party's own primary key.

This separates identifier equivalence from record identity and supports identity resolution without creating duplicate Party Identification primary keys.

## Completion

Run the complete model verification and inspect referential integrity. After an authorized live deployment, invoke `$data360-refresh-orchestration` for the affected runtime chain. A transform must complete before identity resolution or any consumer of its output; a mapping or relationship change may require source reprocessing before downstream refresh. Report orphan, ambiguous, both-parent, and neither-parent outcomes where applicable. Never claim the model is complete solely because the create request returned successfully.
