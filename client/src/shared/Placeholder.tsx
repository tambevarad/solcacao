import { Construction } from 'lucide-react';
import { useLocale } from '../features/shell/public.js';

/**
 * Clearly labeled template slot for a page whose owner has not merged it yet. Owners replace
 * their page's <Placeholder> with the real implementation; never ship it as final content.
 */
export function Placeholder({ name, owner }: { name: string; owner: number }) {
  const { t } = useLocale();
  return (
    <section
      data-placeholder={name}
      className="rounded border-2 border-dashed border-copper/60 bg-white/60 p-8"
    >
      <p className="mb-3 inline-flex items-center gap-2 rounded bg-copper px-2 py-1 text-xs font-semibold tracking-wide text-ivory uppercase">
        <Construction aria-hidden="true" className="size-4" />
        {t('shell.placeholder.badge')}
      </p>
      <h1 className="text-2xl font-semibold">{name}</h1>
      <p className="mt-3 text-cacao/80">{t('shell.placeholder.body', { owner })}</p>
    </section>
  );
}
