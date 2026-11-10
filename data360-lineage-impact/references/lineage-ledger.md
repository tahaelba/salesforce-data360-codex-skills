# Lineage ledger

Represent each transformation as an edge with `fromAsset`, `fromField`, `toAsset`, `toField`, `operation`, `expressionOrKey`, `cardinality`, `dataType`, `dataSpace`, `evidence`, and `state`.

Use these states consistently:

- `planned`: approved document or manifest only;
- `deployed`: live definition exists;
- `active`: runtime definition reports usable status;
- `verified`: sampled records or an aggregate assertion demonstrate the value traverses the edge.

An edge can be deployed without being verified. A segment can be published while its activation has not run.

## Impact rules

| Change | Examine downstream |
| --- | --- |
| Physical source field or type | Discovery, stream schema, DLO, formulas, mappings, transforms, all consumers |
| Primary key or key qualifier | Upsert behavior, duplicates, relationships, identity links, CIs, contact keys |
| Relationship key or cardinality | Join ambiguity, segment membership, activation row count |
| Identity matching or reconciliation | Unified IDs and attributes, linked CIs, segments, activations |
| CI dimension, measure, or window | Stored output type, freshness, segment predicates, payload values |
| Activation alias or destination schema | Export contract, destination keys and validation; source changes only if semantics changed |

For each affected consumer, record whether it needs a metadata change, a data refresh, a sample assertion, or a business decision. Use exact live API names and do not assume that an output alias is a physical source field.
