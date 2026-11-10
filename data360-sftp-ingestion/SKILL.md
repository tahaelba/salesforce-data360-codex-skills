---
name: data360-sftp-ingestion
description: Design, generate, publish, create, and verify Salesforce Data 360 SFTP file sources, Data Streams, DSOs, and DLOs. Use for CSV or Parquet contracts, schema discovery, stream formulas, seed data, refresh monitoring, or SFTP ingestion troubleshooting.
---

# Data 360 SFTP ingestion

Use a contract-first workflow. A sample file is a schema-discovery artifact, not merely test data.

## Workflow

1. Apply `$data360-governance` rules when available and run the repository naming validator.
2. Update the machine-readable source contract before generating files. Define field names, physical types, nullability, precision/scale, primary key, refresh mode, and record-modified behavior.
3. Generate representative Snappy Parquet with deterministic, fictitious data and validate the physical schema against the contract.
4. Publish through the guarded atomic publisher: upload as `.part`, rename to the final `.parquet`, and do not overwrite an existing final name.
5. Discover fields from the published file and compare the response with the contract before creating or updating the stream.
6. Create the Data Stream through the supported Data 360 Connect REST workflow for the active org. Do not predeploy speculative DLO/stream metadata to force runtime creation.
7. Poll the Data Stream and DLO independently. Verify the latest run status and timestamps; an `ACTIVE` asset can still have a failed or pending refresh.
8. Run the refresh post-hook after publication: Data Streams first, then only the transforms, identity rules, Calculated Insights, segments, and activations that depend on the changed data. Use `$data360-refresh-orchestration` when installed.
9. Keep scheduling disabled until keys, categories, refresh semantics, and a controlled ingestion run have been reviewed.

For the portable file, publication, and refresh workflow, read [references/file-ingestion-workflow.md](references/file-ingestion-workflow.md).

## Adding source fields

- A physical source field must exist in the Parquet schema before the stream can discover and expose it.
- Update the contract, regenerate a uniquely named file, validate it, publish it, then refresh or update the Data Stream schema.
- Do not add Data Cloud API suffixes to source field names unless the approved physical contract explicitly contains them.
- Formula fields are Data Stream transformations and normally do not belong in the SFTP file. Define them in the formula manifest, preserve existing source mappings, deploy, and verify their expressions and return types.

## Failure handling

- Do not treat an API-created error-state stream as a successful deployment.
- Before retrying a failed creation, inventory the stream, DSO, DLO, and generated metadata records by exact developer name. Avoid duplicate or ghost assets.
- Do not delete failed assets unless the user authorizes cleanup and the complete dependency set is known.
- A missing file or a file with the old schema cannot be repaired by changing only the DMO mapping.
- Do not submit another run while the stream is already `PENDING`.
- A successful run request means accepted, not complete. The post-hook must wait for a terminal result and a newer refresh marker before advancing.
- If source keys change, stop and design an explicit migration or full reload. Publishing a new upsert file will not remove rows stored under the old keys.

## Security

Use environment variables or a secure credential store for host, user, and identity-file paths. Never place private keys or passwords in the repository, generated manifest, command history excerpt, or skill.
