import { existsSync, readFileSync } from 'node:fs';
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
const failures = [];
for (const p of [
  'context.md',
  'AGENTS.md',
  'docs/contracts.md',
  'docs/api.json',
  'docs/ownership.json',
  'docs/requirements.md',
  'docs/integration.md',
  'docs/submissions.md',
])
  if (!existsSync(p)) failures.push(`Missing ${p}`);
const states = new Set(['not_started', 'in_progress', 'blocked', 'ready_for_review', 'integrated']);
for (let n = 1; n <= 5; n++) {
  for (const f of [
    'context.md',
    'handoff.md',
    'status.json',
    ...['1', '2', '3', '4'].flatMap((p) => [`phase-${p}.md`, `phase-${p}-evidence.md`]),
  ])
    if (!existsSync(`team/member-${n}/${f}`)) failures.push(`Missing member ${n} ${f}`);
  const status = read(`team/member-${n}/status.json`);
  for (const phase of ['1', '2', '3', '4'])
    if (!states.has(status.phases[phase]?.state))
      failures.push(`Invalid member ${n} phase ${phase} state`);
}
for (const f of ['auth', 'shell', 'catalog', 'b2b', 'support']) {
  const en = read(`client/src/features/${f}/locales/en.json`),
    es = read(`client/src/features/${f}/locales/es.json`);
  if (JSON.stringify(Object.keys(en).sort()) !== JSON.stringify(Object.keys(es).sort()))
    failures.push(`${f}: EN/ES keys differ`);
  for (const [key, value] of Object.entries({ ...en, ...es }))
    if (!key.startsWith(`${f}.`) || typeof value !== 'string')
      failures.push(`${f}: invalid localization key ${key}`);
}
const api = read('docs/api.json');
const seen = new Set();
for (const e of api.endpoints) {
  const key = e.method + ' ' + e.path;
  if (seen.has(key)) failures.push(`Duplicate endpoint ${key}`);
  seen.add(key);
  if (![1, 2, 3, 4, 5].includes(e.owner)) failures.push(`Missing owner ${key}`);
}
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  'Structure, phase metadata, endpoint inventory and translation parity valid. Feature completion is not certified by this check.',
);
