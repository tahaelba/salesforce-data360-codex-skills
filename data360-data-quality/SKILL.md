---
name: data360-data-quality
description: Assess Salesforce Data 360 ingestion and modeled data quality. Use for problem records, schema drift, duplicate or null keys, freshness, value rules, relationship integrity, and source-to-DMO reconciliation; report evidence before proposing remediation.
---

# Data 360 data quality

Measure quality at the source, DLO, DMO, and consumer grain. Start with the project's approved contract and recent successful run, then query observed data and refresh history. Do not treat an `ACTIVE` asset as evidence that its latest records were processed.

## Checks

1. Confirm the file and stream schema, key, event time, refresh mode, and latest run outcome.
2. Inspect the stream's Problem Record DLO and refresh history. Group rejects by error code and field; avoid printing raw rows containing personal data.
3. Check null and duplicate primary keys, allowed values, type and length conformance, freshness, and unexpected volume changes against project-defined thresholds.
4. Reconcile counts at each intended grain. Account for filtering, upsert, transforms, and one-to-many mappings before labeling a count difference a loss.
5. Check foreign keys after mappings and transforms complete. Report orphan and ambiguous matches separately; never select an arbitrary parent.
6. Trace failed checks to the earliest layer with evidence, propose the smallest repair, and identify affected downstream refreshes. Changes and reruns follow `$data360-governance` and `$data360-refresh-orchestration` when available.

For a portable check contract and report shape, read [references/quality-contract.md](references/quality-contract.md).

## Output

Return the environment, data space, asset and run identifiers, checked grain, threshold, observed result, pass/fail/unknown, sample query or method, and recommended owner. If a query or permission is unavailable, mark the check `unknown`; do not infer that it passed.
