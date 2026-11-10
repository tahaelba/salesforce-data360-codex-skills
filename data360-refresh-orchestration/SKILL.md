---
name: data360-refresh-orchestration
description: Run and verify Salesforce Data 360 post-change refresh pipelines in dependency order. Use after authorized source publication or live model, identity, Calculated Insight, segment, or activation changes when jobs must be triggered, joined, polled, timed out, and reported safely.
---

# Data 360 refresh orchestration

Use this skill as the post-hook for an authorized live change. It does not grant permission for unrelated downstream runs.

## Pipeline contract

1. Build or select a project-owned refresh manifest containing only affected assets and their actual dependencies.
2. Run `plan` first and verify environment, stage order, developer names, status fields, success states, failure states, polling intervals, and timeouts.
3. Execute stages in this order when present: Data Streams, transforms, identity resolution, Calculated Insights, segments, activations.
4. Inspect each job before triggering it. If it is already pending, join and poll that run; never submit a duplicate.
5. Within a stage, independent jobs may be triggered together. Do not start the next stage until every job in the current stage succeeds.
6. Require a terminal success and, where available, a changed refresh timestamp or run identifier. An accepted request or an `ACTIVE` asset is insufficient.
7. Stop immediately on terminal failure, timeout, manual handoff, or an unknown state that persists until timeout. Report which downstream stages were not run.

Use [scripts/run-refresh-pipeline.mjs](scripts/run-refresh-pipeline.mjs) for deterministic plan, status, and run modes. Read [references/refresh-pipeline.md](references/refresh-pipeline.md) when configuring a manifest, stage timeout, or project post-hook.

## Scope decisions

- Run identity resolution only when new identities, match carriers, reconciliation inputs, or rules changed, or when a current unified result is explicitly required.
- Run a Calculated Insight only when one of its inputs or its definition changed.
- Refresh only segments depending on changed mappings, unified data, or insights.
- Run only activations whose segment or output contract changed, and only when external delivery is within the user's authorized scope.
- Stop for UI-only actions and provide the exact continuation point rather than bypassing the platform workflow.

## Completion

Report each job's trigger decision (`started`, `joined`, or `skipped`), final state, elapsed time, freshness marker, and the first stage not run. Never describe a timed-out job as failed unless the platform returned a failure state.
