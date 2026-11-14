import { useEffect, useState } from 'react';
import type { CartLine, Product } from '../../../../../contracts/index.js';
import { Button, EmptyState, ErrorState, LoadingState } from '../../../shared/index.js';
import { useLocale } from '../../shell/public.js';
import { InquiryForm } from '../InquiryForm.js';
import { SupportIntro } from '../SupportIntro.js';
import { loadSamplerProducts } from '../catalog.js';

export default function SamplerPage() {
  const { locale, t } = useLocale();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<CartLine[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setStatus('loading');
    loadSamplerProducts(locale).then(
      (result) => {
        if (!active) return;
        setProducts(result);
        setStatus('ready');
        setItems((previous) =>
          previous.filter((item) => result.some((p) => p.id === item.productId)),
        );
      },
      () => {
        if (active) setStatus('error');
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);
  const total = items.reduce((count, item) => count + item.quantity, 0);
  function change(id: string, delta: number) {
    setItems((previous) => {
      if (delta > 0 && previous.reduce((count, item) => count + item.quantity, 0) >= 6)
        return previous;
      const found = previous.find((item) => item.productId === id);
      if (!found) return delta > 0 ? [...previous, { productId: id, quantity: 1 }] : previous;
      return previous
        .map((item) =>
          item.productId === id ? { ...item, quantity: item.quantity + delta } : item,
        )
        .filter((item) => item.quantity > 0);
    });
  }
  return (
    <div className="space-y-10 py-8 md:py-16">
      <SupportIntro page="sampler" />
      <InquiryForm
        category="sampler"
        samplerItems={items}
        unavailable={status !== 'ready' || !products.length}
        onSuccess={() => setItems([])}
      >
        <section id="support-samplerItems" tabIndex={-1} className="space-y-6">
          <h2 className="text-2xl">{t('support.sampler.select')}</h2>
          <p role="status" className="font-medium">
            {t('support.sampler.count', { count: total })}
          </p>
          {status === 'loading' && <LoadingState />}
          {status === 'error' && (
            <ErrorState
              description={t('support.sampler.loadError')}
              onRetry={() => setAttempt((value) => value + 1)}
            />
          )}
          {status === 'ready' && !products.length && (
            <EmptyState title={t('support.sampler.empty')} />
          )}
          {status === 'ready' && (
            <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
              {products.map((product) => {
                const quantity = items.find((item) => item.productId === product.id)?.quantity ?? 0;
                return (
                  <article key={product.id} className="min-w-0 border border-line">
                    {product.images[0] && (
                      <img
                        className="aspect-square w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        src={product.images[0].url}
                        alt={product.images[0].alt[locale]}
                      />
                    )}
                    <div className="space-y-4 p-3 sm:p-4">
                      <h3 className="break-words text-base sm:text-lg">{product.name[locale]}</h3>
                      <p className="hidden text-sm sm:block">{product.description[locale]}</p>
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <Button
                          variant="secondary"
                          className="min-w-11"
                          disabled={!quantity}
                          onClick={() => change(product.id, -1)}
                          aria-label={t('support.sampler.remove', { name: product.name[locale] })}
                        >
                          −
                        </Button>
                        <span className="order-first w-full text-center text-sm sm:order-none sm:w-auto">
                          {t(
                            quantity === 1
                              ? 'support.sampler.quantityOne'
                              : 'support.sampler.quantity',
                            { count: quantity },
                          )}
                        </span>
                        <Button
                          variant="secondary"
                          className="min-w-11"
                          disabled={total >= 6}
                          onClick={() => change(product.id, 1)}
                          aria-label={t('support.sampler.add', { name: product.name[locale] })}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
          <div className="border-y border-line py-4">
            <h3 className="font-medium">{t('support.sampler.summary')}</h3>
            {!items.length ? (
              <p>{t('support.sampler.none')}</p>
            ) : (
              <ul className="space-y-2 pt-2">
                {items.map((item) => (
                  <li key={item.productId}>
                    {t(item.quantity === 1 ? 'support.sampler.lineOne' : 'support.sampler.line', {
                      name:
                        products.find((p) => p.id === item.productId)?.name[locale] ??
                        item.productId,
                      count: item.quantity,
                    })}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </InquiryForm>
    </div>
  );
}
