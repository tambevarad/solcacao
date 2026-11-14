# Member 5 handoff — Phases 3 and 4

## Current handoff — November 14, 2026

Daniel authorized both phases under D22, building on preserved uncommitted Member 5 work.
Daniel authorized commit, push and PR creation on November 14. Reviewer: **tambevarad**.
Publication results will be recorded after GitHub confirms the PR; no approval is claimed.
Branch `daniel-support` is synchronized with `origin/development` at `a1a8f9d`, including PR #26
and Reethika's merged PR #30. No rebase, force push, deployment or primary-branch commit occurred.

Contact, feedback and sampler use real HTTP with stable request IDs for unchanged retries.
Twenty-second uncertain responses, 429, 503, conflicting IDs and field errors have localized
messages; drafts survive failures. Sampler mail contains trusted server catalog names, quantities
and IDs, escaped in HTML. Quote mail preserves the existing public signature and adds localized
request-received wording without pricing, production or delivery promises. Mail status is separate
from saved state. Server-derived snapshots and strict schemas reject browser-forged fields.

The public DTOs, endpoints, provider signatures and dependency versions are unchanged. The only
new notification shape is the owned internal `InquiryNotificationInput.samplerSelection?:
{productId:string;quantity:number;name:LocalizedText}[]`, supplied by the owned service from the
existing catalog port. Student 4's `notifyQuote` input and result are unchanged.

Real quote-route tests live under `tests/member-5/http-mongo.test.ts`: actual business registration,
sent SMTP, duplicate replay without another email, failed SMTP with a persisted/readable receipt.
The browser harness uses isolated local databases, real Docker Mailpit, and restarts Mailpit after
its outage test. Its observation/control endpoints exist only in tests, never production.

The shared parser blocker is **resolved**: `server/src/shared/errors.ts` returns malformed JSON
400 and oversized body 413, both `VALIDATION_ERROR`; owned real-app tests verify both. No shared
handler was edited. Remote-auth and local Docker prerequisites are also resolved.

Results, failure history and limitations are in the two phase evidence files. The final full
check passes 584/584 with no skips on a Linux filesystem copy; `source-verification.json` proves
243 current source/test/config files match byte for byte. Windows-mounted attempts timed out;
no tests, types or assertions were suppressed. Both local and deployed real-mail checks passed.
Deployed checks cover the existing deployed development version; coordinator must rerun after
the reviewed local changes are deployed. Real WhatsApp destination is still unavailable and hidden.

### Exact shared sampler test proposal for Varad (Member 2)

Append this test to `tests/e2e/live/journeys.live.spec.ts` in a separate owner-reviewed change.
It uses that file's existing imports/helpers and the real live test harness. No schema, signature,
migration or dependency change. Do not put it in the mock shared suite and call it persistence.

```ts
test('a six-piece sampler posts real product IDs and replays one saved enquiry', async ({
  page,
  request,
}) => {
  const products = apiResponse(page, 'GET', '/api/products');
  await page.goto('/en/sampler');
  expect((await products).status()).toBe(200);
  const add = page.getByRole('button', { name: /^Add one / }).first();
  await expect(add).toBeVisible();
  for (let piece = 0; piece < 6; piece++) await add.click();
  await page.locator('#support-name').fill('Synthetic Sampler Shopper');
  await page.locator('#support-email').fill(uniqueEmail());
  await page.locator('#support-message').fill('A synthetic six-piece sampler enquiry.');
  const saved = apiResponse(page, 'POST', '/api/inquiries');
  await page.getByRole('button', { name: 'Send enquiry', exact: true }).click();
  const response = await saved;
  expect(response.status()).toBe(201);
  const body = response.request().postDataJSON();
  expect(body.category).toBe('sampler');
  expect(
    body.samplerItems.reduce((n: number, item: { quantity: number }) => n + item.quantity, 0),
  ).toBe(6);
  for (const item of body.samplerItems) {
    expect(item.productId).toMatch(/^[a-f0-9]{24}$/i);
    expect(Object.keys(item).sort()).toEqual(['productId', 'quantity']);
  }
  const receipt = (await response.json()).data;
  expect(receipt).toMatchObject({ status: 'received', notificationStatus: 'sent' });
  const replay = await request.post('/api/inquiries', { data: body });
  expect(replay.status()).toBe(201);
  expect((await replay.json()).data).toEqual(receipt);
  await expect(page.getByText('Your enquiry has been saved.', { exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: receipt.id })).toBeFocused();
});
```

The deeper database/mail proof remains in Member 5's owned suite: one document, one captured mail,
trusted names, tampered/unknown IDs rejected. Varad integrates only the shared proposal above.

### Local-only files and review steps

The unrelated untracked `.vscode/settings.json` is preserved. The repository-wide ownership
command flags it; exclude it from the Member 5 commit. `.env`, `.agent` credentials, temporary
dependencies and browser output remain ignored. Do not stage the whole working tree blindly.
The existing preserved stashes are backups; no stash was dropped.

Cleanup confirmed the official ownership check passes all 35 proposed files on the isolated
source tree. `commit-scope.md` maps those files to requirements and lists the exact staging scope.
No files were staged. The full test suite passed again (584/584, no skips) and the HTTP-mode build
passed. The original `createHttpSupport(http)` call remains supported; its optional timeout
argument is an owned test seam and does not change the `SupportApi` contract.

Proposed commit: `feat(support): complete HTTP and live-mail verification for phases 3 and 4`.
Publish one PR into `development` under D22, requesting `tambevarad`, under Daniel's authorization.
Human visual approval, presentation rehearsal, and post-merge deployment remain
human/coordinator actions. Current results do not claim integration or a new deployment.

## Earlier phases

Phase 2 results remain in phase-2-evidence.md and Git history. This handoff describes only
the current Member 5 Phases 3 and 4 work; prior catalog enhancements are outside this change.
