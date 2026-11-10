#!/usr/bin/env node
// SPDX-License-Identifier: Apache-2.0

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const STAGE_ORDER = [
  'dataStreams',
  'transforms',
  'identityResolution',
  'calculatedInsights',
  'segments',
  'activations',
];

const DEFAULT_TIMEOUTS = {
  dataStreams: 1800,
  transforms: 3600,
  identityResolution: 7200,
  calculatedInsights: 3600,
  segments: 1800,
  activations: 1800,
};

const [mode = 'plan', ...rawArgs] = process.argv.slice(2);
const arg = (name) => rawArgs.find((value) => value.startsWith(`--${name}=`))?.split('=', 2)[1];
const manifestArg = arg('manifest');
const fromStage = arg('from');
const throughStage = arg('through');

if (!['plan', 'status', 'run'].includes(mode)) fail(`Unknown mode: ${mode}`);
if (!manifestArg) fail('Missing --manifest=<path>.');

const manifestPath = resolve(manifestArg);
const manifest = expandEnvironment(JSON.parse(readFileSync(manifestPath, 'utf8')));
validateManifest(manifest);
const stages = selectStages(manifest.stages, fromStage, throughStage);

if (mode === 'plan') {
  printPlan(manifest, stages);
  process.exit(0);
}

if (mode === 'status') {
  for (const stage of stages) {
    for (const job of stage.jobs) {
      const snapshot = getSnapshot(manifest, job);
      printSnapshot(stage.name, job.id, 'observed', snapshot);
    }
  }
  process.exit(0);
}

for (const stage of stages) await runStage(manifest, stage);
console.log('Refresh pipeline completed successfully.');

async function runStage(config, stage) {
  const timeoutSeconds = positiveNumber(stage.timeoutSeconds ?? DEFAULT_TIMEOUTS[stage.name], `${stage.name}.timeoutSeconds`);
  const pollSeconds = positiveNumber(stage.pollSeconds ?? config.pollSeconds ?? 15, `${stage.name}.pollSeconds`);
  const startedAt = Date.now();
  const active = [];

  console.log(`Starting stage ${stage.name} (${stage.jobs.length} job(s), timeout ${timeoutSeconds}s).`);
  for (const job of stage.jobs) {
    if (job.manual === true) fail(`Stage ${stage.name}, job ${job.id} requires manual handoff. Downstream stages were not run.`);
    const before = getSnapshot(config, job);
    const pendingStates = states(job.pendingStates, ['PENDING', 'RUNNING', 'QUEUED']);
    const decision = pendingStates.has(before.state) ? 'joined' : 'started';
    if (decision === 'started') trigger(config, job);
    console.log(`${stage.name}/${job.id}: ${decision}; prior state=${before.state ?? 'UNKNOWN'}.`);
    active.push({ job, before, decision, completed: false });
  }

  while (active.some(({ completed }) => !completed)) {
    if ((Date.now() - startedAt) / 1000 > timeoutSeconds) {
      const unfinished = active.filter(({ completed }) => !completed).map(({ job }) => job.id).join(', ');
      fail(`Stage ${stage.name} timed out after ${timeoutSeconds}s; outcome unknown for: ${unfinished}. Downstream stages were not run.`);
    }

    for (const item of active.filter(({ completed }) => !completed)) {
      const snapshot = getSnapshot(config, item.job);
      const successStates = states(item.job.successStates, ['SUCCESS', 'SUCCEEDED', 'COMPLETED']);
      const failureStates = states(item.job.failureStates, ['ERROR', 'FAILED', 'FAILURE', 'CANCELLED']);
      if (failureStates.has(snapshot.state)) {
        fail(`Stage ${stage.name}, job ${item.job.id} ended in ${snapshot.state}. Downstream stages were not run.`);
      }
      if (successStates.has(snapshot.state) && isFresh(item.job, item.before, snapshot)) {
        item.completed = true;
        const elapsed = Math.round((Date.now() - startedAt) / 1000);
        printSnapshot(stage.name, item.job.id, `success after ${elapsed}s`, snapshot);
      }
    }

    if (active.some(({ completed }) => !completed)) await sleep(pollSeconds * 1000);
  }
}

function trigger(config, job) {
  if (!job.runPath) fail(`Job ${job.id} has no runPath.`);
  request(config, job.runMethod ?? 'POST', job.runPath, Object.hasOwn(job, 'body') ? job.body : {});
}

function getSnapshot(config, job) {
  const response = request(config, job.statusMethod ?? 'GET', job.statusPath);
  return {
    state: normalizeState(valueAt(response, job.stateField)),
    freshness: job.freshnessField ? valueAt(response, job.freshnessField) : undefined,
  };
}

function request(config, method, path, body) {
  const command = config.sfCommand ?? 'sf';
  const args = ['api', 'request', 'rest', path, '--target-org', config.org, '--method', method];
  let bodyDirectory;
  if (body !== undefined) {
    bodyDirectory = mkdtempSync(join(tmpdir(), 'data360-refresh-'));
    const bodyPath = join(bodyDirectory, 'body.json');
    writeFileSync(bodyPath, JSON.stringify(body), 'utf8');
    args.push('--body', `@${bodyPath}`);
  }
  const invocation = resolveInvocation(command, args);
  const result = spawnSync(invocation.command, invocation.args, {
    encoding: 'utf8',
    windowsHide: true,
    windowsVerbatimArguments: invocation.windowsVerbatimArguments === true,
  });
  if (bodyDirectory) rmSync(bodyDirectory, { recursive: true, force: true });
  if (result.error) fail(`Could not execute ${command}: ${result.error.message}`);
  if (result.status !== 0) fail(`Request failed (${method} ${path}, exit ${result.status}): ${compact(result.stderr || result.stdout)}`);
  try {
    return JSON.parse(result.stdout.trim() || '{}');
  } catch {
    fail(`Request returned non-JSON output (${method} ${path}): ${compact(result.stdout)}`);
  }
}

function resolveInvocation(command, args) {
  if (process.platform !== 'win32') return { command, args };
  let resolved = command;
  if (!/[\\/]/.test(command)) {
    const lookup = spawnSync('where.exe', [command], { encoding: 'utf8', windowsHide: true });
    if (lookup.status === 0) resolved = lookup.stdout.split(/\r?\n/).find(Boolean)?.trim() ?? command;
  }
  if (!/\.(cmd|bat)$/i.test(resolved)) return { command: resolved, args };
  const commandLine = `""${resolved}" ${args.map(quoteForCmd).join(' ')}"`;
  return {
    command: process.env.ComSpec ?? 'cmd.exe',
    args: ['/d', '/s', '/c', commandLine],
    windowsVerbatimArguments: true,
  };
}

function quoteForCmd(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function isFresh(job, before, after) {
  if (!job.freshnessField) return true;
  return after.freshness !== undefined && after.freshness !== before.freshness;
}

function validateManifest(config) {
  if (!config || typeof config !== 'object') fail('Manifest must be a JSON object.');
  if (!config.org || typeof config.org !== 'string') fail('Manifest org is required.');
  if (!Array.isArray(config.stages) || config.stages.length === 0) fail('Manifest stages must be a non-empty array.');
  let previousIndex = -1;
  const seen = new Set();
  for (const stage of config.stages) {
    const index = STAGE_ORDER.indexOf(stage.name);
    if (index < 0) fail(`Unknown stage name: ${stage.name}`);
    if (index <= previousIndex || seen.has(stage.name)) fail('Stages must be unique and follow canonical dependency order.');
    previousIndex = index;
    seen.add(stage.name);
    if (!Array.isArray(stage.jobs) || stage.jobs.length === 0) fail(`Stage ${stage.name} must contain jobs.`);
    for (const job of stage.jobs) {
      if (!job.id || !job.statusPath || !job.stateField) fail(`Every ${stage.name} job requires id, statusPath, and stateField.`);
    }
  }
}

function selectStages(allStages, from, through) {
  if (from && !STAGE_ORDER.includes(from)) fail(`Unknown --from stage: ${from}`);
  if (through && !STAGE_ORDER.includes(through)) fail(`Unknown --through stage: ${through}`);
  if (from && through && STAGE_ORDER.indexOf(from) > STAGE_ORDER.indexOf(through)) fail('--from must not follow --through.');
  return allStages.filter(({ name }) =>
    (!from || STAGE_ORDER.indexOf(name) >= STAGE_ORDER.indexOf(from))
    && (!through || STAGE_ORDER.indexOf(name) <= STAGE_ORDER.indexOf(through))
  );
}

function printPlan(config, selectedStages) {
  console.log(`Org: ${config.org}`);
  for (const stage of selectedStages) {
    const timeout = stage.timeoutSeconds ?? DEFAULT_TIMEOUTS[stage.name];
    console.log(`${stage.name}: ${stage.jobs.length} job(s), timeout ${timeout}s`);
    for (const job of stage.jobs) console.log(`  - ${job.id}${job.manual ? ' (manual)' : ''}`);
  }
}

function printSnapshot(stage, job, decision, snapshot) {
  console.log(`${stage}/${job}: ${decision}; state=${snapshot.state ?? 'UNKNOWN'}; freshness=${snapshot.freshness ?? 'n/a'}`);
}

function valueAt(object, dottedPath) {
  if (!dottedPath) return undefined;
  return dottedPath.split('.').reduce((value, key) => value?.[key], object);
}

function states(values, defaults) {
  return new Set((values ?? defaults).map(normalizeState));
}

function normalizeState(value) {
  return value === undefined || value === null ? undefined : String(value).toUpperCase();
}

function positiveNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) fail(`${label} must be a positive number.`);
  return number;
}

function expandEnvironment(value) {
  if (Array.isArray(value)) return value.map(expandEnvironment);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, expandEnvironment(child)]));
  if (typeof value !== 'string') return value;
  return value.replace(/\$\{([A-Z_][A-Z0-9_]*)\}/g, (_, name) => {
    if (!(name in process.env)) fail(`Environment variable ${name} is required by the manifest.`);
    return process.env[name];
  });
}

function compact(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 1000);
}

function sleep(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
