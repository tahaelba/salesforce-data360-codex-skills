# Reversible SFTP ingestion tests

Use this workflow when a test changes Data 360 records and must restore the state observed before the test. Establish the target org, data space, file contract, stream category, refresh mode, primary key, event time or record-modified field, and actual dependencies from the live environment. A seed file is a test input, not a backup, unless it has been compared with the current DLO.

## Capture before changing data

1. Save the complete current source rows for the keys in scope, including nulls, physical types, timestamps, and all fields that feed mappings. Keep sensitive rows and credentials in a protected, untracked location. Record file hashes and schema.
2. Query the DLO at its actual grain, plus affected DMOs, transforms, identity links, Calculated Insights, segment definitions and exact member IDs. Capture activation configuration and output columns without sending an external activation.
3. Confirm there is no concurrent publication for the same stream or dependent jobs. Prepare a restoration file for **each version** that may need replay and a rollback sequence before the test mutation. Validate names and schema against project conventions.

## Profile streams

For a Profile stream using upsert, the primary key identifies the row. When a Record Modified field is configured, a file carrying older values and an older modified timestamp can finish with `SUCCESS` **without replacing** a newer version. Verify the DLO values after every run; run status and processed count alone do not prove restoration.

If the test only needs the business values back, a newly modified restore record may be acceptable under the approved contract, but its modified timestamp and downstream freshness have changed. To recover the **exact prior source values and timestamp**, first use the stream's supported targeted deletion mechanism for the test key, verify it is absent, then replay the complete original row under a new filename in a subsequent run. Confirm the unchanged witness rows are still present. This deletion and replay sequence was observed in an isolated SFTP Profile pilot; verify connector behavior and downstream effects for the target stream before using it on business records.

## Engagement streams

An Engagement stream can retain multiple rows for one primary key when the event-time values fall into distinct ingestion grains. Inspect the live DLO instead of assuming the file's primary key alone identifies one stored row. In one SFTP pilot, same-key times on separate days produced two rows; a targeted deletion removed both, while replaying both dates in one run restored only one. Replaying the versions in **separate completed runs** restored both. Treat this as a tested pattern, not a universal day-partition rule; confirm the target stream's key and event-time behavior.

If several versions of a key must be restored, delete that key, verify all its versions are gone, then replay the saved versions in distinct runs when the target stream requires it. Compare the final set of `(primary key, event time)` pairs and every original source field. System provenance such as the source filename may legitimately change after replay; distinguish it from the business contract.

## Targeted SFTP deletion and verification

For streams that support Salesforce's SFTP deletion-file workflow, put a Parquet file with a **single text column named `primaryKey`** in the source's `delete/` folder, using the connector's required deletion filename pattern. In one tested SFTP connector, a run with only a deletion file failed with `No data was found during extraction`; publishing a new, unchanged source Parquet for a **different key** in the same run allowed the deletion to complete. Check the connector's current documentation and verify the DLO after the run rather than assuming this companion file is required everywhere.

Publish each file atomically under a fresh name. For each stage, wait for terminal `SUCCESS` and a newer refresh marker, then query the DLO. Never submit a second run while the same stream is pending. If monitoring times out or loses the network, query the current status before deciding whether another run is needed.

At closure, compare the full set of business rows at the correct grain, not only row counts. Verify affected DMO rows and exact segment-member sets after the necessary downstream refreshes. Compare CI values, payload columns, nulls, and row multiplicity when those consumers were in scope. Report what was **not** rerun or observed. Remove temporary SFTP files only after restoration is verified; retain the pre-test snapshot and run evidence privately. An activation already delivered externally cannot be rolled back as part of a reversible test.

Salesforce references: [upsert behavior](https://help.salesforce.com/s/articleView?id=004052148&language=en_US&type=1), [Record Modified behavior](https://help.salesforce.com/s/articleView?id=005227575&language=en_US&type=1), [SFTP deletion file](https://help.salesforce.com/s/articleView?id=sf.c360_a_delete_data_stream_records_deletion_file.htm&language=en_US&type=5).
