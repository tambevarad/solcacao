import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const args = process.argv.slice(2),
  value = (k) => args[args.indexOf(k) + 1];
const member = value('--member'),
  phase = value('--phase'),
  generate = args.includes('--packet');
if (
  !args.includes('--member') ||
  !args.includes('--phase') ||
  !['1', '2', '3', '4', '5'].includes(member) ||
  !['1', '2', '3', '4'].includes(phase)
) {
  console.error('Usage: npm run agent -- --member 1..5 --phase 1|2|3|4');
  process.exit(1);
}
const read = (p) => readFileSync(p, 'utf8');
const status = JSON.parse(read(`team/member-${member}/status.json`));
const previous = status.phases[String(Number(phase) - 1)];
const roster = JSON.parse(read('team/roster.json'))[member];
let branch = 'unknown';
try {
  branch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
} catch {}
const blockers = [];
const notes = [];
if (previous && previous.state !== 'integrated') {
  // D21: the coordinator authorized every member to start Phase 2 before Phase 1 statuses were recorded.
  if (phase === '2')
    notes.push(
      `Previous execution phase is ${previous.state}. Coordinator decision D21 (docs/decisions.md) authorizes Phase 2 implementation anyway: proceed, mention this in phase-2-evidence.md, and record your Phase 1 status truthfully.`,
    );
  // D22: Phases 3 and 4 share one PR per member, so Phase 3 is not integrated yet when Phase 4 starts.
  else if (phase === '4')
    notes.push(
      `Previous execution phase is ${previous.state}. Coordinator decision D22 (docs/decisions.md) runs Phases 3 and 4 together in one PR: proceed with both, keeping each phase's evidence in its own file.`,
    );
  else
    blockers.push(
      `Previous execution phase is ${previous.state}; complete its reviewed integration first.`,
    );
}
if (phase === '3' || phase === '4')
  notes.push(
    'Coordinator decision D22 (docs/decisions.md): one member at a time, in the order Student 2, 4, 3, 5, 1. Start only after the previous turn has merged, and merge development into your branch first.',
  );
if (branch !== roster.branch)
  blockers.push(
    `Expected dedicated branch ${roster.branch}, found ${branch}. Run setup after template review; do not implement on a primary or another member's branch.`,
  );
const files = [
  'AGENTS.md',
  'docs/context.md',
  'docs/roadmap.md',
  'docs/contracts.md',
  'docs/api.json',
  'docs/decisions.md',
  'docs/design.md',
  'docs/design/frans-reference.md',
  `team/member-${member}/context.md`,
  `team/member-${member}/phase-${phase}.md`,
  `team/member-${member}/handoff.md`,
];
if (phase === '1') files.push('docs/phase1/README.md', 'docs/phase1/prototype/README.md');
if (phase === '2') files.push('docs/integration.md', 'client/src/shared/README.md');
if (phase === '3') files.push('docs/integration.md', 'docs/submissions.md');
if (phase === '4') files.push('docs/integration.md', 'docs/submissions.md', 'docs/deployment.md');
let packet = `# Student ${member} Phase ${phase} task packet\n\nImplement only Student ${member} Phase ${phase}. Follow blueprint weeks/roadmap. Read all references below and current code, do not blindly overwrite existing work. Stop after requested phase with actual checks/evidence and proposed commit; no automatic commit, push, merge, deploy or next phase.\n\nExpected branch: ${roster.branch}. Current branch: ${branch}.\n\n${blockers.length ? 'BLOCKED FOR IMPLEMENTATION:\n' + blockers.map((x) => '- ' + x).join('\n') : 'Entry checks passed; confirm peer dependencies from phase playbook.'}\n\n${notes.length ? 'NOTES:\n' + notes.map((x) => '- ' + x).join('\n') + '\n\n' : ''}`;
for (const p of files) packet += `\n---\n\n## Reference ${p}\n\n${read(p)}\n`;
if (generate) {
  mkdirSync('.agent', { recursive: true });
  writeFileSync('.agent/task.md', packet);
  console.log(
    `Task packet generated at .agent/task.md. Read it before edits. ${blockers.length ? 'Implementation blocked: ' + blockers.join(' ') : 'Ready to inspect owned implementation.'}`,
  );
  if (blockers.length) process.exitCode = 2;
} else console.log(packet);
