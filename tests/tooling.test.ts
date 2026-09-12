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
