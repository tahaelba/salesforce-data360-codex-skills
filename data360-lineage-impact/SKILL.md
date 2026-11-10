---
name: data360-lineage-impact
license: Apache-2.0
description: Trace Salesforce Data 360 fields and keys from source contract through DLO, DMO, transforms, identity resolution, Calculated Insights, segments, and activations. Use for change impact, mapping documentation, downstream test scope, or safe retirement planning.
---

# Data 360 lineage and impact

Build an evidence-backed directed graph for the named asset or field. Read project contracts and manifests as intended lineage, then compare each edge with the live org. Keep planned, deployed, active, and observed-data edges distinct.

## Trace

1. Resolve exact developer names and field names at every boundary: source file or API, stream, DLO, formula or transform output, DMO, relationship, identity ruleset, CI, segment, activation, and destination field.
2. Record each edge's expression, join key, cardinality, data type, data space, and status. Treat a formula or many-to-one resolution as a transformation, not a direct copy.
3. Traverse downstream consumers from the proposed change. Identify schema, key, type, grain, value, privacy, and freshness effects.
4. Traverse upstream when a consumer has a null, unexpected, or duplicated value. Stop at the first missing or unverified edge.
5. Produce a minimal test and refresh set from the affected subgraph. Use `$data360-refresh-orchestration` for an authorized rerun, and `$data360-data-quality` for data assertions when installed.

For the edge ledger and impact rules, read [references/lineage-ledger.md](references/lineage-ledger.md).

## Output

Show the lineage path, evidence for each edge, gaps, affected consumers, and ordered checks. Do not present an STTM row or manifest entry as proof of a live mapping. If a proposed change would require deletion or replacement, identify it for explicit scope review rather than executing it.
