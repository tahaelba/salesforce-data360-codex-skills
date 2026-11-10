# Reusable model patterns

## Relationship carrier

Map the child foreign-key carrier before creating a `ManyToOne` relationship to the parent's primary key. Verify the mapping is active first. Standard relationships should be validated, not recreated; some deactivated standard relationships may require a one-time UI reactivation followed by API verification.

Contact points can relate to both Individual and Prospect through the same stable party identifier when this is an approved identity model. Keep a source `party_type` as a validation attribute unless a resolver explicitly uses it; a relationship definition cannot usually express conditional parent selection by itself.

## Composite parent resolution

When no single source value uniquely identifies a parent:

1. Join child rows to parent rows on the complete approved business key.
2. Use a left join from child to parent to retain unmatched children for audit.
3. Determine match cardinality in a separate validation branch.
4. Accept only rows with exactly one parent match.
5. Route zero-match and multi-match rows to separate exception outputs.
6. Map the resolved parent identifier from the accepted output.

An inner join is appropriate only for the final accepted branch after uniqueness has been established. It should not be the first join when unmatched records must remain observable.

Data Prep aggregate outputs can be typed as Number. Do not aggregate a text join key and then attempt to join on that result. Keep the original text carrier, compute counts separately, and join or filter by the validation result.

## Formula identifiers

A formula identifier should be deterministic, non-null, stable, and unique at its DMO grain. Include a namespace or entity discriminator where two source objects can emit the same natural key. Keep the source physical schema free of formula-only fields.

For Party Identification used in identity resolution, the identification type and name can be shared across source objects while the Party Identification record ID remains source-specific and unique.

## Deferred conditional resolution

When a child can point to one of several parent types and the platform relationship cannot express the condition safely, retain the raw party identifier and type in the DLO, defer relationship population, and implement an auditable resolver later. Do not fill both foreign keys as a shortcut.
