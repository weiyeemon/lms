import { readFile } from 'node:fs/promises';
import process from 'node:process';

const [, , verdictPath] = process.argv;

if (!verdictPath) {
  console.error('Usage: node validate-verdict.mjs <verdict.json>');
  process.exit(2);
}

const verdict = JSON.parse(await readFile(verdictPath, 'utf8'));
assertKeys(Object.keys(verdict).sort(), ['findings', 'test_audit', 'verdict'], 'verdict');
if (!['approved', 'changes_required'].includes(verdict.verdict)) {
  throw new TypeError('verdict must be approved or changes_required.');
}
if (!Array.isArray(verdict.findings)) throw new TypeError('findings must be an array.');
if (typeof verdict.test_audit !== 'string' || !verdict.test_audit.trim()) {
  throw new TypeError('test_audit must be a non-empty string.');
}

for (const [index, finding] of verdict.findings.entries()) {
  assertKeys(Object.keys(finding).sort(), ['failure_scenario', 'file', 'line', 'severity', 'summary'], `finding ${index + 1}`);
  if (!['blocking', 'minor'].includes(finding.severity)) {
    throw new TypeError(`finding ${index + 1} has an invalid severity.`);
  }
  if (typeof finding.file !== 'string' || typeof finding.summary !== 'string' || typeof finding.failure_scenario !== 'string') {
    throw new TypeError(`finding ${index + 1} must contain string file, summary, and failure_scenario fields.`);
  }
  if (finding.line !== null && (!Number.isInteger(finding.line) || finding.line < 1)) {
    throw new TypeError(`finding ${index + 1} line must be null or a positive integer.`);
  }
}

const hasBlocking = verdict.findings.some((finding) => finding.severity === 'blocking');
if ((verdict.verdict === 'approved') === hasBlocking) {
  throw new TypeError('approved requires zero blocking findings; changes_required requires at least one.');
}

console.log(`Validated ${verdict.verdict} verdict with ${verdict.findings.length} finding(s).`);

function assertKeys(actual, expected, label) {
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new TypeError(`${label} has unexpected or missing fields.`);
  }
}
