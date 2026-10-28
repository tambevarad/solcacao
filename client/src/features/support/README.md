# Member 5 frontend demo

Scope: contact, feedback, a sampler inquiry, informational views and WhatsApp redirection.
The academic Phase 2 checklist and demo are in `team/member-5/phase-2.md`.

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
npm run dev:client
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
