import { useId } from 'react';
import { useAuth } from '../../auth/public.js';
import { Drawer } from '../../../shared/Drawer.js';
import { useLocale } from '../public.js';
import { accountLinks, isNavGroup, primaryNavigation } from '../navigation.js';
import { LanguageSwitcher } from './LanguageSwitcher.js';
import { SearchForm } from './SearchForm.js';
import { ShellLink } from './ShellLink.js';

const drawerLink =
  'flex min-h-11 items-center py-2 text-lg hover:underline aria-[current=page]:font-semibold aria-[current=page]:text-copper';

/**
 * Mobile slide-out menu built from the same primaryNavigation as the desktop bar. The shared
 * Drawer traps and restores focus, closes on Escape and locks background scroll.
 */
export function MobileNav({ open, onClose }: { open: boolean; onClose(): void }) {
  const { t } = useLocale();
  const { user, logout } = useAuth();
  const headingId = useId();
  return (
    <Drawer open={open} onClose={onClose} side="left" title={t('shell.menu.title')}>
      <div className="space-y-6">
        <SearchForm onSubmitted={onClose} />
        <nav aria-label={t('shell.nav.label')}>
          <ul className="divide-y divide-line">
            {primaryNavigation.map((item) =>
              isNavGroup(item) ? (
                <li key={item.id} className="py-2">
                  <p id={`${headingId}-${item.id}`} className="py-2 text-lg font-semibold">
                    {t(item.labelKey)}
                  </p>
                  <ul aria-labelledby={`${headingId}-${item.id}`} className="pl-4">
                    {item.children.map((child) => (
                      <li key={child.id}>
                        <ShellLink item={child} onNavigate={onClose} className={drawerLink} />
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.id}>
                  <ShellLink item={item} onNavigate={onClose} className={drawerLink} />
                </li>
              ),
            )}
          </ul>
        </nav>
        <ul className="border-t border-line pt-4">
          {user ? (
            <>
              <li>
                <ShellLink
                  item={accountLinks.account}
                  onNavigate={onClose}
                  className={drawerLink}
                />
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className={`${drawerLink} w-full text-left`}
                >
                  {t('shell.account.signOut')}
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <ShellLink item={accountLinks.signIn} onNavigate={onClose} className={drawerLink} />
              </li>
              <li>
                <ShellLink
                  item={accountLinks.register}
                  onNavigate={onClose}
                  className={drawerLink}
                />
              </li>
            </>
          )}
        </ul>
        <LanguageSwitcher className="-ml-2" />
      </div>
    </Drawer>
  );
}
