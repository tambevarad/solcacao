import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const args = process.argv.slice(2),
  member = args[args.indexOf('--member') + 1],
  base = args[args.indexOf('--base') + 1];
if (
  !args.includes('--member') ||
  !args.includes('--base') ||
  !['1', '2', '3', '4', '5'].includes(member) ||
  !base ||
  base.startsWith('-')
) {
  console.error('Usage: npm run check:ownership -- --member 1..5 --base development');
  process.exit(1);
}
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).split('\0').filter(Boolean);
let files;
try {
  files = new Set([
    ...git('diff', '--name-only', '-z', `${base}...HEAD`),
    ...git('diff', '--name-only', '-z', 'HEAD'),
    ...git('ls-files', '--others', '--exclude-standard', '-z'),
  ]);
} catch {
  console.error('Could not compare Git base. Initialize/clone repository and confirm base exists.');
  process.exit(1);
}
const rules = JSON.parse(readFileSync('docs/ownership.json', 'utf8'))[member];
const denied = [...files].filter(
  (f) => !rules.some((p) => (p.endsWith('/') ? f.startsWith(p) : f === p)),
);
if (denied.length) {
  console.error(
    'Outside your ownership; hand off to owner or separate approved shared PR:\n' +
      denied.join('\n'),
  );
  process.exit(1);
}
console.log(
  `All ${files.size} changed files are within Student ${member} ownership. Peer review remains required.`,
);
