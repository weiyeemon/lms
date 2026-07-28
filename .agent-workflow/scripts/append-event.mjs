import { appendFile, readFile } from 'node:fs/promises';
import process from 'node:process';

const [, , logPath, eventPath] = process.argv;

if (!logPath || !eventPath) {
  console.error('Usage: node append-event.mjs <events.jsonl> <event.json>');
  process.exit(2);
}

const event = JSON.parse(await readFile(eventPath, 'utf8'));
const allowedEvents = new Set([
  'session_start', 'plan', 'coder_dispatch', 'coder_result', 'gates',
  'reviewer_dispatch', 'reviewer_verdict', 'decision', 'minor_fixes',
  'session_end',
]);

if (typeof event !== 'object' || event === null || Array.isArray(event)) {
  throw new TypeError('Event must be a JSON object.');
}
if (typeof event.ts !== 'string' || !event.ts) {
  throw new TypeError('Event must contain a non-empty string ts.');
}
if (!allowedEvents.has(event.event)) {
  throw new TypeError(`Unsupported event type: ${event.event}`);
}
if (event.iteration !== null && (!Number.isInteger(event.iteration) || event.iteration < 1)) {
  throw new TypeError('iteration must be null or a positive integer.');
}

await appendFile(logPath, `${JSON.stringify(event)}\n`, 'utf8');
console.log(`Appended ${event.event} to ${logPath}`);
