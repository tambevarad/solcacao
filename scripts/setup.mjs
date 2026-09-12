import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
const args = process.argv.slice(2),
  member = args[args.indexOf('--member') + 1];
function stop(s) {
  console.error(s);
  process.exit(1);
}
if (!args.includes('--member') || !['1', '2', '3', '4', '5'].includes(member))
  stop('Usage: npm run setup -- --member 1..5');
const [major, minor] = process.versions.node.split('.').map(Number);
if (major !== 24 || minor < 15) stop('Use Node version in .nvmrc (24.19.0).');
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
if (git('status', '--porcelain'))
  stop('Working tree has changes. Preserve/review them before switching branches.');
const remote = git('remote').split('\n').includes('origin');
if (remote) {
  git('fetch', 'origin');
}
try {
  git('show', `${remote ? 'origin/development' : 'development'}:docs/roadmap.md`);
} catch {
  stop(
    'Corrected template must first be peer-reviewed into development. Follow docs/github-setup.md; no primary branch bypass.',
  );
}
const roster = JSON.parse(readFileSync('team/roster.json', 'utf8'))[member];
if (
  !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(roster.branch) ||
  ['main', 'development'].includes(roster.branch)
)
  stop('Invalid dedicated branch in roster. Coordinator must fix through PR.');
git('switch', 'development');
if (remote) git('pull', '--ff-only', 'origin', 'development');
// Read reviewed roster after synchronization, not a stale local copy.
const reviewed = JSON.parse(readFileSync('team/roster.json', 'utf8'))[member];
if (reviewed.branch !== roster.branch)
  stop('Roster changed during sync. Rerun setup from reviewed development.');
let exists = false;
try {
  git('show-ref', '--verify', `refs/heads/${roster.branch}`);
  exists = true;
} catch {}
if (exists) {
  git('switch', roster.branch);
  try {
    git('merge', '--ff-only', 'development');
  } catch {
    stop(
      'Branch diverged. Ask agent to merge development on your feature branch, resolve conflicts with owners, verify, then rerun setup. No reset or force push performed.',
    );
  }
} else {
  let remoteExists = false;
  if (remote) {
    try {
      git('show-ref', '--verify', `refs/remotes/origin/${roster.branch}`);
      remoteExists = true;
    } catch {}
  }
  if (remoteExists) {
    git('switch', '--track', `origin/${roster.branch}`);
    try {
      git('merge', '--ff-only', 'development');
    } catch {
      stop('Resolve branch divergence through a normal merge and rerun.');
    }
  } else git('switch', '-c', roster.branch, 'development');
}
if (!existsSync('.env')) {
  let env = readFileSync('.env.example', 'utf8').replace(
    'replace-with-at-least-32-random-characters-before-phase2',
    randomBytes(32).toString('hex'),
  );
  writeFileSync('.env', env, { mode: 0o600 });
}
git('config', 'core.hooksPath', '.githooks');
const npm = process.env.npm_execpath;
if (!npm) stop('Run through npm run setup so npm path is known.');
const installed = spawnSync(process.execPath, [npm, 'ci'], { stdio: 'inherit' });
if (installed.status !== 0) stop('Dependency installation failed; no implementation started.');
console.log(
  `Setup ready for Student ${member} on ${roster.branch}. Environment values were not printed. Start services with npm run services for Phase2 onward, then give your agent the requested phase command.`,
);
