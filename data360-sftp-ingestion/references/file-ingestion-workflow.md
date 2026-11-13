# File ingestion workflow

## Contract and file

Define each source field's physical name, type, nullability, precision or length, category, primary-key role, and record-modified or event time. Engagement streams need an immutable event identifier and event time at the intended grain.

Generate representative fictitious records and validate both the physical schema and cross-file relationships. Update existing seed rows with the same keys when testing a correction; changing the keys produces new rows under upsert semantics.

Formula fields are Data Stream transformations. Do not add them to a source file unless they are genuinely supplied by the source system.

## Safe SFTP publication

1. Use a unique timestamped final filename.
2. Upload to a temporary `.part` name.
3. Rename atomically after the transfer succeeds.
4. Verify the final remote path, size, and name.
5. Never overwrite a final file when the stream processes only new files.

A failed directory-creation command can be harmless when the directory already exists, but it is not proof of upload. Verify the final file explicitly.

## Refresh and monitoring

The Data 360 run request follows this pattern, with project values substituted:

```http
POST /services/data/v{version}/ssot/data-streams/{developerName}/actions/run
Content-Type: application/json

{}
```

Some clients require the explicit empty JSON body. A successful response means the run was accepted, not completed.

Poll without launching duplicate jobs while status is `PENDING`. Inspect, when available:

- stream `status` and `lastRunStatus`;
- `lastRefreshDate`;
- added and processed record counts;
- DLO status and latest ingestion evidence;
- job error details and identifiers.

Allow bounded polling because refreshes can remain pending for several minutes. Stop on terminal failure or timeout and preserve evidence for diagnosis.

## Downstream order

After successful ingestion, run only the affected downstream dependencies: mappings, dependent transforms, identity resolution when identity-bearing data changed, Calculated Insights, segments, and activations. Do not refresh every dependency indiscriminately.
