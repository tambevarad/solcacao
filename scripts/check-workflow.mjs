import { readFileSync } from 'node:fs';
const roster = JSON.parse(readFileSync('team/roster.json', 'utf8'));
const branches = new Set();
for (const [member, r] of Object.entries(roster)) {
  if (
    !r.branch ||
    !r.branch.endsWith('-' + r.area) ||
    !new RegExp('^[a-zA-Z0-9][a-zA-Z0-9._-]*$').test(r.branch) ||
    branches.has(r.branch)
  )
    throw new Error(`Invalid/duplicate dedicated branch for member${member}`);
  branches.add(r.branch);
}
const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
if (
  !ci.includes('development, main') ||
  !ci.includes('npm run check') ||
  !ci.includes('npm run build')
)
  throw new Error('Missing required CI baseline');
console.log(
  'Dedicated branch roster and CI baseline valid. Remote protection/peer review require real GitHub evidence.',
);
