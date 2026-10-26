# Shared UI primitives

Owner: Student 2. Import from the barrel only:

```tsx
import { Button, Field, Select, TextArea, Dialog, Drawer } from '../../../shared/index.js';
import { LoadingState, EmptyState, ErrorState, buttonStyles } from '../../../shared/index.js';
```

All components accept the standard React HTML props of the element they render (`ref`, `name`,
`required`, `onChange`, `aria-*` ...). Labels and messages are passed in already translated with
`useLocale().t(...)`. Styling uses the tokens in `client/src/styles.css`: `ivory`, `cacao`,
`copper`, `line`, `error`. Need a variant or a new primitive? Ask Student 2 instead of forking styles.

## Buttons

```tsx
<Button type="submit" pending={submitting}>{t('support.form.send')}</Button>
<Button variant="secondary" onClick={reset}>{t('catalog.filters.clear')}</Button>
<Link to={localizePath(locale, '/wholesale/request')} className={buttonStyles()}>...</Link>
```

- Variants: `primary` (default), `secondary`, `ghost`. All are at least 44px high.
- Defaults to `type="button"`. Pass `type="submit"` inside forms.
- `pending` disables the button, sets `aria-busy` and shows a spinner, which prevents double submits.

## Form fields

```tsx
<Field
  label={t('support.form.email')}
  type="email"
  name="email"
  required
  autoComplete="email"
  value={email}
  onChange={(event) => setEmail(event.target.value)}
  hint={t('support.form.emailHint')}
  error={errors.email}
/>
<TextArea label={t('support.form.message')} name="message" rows={6} error={errors.message} />
<Select label={t('b2b.wizard.packaging')} value={packaging} onChange={...}>
  <option value="sleeve">{t('b2b.packaging.sleeve')}</option>
</Select>
```

- The visible label is required. Placeholders are not labels.
- `error` sets `aria-invalid` and links the message through `aria-describedby`, together with `hint`.
- `required` adds the native attribute and a decorative `*`.
- `className` styles the wrapper; use `inputClassName` for the control itself.
- Error summaries and focus management for whole forms stay in the feature.

## Dialog and Drawer

```tsx
const [open, setOpen] = useState(false);
<Dialog open={open} onClose={() => setOpen(false)} title={t('auth.dialog.title')}>
  <LoginForm />
</Dialog>

<Drawer
  open={cart.open}
  onClose={() => cart.setOpen(false)}
  side="right"
  title={t('catalog.cart.title')}
  footer={<Button fullWidth>{t('catalog.cart.checkout')}</Button>}
>
  {lines}
</Drawer>
```

While open, both components:

- render into `document.body` and make the rest of the page `inert`;
- move focus to `initialFocusRef` or the first focusable element (the close button);
- trap Tab and Shift+Tab, close on Escape and on overlay click;
- lock background scroll;
- restore focus to the element that opened them.

With nested modals, only the top one reacts. The parent owns the `open` state; `onClose` must set it
to false. `closeLabel` overrides the default `shell.action.close`. Student 3's `CartDrawer` can use
`<Drawer side="right">` and Student 1's auth modal can use `<Dialog>`; each owner decides.

## Request states

```tsx
if (status === 'loading') return <LoadingState />;
if (status === 'error') return <ErrorState description={t('catalog.list.error')} onRetry={reload} />;
if (!items.length) return <EmptyState title={t('catalog.list.empty')} action={<Button ...>} />;
```

Keep loading, empty and error visually distinct. `ErrorState` is announced as an alert;
`LoadingState` is a polite status.

## Photos

```tsx
import { Photo, photos } from '../../../shared/index.js';

<Photo image={photos.homeStory} ratio="aspect-[3/2]" sizes="(min-width: 768px) 50vw, 100vw" />
<Photo image={photos.packagingGiftBox} ratio="aspect-square" decorative />
```

- **Where the photos are:** `photos` (in `photos.ts`) lists every approved site photo, with its responsive files, true size, focal point and EN/ES alt text. Sources and licenses are in `docs/assets.md`.
- **Sizing:** set `sizes` to the slot's rendered width so phones download the 640 px file.
- **Above the fold:** use `priority` on the one image above the fold, usually a hero. Everything else lazy-loads.
- **Decorative images:** use `decorative` when the image sits inside a labeled link or radio card. Otherwise its alt text repeats the label.
- **Adding photos:** need a photo that isn't in the library? Ask Student 2 to add it, with its source and license; don't hotlink or drop files into a feature folder.
- **Product photos:** these belong in the product data (`Product.images`), not in `photos`. For catalog fixtures, `productPhotos` provides 21 square photos already in that shape (7 bars, 7 truffles/pralines, 7 seasonal): `images: [productPhotos.darkBarCocoa, productPhotos.darkShards]`. They're illustrative stock for fictional products; see `docs/assets.md`.
- **Icons:** the favicon, Apple touch icon and social share image live in `client/public/` and are registered in `docs/assets.md`.

## Placeholder

`<Placeholder name="CatalogPage" owner={3} />` marks an unmerged page slot. Replace it with your real
page. It must not remain in a Phase 2 submission.
