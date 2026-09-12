import { readFileSync } from 'node:fs';
const args = process.argv.slice(2);
const value = (key) => args[args.indexOf(key) + 1];
const member = value('--member'),
  phase = value('--phase');
if (
  !args.includes('--member') ||
  !args.includes('--phase') ||
  !['1', '2', '3', '4', '5'].includes(member) ||
  !['2', '3', '4'].includes(phase)
) {
  console.error('Usage: npm run phase -- --member 1..5 --phase 2|3|4');
  process.exit(1);
}
const status = JSON.parse(readFileSync(`team/member-${member}/status.json`, 'utf8'));
const previous = status.phases[String(Number(phase) - 1)];
if (previous && previous.state !== 'integrated')
  console.log(
    `PREREQUISITE: previous phase is ${previous.state}; implementation must not silently skip its review/integration.`,
  );
console.log(
  `Read AGENTS.md, context.md, docs/contracts.md, docs/api.json, docs/decisions.md, team/member-${member}/context.md and team/member-${member}/phase-${phase}.md. Implement only Student ${member} Phase ${phase}. Preserve contracts and other owners' files. Run checks and update phase evidence/handoff/status truthfully. Stop before commit/push/merge and the next phase. This command prints a brief; it does not run an AI agent. Current status: ${status.phases[phase].state}.`,
);
