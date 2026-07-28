#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import process from 'node:process';

const specificationPath = process.argv[2];
const requireFinal = process.argv.slice(3).includes('--final');
if (!specificationPath) {
  console.error('Usage: node validate-specification.mjs <specification.json> [--final]');
  process.exit(2);
}

const specification = JSON.parse(await readFile(specificationPath, 'utf8'));
const arrayFields = ['sources', 'current_behavior', 'desired_behavior', 'acceptance_criteria', 'constraints', 'non_goals', 'assumptions', 'open_questions'];
if (specification.version !== 1 || typeof specification.title !== 'string' || !specification.title || typeof specification.summary !== 'string' || !specification.summary) {
  throw new TypeError('Specification metadata is invalid.');
}
for (const field of arrayFields) {
  if (!Array.isArray(specification[field])) throw new TypeError(`Specification ${field} must be an array.`);
}
if (specification.sources.length === 0 || specification.desired_behavior.length === 0 || specification.acceptance_criteria.length === 0) {
  throw new TypeError('Specification requires sources, desired behavior, and acceptance criteria.');
}

const sourceTypes = new Set(['context', 'github', 'jira', 'repository', 'clarification']);
for (const source of specification.sources) {
  if (!sourceTypes.has(source?.type) || typeof source.reference !== 'string' || !source.reference || !Array.isArray(source.facts) || source.facts.length === 0 || source.facts.some((fact) => typeof fact !== 'string' || !fact)) {
    throw new TypeError('Specification contains an invalid source.');
  }
}

const criterionIds = new Set();
for (const criterion of specification.acceptance_criteria) {
  if (!/^AC-[1-9][0-9]*$/u.test(criterion?.id) || typeof criterion.behavior !== 'string' || !criterion.behavior || typeof criterion.verification !== 'string' || !criterion.verification) {
    throw new TypeError('Specification contains an invalid acceptance criterion.');
  }
  if (criterionIds.has(criterion.id)) throw new TypeError(`Duplicate acceptance criterion: ${criterion.id}.`);
  criterionIds.add(criterion.id);
}

for (const field of ['current_behavior', 'desired_behavior', 'constraints', 'non_goals', 'assumptions', 'open_questions']) {
  if (specification[field].some((value) => typeof value !== 'string' || !value)) {
    throw new TypeError(`Specification ${field} contains an invalid value.`);
  }
}

if (requireFinal && specification.open_questions.length > 0) {
  throw new TypeError('A final specification cannot contain open questions.');
}

console.log(`Validated specification with ${specification.acceptance_criteria.length} acceptance criterion/criteria and ${specification.open_questions.length} open question(s).`);
