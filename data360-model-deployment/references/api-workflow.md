# Data 360 API reconciliation workflow

Keep formulas, mappings, relationships, and transforms in version-controlled manifests. A runner should offer read-only validation and planning separately from deployment.

Before creating anything, retrieve the live DLO, DMO, field, mapping, relationship, and transform inventories. Resolve names and field types from the live org rather than guessing standard API names. Then:

1. Validate naming and manifest structure.
2. Verify source and target objects, fields, key participation, type, length, precision, and scale.
3. Produce a field-level desired-versus-live diff.
4. Skip exact matches and stop on incompatible live definitions.
5. Deploy one pilot when an API shape has not been proven in the target org.
6. Poll asynchronous operations to a terminal state.
7. Re-read the live definition and verify runtime status.
8. Re-run plan and deploy to prove idempotency.

Never make a deployment command automatically delete or replace an incompatible definition.

A relationship request can use this shape when supported by the target API version:

```json
{
  "relationships": [
    {
      "sourceObjectName": "Child__dlm",
      "targetObjectName": "Parent__dlm",
      "cardinality": "ManyToOne",
      "sourceFieldName": "ParentId__c",
      "targetFieldName": "Id__c"
    }
  ]
}
```

Do not add request properties copied from older examples without verifying them against the current API. Preserve backend error identifiers for support when a syntactically accepted request fails server-side.
