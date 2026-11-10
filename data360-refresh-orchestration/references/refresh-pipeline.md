# Refresh pipeline configuration

## Canonical dependency order

Use only the stages affected by the change, in this order:

1. `dataStreams`
2. `transforms`
3. `identityResolution`
4. `calculatedInsights`
5. `segments`
6. `activations`

Independent jobs in one stage can be triggered before polling them together. A downstream stage is blocked until all upstream jobs return terminal success.

## Timeout guidance

Timeouts are operational ceilings, not expected durations. Tune them from observed volumes and service behavior. The runner supplies conservative starting values:

| Stage | Default timeout |
| --- | ---: |
| Data Streams | 30 minutes |
| Transforms | 60 minutes |
| Identity resolution | 120 minutes |
| Calculated Insights | 60 minutes |
| Segments | 30 minutes |
| Activations | 30 minutes |

The default polling interval is 15 seconds. Use a longer interval for large or rate-limited environments. A timeout means the final platform outcome is unknown; inspect the job later instead of automatically retrying it.

## Manifest

The runner resolves `${ENVIRONMENT_VARIABLE}` placeholders at runtime. Keep authentication outside the manifest.

```json
{
  "org": "${DATA360_ORG}",
  "sfCommand": "sf",
  "pollSeconds": 15,
  "stages": [
    {
      "name": "dataStreams",
      "timeoutSeconds": 1800,
      "jobs": [
        {
          "id": "ExampleStream",
          "statusPath": "/services/data/vXX.X/ssot/data-streams/ExampleStream",
          "runPath": "/services/data/vXX.X/ssot/data-streams/ExampleStream/actions/run",
          "stateField": "lastRunStatus",
          "freshnessField": "lastRefreshDate",
          "successStates": ["SUCCESS"],
          "pendingStates": ["PENDING", "RUNNING", "QUEUED"],
          "failureStates": ["ERROR", "FAILED", "CANCELLED"],
          "body": {}
        }
      ]
    }
  ]
}
```

Use the live target org and current official documentation to confirm endpoint paths and state names. Other job types can use different paths and fields while retaining the same manifest contract.

## Commands and post-hook

```text
node scripts/run-refresh-pipeline.mjs plan --manifest=config/data360-refresh.json
node scripts/run-refresh-pipeline.mjs status --manifest=config/data360-refresh.json
node scripts/run-refresh-pipeline.mjs run --manifest=config/data360-refresh.json
```

Use `--from=<stage>` and `--through=<stage>` to limit an affected chain. A project can wire the run command into its guarded post-mutation command, for example an npm `postsftp:publish` hook. The hook must receive an explicit affected-asset manifest; do not refresh every asset by default.

For stages that require a UI action or separate approval, omit the mutating job from the manifest, stop the pipeline, and hand off the exact next stage to the user.
