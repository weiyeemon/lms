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
const allowedStatuses = new Set(['awaiting_plan_approval', 'planned', 'in_progress', 'awaiting_user', 'approved', 'max_iterations', 'escalated', 'aborted']);
if (!allowedStatuses.has(plan.status)) throw new TypeError(`Unsupported plan status: ${plan.status}`);
if (events.length === 0 || events[0].event !== 'session_start') {
  throw new TypeError('First event must be session_start.');
}
const allowedEvents = new Set([
  'session_start', 'plan_proposal', 'plan_revision', 'plan_confirmation',
  'plan', 'coder_dispatch', 'coder_result', 'gates', 'reviewer_dispatch', 'reviewer_verdict', 'decision', 'minor_fixes',
  'session_end',
]);
for (const [index, event] of events.entries()) {
  if (!event.ts || !event.event || !Object.hasOwn(event, 'iteration')) {
    throw new TypeError(`Log line ${index + 1} lacks the event envelope.`);
  }
  if (event.iteration !== null && (!Number.isInteger(event.iteration) || event.iteration < 1)) {
    throw new TypeError(`Log line ${index + 1} iteration must be null or a positive integer.`);
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
const requiresApprovalProtocol = workflowAtLeast(plan.workflow_version, 0, 8);
if (requiresApprovalProtocol) validateIterations(plan, events);
const operationalEvents = new Set([
  'plan', 'coder_dispatch', 'coder_result', 'gates',
  'reviewer_dispatch', 'reviewer_verdict', 'minor_fixes',
]);
let currentPlanApproved = false;
for (const [index, event] of events.entries()) {
  if (event.event === 'plan_proposal' || event.event === 'plan_revision') {
    currentPlanApproved = false;
  }
  if (event.event === 'plan_confirmation') {
    if (event.confirmed !== true) {
      throw new TypeError(`Log line ${index + 1} plan_confirmation requires confirmed: true.`);
    }
    currentPlanApproved = true;
  }
  if (requiresApprovalProtocol && operationalEvents.has(event.event) && !currentPlanApproved) {
    throw new TypeError(`Log line ${index + 1} operational event ${event.event} requires approval of the currently displayed plan.`);
  }
}

if (plan.status === 'awaiting_plan_approval') {
  if (!['plan_proposal', 'plan_revision'].includes(events.at(-1)?.event)) {
    throw new TypeError('An awaiting_plan_approval plan must end with plan_proposal or plan_revision.');
  }
  if (currentPlanApproved) {
    throw new TypeError('An awaiting_plan_approval plan cannot have a current plan approval.');
  }
}

if (requiresApprovalProtocol && ['planned', 'in_progress', 'awaiting_user', 'approved', 'max_iterations'].includes(plan.status) && !currentPlanApproved) {
  throw new TypeError(`A ${plan.status} plan requires explicit approval of the currently displayed plan.`);
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

function workflowAtLeast(version, requiredMajor, requiredMinor) {
  const match = /^(\d+)\.(\d+)(?:\.|$)/u.exec(version);
  if (!match) throw new TypeError(`Invalid workflow_version: ${version}`);
  const major = Number(match[1]);
  const minor = Number(match[2]);
  return major > requiredMajor || (major === requiredMajor && minor >= requiredMinor);
}

function validateIterations(currentPlan, sessionEvents) {
  const alwaysOutsideLoop = new Set([
    'session_start', 'plan_proposal', 'plan_revision', 'plan_confirmation', 'plan', 'session_end',
  ]);
  let activeIteration = 0;
  let loopStarted = false;
  let advanceAuthorized = false;

  for (const [index, event] of sessionEvents.entries()) {
    const line = index + 1;
    if (alwaysOutsideLoop.has(event.event)) {
      if (event.iteration !== null) {
        throw new TypeError(`Log line ${line} ${event.event} must have iteration null.`);
      }
      continue;
    }

    if (event.event === 'gates' && !loopStarted && event.iteration === null) continue;
    if (event.event === 'decision' && !loopStarted && event.iteration === null) continue;
    if (event.iteration === null) {
      throw new TypeError(`Log line ${line} ${event.event} must have a positive iteration.`);
    }

    if (!loopStarted) {
      const legacyReopen = event.event === 'decision' && event.action === 'reopen';
      if (event.iteration !== 1 && !legacyReopen) {
        throw new TypeError(`Log line ${line} starts the loop at iteration ${event.iteration}; the first iteration must be 1.`);
      }
      activeIteration = event.iteration;
      loopStarted = true;
    } else if (event.iteration === activeIteration + 1) {
      if (!advanceAuthorized) {
        throw new TypeError(`Log line ${line} advances to iteration ${event.iteration} without an iterate, continue, or reopen decision.`);
      }
      activeIteration = event.iteration;
      advanceAuthorized = false;
    } else if (event.iteration !== activeIteration) {
      throw new TypeError(`Log line ${line} uses iteration ${event.iteration}; expected ${activeIteration}.`);
    } else if (advanceAuthorized) {
      throw new TypeError(`Log line ${line} remains on iteration ${activeIteration} after a decision authorized the next iteration.`);
    }

    if (event.event === 'decision' && ['iterate', 'continue', 'reopen'].includes(event.action)) {
      advanceAuthorized = true;
    }
  }

  const expectedPlanIteration = loopStarted ? activeIteration : 0;
  const planMayLeadLog = currentPlan.status === 'in_progress'
    && advanceAuthorized
    && currentPlan.iteration === activeIteration + 1;
  if (currentPlan.iteration !== expectedPlanIteration && !planMayLeadLog) {
    throw new TypeError(`Plan iteration ${currentPlan.iteration} does not match the active event iteration ${expectedPlanIteration}.`);
  }
}
