# Audience rollout patterns

## Identity and Calculated Insight SQL

Use the actual ruleset-specific Unified Individual and Unified Link DMO names from the live org. A common pattern is:

1. Unified Individual primary key to Unified Link unified-record identifier.
2. Unified Link source-record identifier to the fact's party foreign key.
3. Key qualifier to key qualifier when the model exposes them.

Verify types on both sides of every equality. Generic object names copied from documentation can fail because unified objects are ruleset-specific.

Aggregate measures are numeric. For Boolean semantics, emit a numeric flag and retain the underlying count when useful:

```sql
COUNT(fact_id) AS event_count,
CASE WHEN COUNT(fact_id) > 0 THEN 1 ELSE 0 END AS has_event
```

Filter the segment with `has_event = 1`. Do not edit an existing numeric measure to Boolean; established CI output types are not safely mutable. Use the actual business event time for rolling windows and validate controlled values used in predicates.

## Segment grain

- Root a pre-customer journey on Prospect when unreconciled prospects must remain eligible.
- Root reconciled customer and cross-source behavioral journeys on Unified Individual.
- Confirm every required relationship path is active from the chosen root.
- Separate eligibility filters, suppressions, Calculated Insight predicates, and output-only attributes.

## Activation contract

Document the activation target, activation key, contact channel, output alias, source path, expected cardinality, and null policy for every exported field.

Do not add a new model field merely because the destination calls the value `SubscriberKey`, `client_code`, or another alias. Reuse and alias the approved stable source key when the semantics are identical.

One-to-many fields such as cards, holdings, phones, or events can multiply rows. Select a deterministic record, aggregate to the audience grain, or intentionally emit multiple rows only when the destination contract supports them. Do not null model keys or relationship carriers to force a blank activation cell.

## Run order and status

Use this dependency order after source changes:

1. successful Data Stream refresh;
2. dependent batch transform;
3. identity resolution when identity-bearing inputs changed;
4. Calculated Insight;
5. segment publish and population;
6. activation run.

A saved segment, published segment, non-zero member count, configured activation, and successful activation run are different states. Verify each required state independently.
