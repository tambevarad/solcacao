import { spawnSync } from 'node:child_process';
const r = spawnSync('docker', ['compose', 'up', '-d'], { stdio: 'inherit' });
if (r.error) {
  console.error(
    'Install/start Docker Desktop or configure your own Mongo and SMTP sink as documented.',
  );
  process.exit(1);
}
process.exit(r.status ?? 1);
