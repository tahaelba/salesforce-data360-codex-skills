---
name: data360-audience-qa
description: Validate Salesforce Data 360 segment membership and activation output against an approved audience contract. Use for inclusion and exclusion explanations, CI and identity joins, one-to-many row counts, payload fields, contact keys, suppression, and test handoff.
---

# Data 360 audience QA

Test the published segment and activation against a versioned business contract. A saved segment definition, published population, configured activation, and completed delivery are separate results.

## Validation

1. Capture the segment version, publication time, member count, root DMO, identity ruleset, CI run time, and relevant source refresh times. If an upstream input is stale or pending, stop the membership comparison.
2. Define expected inclusion and exclusion cases with stable synthetic or approved test identities. Evaluate each predicate and relationship path, including null behavior, at the segment's audience grain.
3. Compare expected and observed members using both set differences: expected but absent, and present but unexpected. Explain each case with predicate evidence rather than a single total count.
4. Inspect activation configuration and the actual run/export when available. Compare contact key, channel contact point, output aliases, types, nulls, and consent or suppression rules with the destination contract.
5. Count output rows per audience member. Resolve one-to-many cards, holdings, addresses, or contact points deliberately; a valid member can otherwise produce duplicated or ambiguous payload rows.
6. Report the first stale, missing, or unverified dependency and the smallest correction. Use `$data360-lineage-impact` or `$data360-data-quality` for deeper tracing when available.

For a test matrix and result format, read [references/audience-assertions.md](references/audience-assertions.md).

## Boundary

Read-only QA does not authorize a segment publish or activation delivery. Test contact endpoints should be approved for the target environment; do not send real customer data in a report. Mark an unobserved export `unknown`, not successful.
