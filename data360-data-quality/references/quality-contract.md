# Quality contract and evidence

Define checks in the project, at a named dataset and grain. A useful contract specifies `asset`, `key`, `eventTime`, `expectedSchema`, `allowedValues`, `freshnessSla`, `volumeRange`, `requiredRelationships`, and thresholds. Do not embed customer-specific values in this skill.

| Check | Evidence | Common interpretation trap |
| --- | --- | --- |
| Ingestion | Latest run ID/status, refresh time, processed/added/rejected counts | An accepted run or active stream is not a completed refresh. |
| Problem records | Count by error code and field in the associated Problem Record DLO | Partial transform failures can still leave a record; avoid exposing the error row. |
| Keys | Null count and duplicate count at the stated grain | A source key may not be the target DMO key. |
| Freshness | Latest business event/modified time and latest successful processing time | Processing time is not business event time. |
| Values | Null rate, controlled vocabulary, type, precision and length | Unknown source codes need governance, not silent coercion. |
| Reconciliation | Source, DLO, accepted transform output, DMO counts by key | Upsert and one-to-many mappings make raw row counts incomparable. |
| Relationships | Unmatched, unique, and ambiguous child-to-parent matches | A foreign key populated in a field does not prove a valid parent relationship. |

Use a report with one row per check: `asset`, `grain`, `run`, `rule`, `threshold`, `observed`, `result`, `evidence`, `owner`, `nextAction`. Distinguish `unknown` from `pass`. For failed records, report aggregate counts and sanitized examples only.

Salesforce documents Problem Record DLOs and Data Stream/DLO refresh history; verify the current org's names and retention before relying on them.
