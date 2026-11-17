# Audience assertion matrix

Define an approved test case with `testIdentity`, `rootId`, `expectedMembership`, `predicateEvidence`, `expectedContactKey`, `expectedPayload`, and `expectedOutputRows`. Use synthetic identifiers in shared artifacts.

Cover at least these distinct behaviors when relevant:

| Case | Question |
| --- | --- |
| Eligible | Does a record satisfying every inclusion and no suppression enter? |
| Boundary | Does the time window include the intended start and end instants? |
| Null | Is a missing CI or related record treated according to the approved rule? |
| Excluded | Which exact predicate or suppression removes the record? |
| Identity overlap | Does the record resolve to the expected Prospect or Unified Individual? |
| Many related rows | How many payload rows result and which related value is selected? |
| Contact point | Is the intended reachable, permitted email or phone chosen? |

## Reconciliation

Report `expectedOnly`, `observedOnly`, and `matched` sets, plus a per-identity reason. Compare the activation's actual output separately from segment membership. A segment with the correct member count can still contain the wrong people, and a correct segment can still produce duplicate activation rows.

The export report should include destination, activation run, audience count, output row count, distinct contact keys, duplicate keys, missing required fields, type mismatches, and a sanitized sample. Record `unknown` when the destination receipt or export file cannot be inspected.

## Reversible test closure

Before changing test records, save the exact published member-ID set, segment version and refresh marker, relevant CI measures, identity links, and activation output columns. Keep full source and DLO snapshots in a protected location; use the ingestion skill's [restoration workflow](../../data360-sftp-ingestion/references/restoration-workflow.md) for file-backed changes.

After restoring the source, complete only the affected dependency chain and compare the **exact** member-ID set and CI values with the baseline. Compare activation payload fields and row multiplicity without delivering to an external destination unless that delivery is separately authorized. An unchanged published segment before rerunning it shows only that its last published result did not change; it does not prove the restored source will produce the same audience. Record unrun stages as unverified, even when all visible counts match.
