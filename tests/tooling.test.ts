import { it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
it('phase brief rejects invalid role and warns on missing predecessor', () => {
  const bad = spawnSync(
    process.execPath,
    ['scripts/phase-brief.mjs', '--member', '9', '--phase', '2'],
    { encoding: 'utf8' },
  );
  expect(bad.status).toBe(1);
  const good = spawnSync(
    process.execPath,
    ['scripts/phase-brief.mjs', '--member', '3', '--phase', '2'],
    { encoding: 'utf8' },
  );
  expect(good.status).toBe(0);
  expect(good.stdout).toContain('Implement only Student 3 Phase 2');
});

it('Phase 2 packets cite decision D21 instead of blocking on Phase 1 status', () => {
  const result = spawnSync(
    process.execPath,
    ['scripts/phase-brief.mjs', '--member', '4', '--phase', '2'],
    { encoding: 'utf8' },
  );
  expect(result.status).toBe(0);
  expect(result.stdout).toContain('Coordinator decision D21');
  expect(result.stdout).not.toContain('complete its reviewed integration first');
  expect(result.stdout).toContain('## Reference docs/integration.md');
  expect(result.stdout).toContain('## Reference client/src/shared/README.md');
});

it('accepts Phase 1 briefs for every role and includes actual planning references', () => {
  for (let member = 1; member <= 5; member++) {
    const result = spawnSync(
      process.execPath,
      ['scripts/phase-brief.mjs', '--member', String(member), '--phase', '1'],
      { encoding: 'utf8' },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toContain(`Implement only Student ${member} Phase 1`);
    expect(result.stdout).toContain('docs/phase1/prototype/README.md');
    expect(result.stdout).toContain('MarvelApp');
  }
});
