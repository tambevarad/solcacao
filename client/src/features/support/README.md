# Support frontend

Scope: contact, feedback, a sampler inquiry, informational views and WhatsApp redirection.
Current Phase 3/4 results and limitations are in `team/member-5/phase-3-evidence.md` and
`team/member-5/phase-4-evidence.md`. The original Phase 2 plan remains in `team/member-5/phase-2.md`.

The Story page describes the catalog and business journeys in the supplied SolCacao requirements
document (sections 1, 3 and 4). The Care page explains how to find available product information
and ask a product question. It gives no invented storage temperatures, shelf life, allergen
assurances, sourcing certifications or business history. Both pages have matching EN/ES copy,
localized metadata, existing approved-library imagery and localized navigation links.

## Local preview in Ubuntu WSL

```sh
cd "/mnt/c/Users/Daniel Yglesias/Desktop/solcacao"
source ~/.nvm/nvm.sh
nvm use
VITE_API_MODE=mock npm run dev:client
```

Open the Vite URL in your Windows browser. Routes are `/en/contact`, `/en/feedback`, `/en/sampler`,
`/en/story` and `/en/care`; switch to Spanish through the shared language control.

## WhatsApp setup when a number is available

Daniel confirmed that no business number has been set up yet and the intended destination is
a US number. No number was invented, purchased, registered or configured for the live UI.
The WhatsApp link stays hidden until there is a valid destination.

When the team has its WhatsApp-enabled number, set `VITE_WHATSAPP_NUMBER` in the root local `.env`
to country code `1` followed by the ten-digit US number. Use digits only, with no `+`, spaces,
parentheses or dashes. Restart Vite after changing it. This is a public destination number,
not an API token; no WhatsApp credentials or messaging service are needed for a redirect link.

Verify that the link opens the intended conversation, that the generic message is translated
and encoded, and that no contact-form values appear in the URL. Opening the link does not send
a message automatically. Keep the value blank if the team does not yet have a destination.

The tests use synthetic numbers only to verify link construction; they do not contact WhatsApp
or prove a number is active or belongs to the team.

This preview uses mock adapters only. Use the HTTP setup below for actual persistence/mail.

## Phase 3 HTTP mode

Start the existing MongoDB/Mailpit services with `npm run services`. Configure the existing
server environment as described in `.env.example` (use a generated local JWT secret, never put
SMTP credentials in a VITE variable). Seed the development fixture catalog with
`npm run seed:catalog`. In WSL, start the app in HTTP mode:

```sh
source ~/.nvm/nvm.sh
VITE_API_MODE=http npm run dev
```

Alternatively set local `VITE_API_MODE=http` in `.env` and restart Vite. Keep
`VITE_API_BASE_URL=/api` for the existing development proxy. The support pages use `api.support`
and `api.catalog`; the shared transport unwraps responses. No fallback to fixture success occurs
when the real API fails. Use only synthetic data during the course demo.

The HTTP inquiry adapter waits up to 20 seconds for a response, then releases the form for retry.
It does not cancel server work: an inquiry may already be saved. Unchanged retries reuse their
request ID to recover the same receipt without resending email. Automatic retries are disabled.
Editing validated content starts a different logical request with a new ID; reloading also clears
the in-memory draft/ID. Do not reload after an uncertain result if you want to recover its receipt.

Timeout, throttling, unavailable service and conflicting-reference errors have matching EN/ES
messages. Draft fields and sampler selections survive failure. Backend field-error text is never
rendered directly; known fields map to localized hints and unknown fields to the form summary.
The summary receives keyboard focus; successful receipt focus and notification status distinguish
the saved inquiry from email delivery.
