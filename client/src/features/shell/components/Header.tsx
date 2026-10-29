import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, Menu, Search, ShoppingBag, UserRound } from 'lucide-react';
import { useAuth } from '../../auth/public.js';
import { useCart } from '../../catalog/public.js';
import { NotImplementedError } from '../../../api/notImplemented.js';
import { useLocale } from '../public.js';
import { localizePath, stripLocale } from '../locale.js';
import { BRAND_NAME } from '../meta.js';
import { accountLinks, isNavGroup, primaryNavigation, type NavGroup } from '../navigation.js';
import { LanguageSwitcher } from './LanguageSwitcher.js';
import { MobileNav } from './MobileNav.js';
import { SearchForm } from './SearchForm.js';
import { ShellLink, iconButton } from './ShellLink.js';

const navLink =
  'inline-flex min-h-11 items-center px-1 font-medium underline-offset-8 hover:underline aria-[current=page]:underline';

/** Sticky site header: menu, search, brand, language, account and the shared cart count. */
export function Header() {
  const { t, locale } = useLocale();
  const { user, logout } = useAuth();
  const cart = useCart();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartPending, setCartPending] = useState(false);
  const searchTrigger = useRef<HTMLButtonElement>(null);
  const page = stripLocale(location.pathname) + location.search;

  // Close transient UI when the page changes; a language switch keeps it open. Adjusted during
  // render (not in an effect) so a mount-time reset can never override an early click.
  const [lastPage, setLastPage] = useState(page);
  if (page !== lastPage) {
    setLastPage(page);
    setMenuOpen(false);
    setSearchOpen(false);
    setCartPending(false);
  }

  useEffect(() => {
    if (!cartPending) return;
    const timer = setTimeout(() => setCartPending(false), 6000);
    return () => clearTimeout(timer);
  }, [cartPending]);

  // useCart() is Student 3's port. Until their CartProvider merges, its stub throws
  // NotImplementedError; show a labeled pending message instead of failing.
  function openCart() {
    try {
      cart.setOpen(true);
    } catch (error) {
      if (!(error instanceof NotImplementedError)) throw error;
      setCartPending(true);
    }
  }

  const account = user ? accountLinks.account : accountLinks.signIn;
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory">
      <div className="mx-auto grid h-16 max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t('shell.menu.open')}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            className={`${iconButton} md:hidden`}
          >
            <Menu aria-hidden="true" className="size-6" />
          </button>
          <button
            ref={searchTrigger}
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            aria-label={t(searchOpen ? 'shell.search.close' : 'shell.search.open')}
            aria-expanded={searchOpen}
            aria-controls="site-search"
            className={iconButton}
          >
            <Search aria-hidden="true" className="size-5" />
          </button>
        </div>
        <Link
          to={localizePath(locale)}
          aria-label={t('shell.header.homeLink')}
          // Below 360px the full letter-spaced wordmark plus four 44px icon buttons is wider than
          // the screen (WCAG 1.4.10 Reflow at 320px), so the wordmark tightens there only.
          className="px-2 text-lg font-semibold tracking-[0.25em] uppercase max-[359px]:px-0 max-[359px]:text-base max-[359px]:tracking-[0.18em] sm:text-xl"
        >
          {BRAND_NAME}
        </Link>
        <div className="flex items-center justify-end gap-1">
          <LanguageSwitcher className="mr-1 hidden md:flex" />
          <Link
            to={localizePath(locale, account.to)}
            className={`${iconButton} gap-2 lg:w-auto lg:px-3`}
          >
            <UserRound aria-hidden="true" className="size-5" />
            <span className="sr-only lg:not-sr-only">{t(account.labelKey)}</span>
          </Link>
          {user && (
            // Desktop only; on phones Sign out lives in the menu drawer.
            <div className="hidden md:flex">
              <button
                type="button"
                onClick={logout}
                className={`${iconButton} gap-2 lg:w-auto lg:px-3`}
              >
                <LogOut aria-hidden="true" className="size-5" />
                <span className="sr-only lg:not-sr-only">{t('shell.account.signOut')}</span>
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={openCart}
            aria-label={t('shell.cart.open', { count: cart.count })}
            aria-haspopup="dialog"
            aria-expanded={cart.open}
            className={iconButton}
          >
            <ShoppingBag aria-hidden="true" className="size-5" />
            {cart.count > 0 && (
              <span
                aria-hidden="true"
                data-testid="cart-count"
                className="absolute top-0.5 right-0.5 min-w-5 rounded-full bg-copper px-1 text-center text-xs leading-5 font-semibold text-ivory"
              >
                {cart.count > 99 ? '99+' : cart.count}
              </span>
            )}
          </button>
        </div>
      </div>

      <nav aria-label={t('shell.nav.label')} className="hidden border-t border-line md:block">
        <ul className="mx-auto flex h-12 max-w-[1200px] items-center justify-center gap-6 px-8 lg:gap-10">
          {primaryNavigation.map((item) => (
            <li key={item.id} className="relative">
              {isNavGroup(item) ? (
                <CollectionsMenu group={item} />
              ) : (
                <ShellLink item={item} className={navLink} />
              )}
            </li>
          ))}
        </ul>
      </nav>

      {searchOpen && (
        <div id="site-search" className="border-t border-line">
          <div className="mx-auto max-w-[1200px] px-4 py-3 md:px-6 lg:px-8">
            <SearchForm
              autoFocus
              onSubmitted={() => setSearchOpen(false)}
              onEscape={() => {
                setSearchOpen(false);
                searchTrigger.current?.focus();
              }}
            />
          </div>
        </div>
      )}

      <p
        role="status"
        className={
          cartPending
            ? 'absolute top-full right-2 mt-2 max-w-xs rounded border border-copper bg-ivory p-3 text-sm shadow-lg sm:right-4'
            : 'sr-only'
        }
      >
        {cartPending ? t('shell.cart.pending') : ''}
      </p>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}

/** Desktop disclosure for catalog categories. Closes on Escape, outside click or focus loss. */
function CollectionsMenu({ group }: { group: NavGroup }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const location = useLocation();
  const page = location.pathname + location.search;
  const [lastPage, setLastPage] = useState(page);
  if (page !== lastPage) {
    setLastPage(page);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target))
        setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={container}
      onBlur={(event) => {
        if (
          !(event.relatedTarget instanceof Node) ||
          !container.current?.contains(event.relatedTarget)
        )
          setOpen(false);
      }}
    >
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-11 items-center gap-1 px-1 font-medium hover:underline hover:underline-offset-8"
      >
        {t(group.labelKey)}
        <ChevronDown
          aria-hidden="true"
          className={`size-4 transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul
          id={listId}
          className="absolute top-full left-1/2 z-10 mt-1 w-56 -translate-x-1/2 rounded border border-line bg-ivory py-2 shadow-lg"
        >
          {group.children.map((child) => (
            <li key={child.id}>
              <ShellLink
                item={child}
                className="flex min-h-11 items-center px-4 hover:bg-line/50 aria-[current=page]:font-semibold"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
