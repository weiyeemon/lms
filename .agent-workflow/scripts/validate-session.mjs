import { readFile } from 'node:fs/promises';
import process from 'node:process';

const [, , planPath, logPath] = process.argv;

if (!planPath || !logPath) {
  console.error('Usage: node validate-session.mjs <plan.json> <events.jsonl>');
  process.exit(2);
}

const plan = JSON.parse(await readFile(planPath, 'utf8'));
const rawLines = (await readFile(logPath, 'utf8')).split(/\r?\n/).filter(Boolean);
const events = rawLines.map((line, index) => {
  try {
    return JSON.parse(line);
  } catch (error) {
    throw new SyntaxError(`Invalid JSON on log line ${index + 1}: ${error.message}`);
  }
});

const requiredPlanFields = ['version', 'workflow_version', 'session_id', 'task', 'status', 'branch', 'baseline_commit', 'acceptance_criteria', 'gates', 'iteration'];
for (const field of requiredPlanFields) {
  if (!(field in plan)) throw new TypeError(`Plan is missing ${field}.`);
}
if (plan.version !== 1) throw new TypeError('Unsupported plan version.');
if (!Array.isArray(plan.acceptance_criteria) || !Array.isArray(plan.gates)) {
  throw new TypeError('Plan acceptance_criteria and gates must be arrays.');
}
const allowedStatuses = new Set(['planned', 'in_progress', 'awaiting_user', 'approved', 'max_iterations', 'escalated', 'aborted']);
if (!allowedStatuses.has(plan.status)) throw new TypeError(`Unsupported plan status: ${plan.status}`);
if (events.length === 0 || events[0].event !== 'session_start') {
  throw new TypeError('First event must be session_start.');
}
const allowedEvents = new Set([
  'session_start', 'plan', 'coder_dispatch', 'coder_result', 'gates',
  'reviewer_dispatch', 'reviewer_verdict', 'decision', 'minor_fixes',
  'session_end',
]);
for (const [index, event] of events.entries()) {
  if (!event.ts || !event.event || !Object.hasOwn(event, 'iteration')) {
    throw new TypeError(`Log line ${index + 1} lacks the event envelope.`);
  }
  if (!allowedEvents.has(event.event)) {
    throw new TypeError(`Log line ${index + 1} has unsupported event ${event.event}.`);
  }
  if (event.event === 'session_end' && index < events.length - 1) {
    const nextEvent = events[index + 1];
    if (nextEvent?.event !== 'decision' || nextEvent.action !== 'reopen') {
      throw new TypeError(`Log line ${index + 1} session_end may only be followed by a reopen decision.`);
    }
  }
}
if (plan.status === 'awaiting_user') {
  if (!Number.isInteger(plan.iteration_limit) || plan.iteration_limit < 1) {
    throw new TypeError('An awaiting_user plan requires a positive iteration_limit.');
  }
  if (plan.iteration < plan.iteration_limit) {
    throw new TypeError('An awaiting_user plan must have reached its iteration_limit.');
  }
  const lastEvent = events.at(-1);
  if (lastEvent?.event !== 'decision' || lastEvent.action !== 'await_user') {
    throw new TypeError('An awaiting_user plan must end with an await_user decision.');
  }
}

if (['approved', 'max_iterations', 'escalated', 'aborted'].includes(plan.status)) {
  if (events.at(-1)?.event !== 'session_end') {
    throw new TypeError('A terminal plan must end with session_end.');
  }
}

console.log(`Validated plan and ${events.length} event(s).`);
