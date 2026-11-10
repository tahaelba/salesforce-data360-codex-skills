# Project convention contract

Keep project-specific values outside the skill. Before a mutation, locate or establish the following configuration:

| Concern | Required project value |
| --- | --- |
| Environment | Org alias or authentication profile |
| API | Version and base path |
| Data space | Target data-space developer name |
| Naming | Patterns for streams, files, DMOs, transforms, CIs, segments, activations, and targets |
| Source contract | Fields, physical types, nullability, keys, refresh mode, and event time |
| Desired state | Version-controlled mappings, relationships, formulas, and transforms |
| Validation | A single guarded command that checks names and manifests |

Do not ship real credentials, IP addresses, usernames, private-key paths, subscriber data, or customer-specific identifiers in a reusable skill.

## Source-of-truth order

1. An approved business and architecture decision defines intent.
2. The current source contract and source-to-target mapping define desired schema and semantics.
3. Version-controlled manifests define deployable desired state.
4. The live org is observed state.

When these disagree, show the difference and request a decision. Never silently make the live org or an old spreadsheet authoritative.

## Safe-change rules

- Skip an exact live match.
- Stop on an incompatible definition and report a field-level diff.
- Never auto-delete, replace, deactivate, or remap an existing asset.
- Treat primary keys, identity carriers, relationship keys, and event times as migration-sensitive.
- A changed primary key plus upsert semantics creates additional records; it is not a rename.
- Missing rows in a new upsert file remain in Data 360. Full replacement or purge requires an explicit, dependency-aware operation.
- Activation aliases are presentation contracts. Do not duplicate a source field only to obtain a second output name when both columns have the same meaning.

## Runtime evidence

An accepted request is not completion. Verify the relevant runtime status and timestamps for the Data Stream, DLO, mapping, transform, identity job, Calculated Insight, segment publication, and activation run. Record error identifiers without exposing secrets.
