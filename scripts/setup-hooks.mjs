import { execFileSync } from 'node:child_process';
execFileSync('git', ['config', 'core.hooksPath', '.githooks']);
console.log(
  'Local primary-branch commit guard enabled. Remote protection still needs GitHub settings.',
);
