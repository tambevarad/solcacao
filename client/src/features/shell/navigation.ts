/**
 * The one navigation definition. Desktop nav, the mobile drawer and the footer all render from
 * these lists, so links cannot drift apart. `to` is relative to the locale root and must match a
 * route in client/src/routes.tsx (tests/member-2 enforces this). Category values are the canonical
 * ProductQuery.category enum, never translated.
 */
export interface NavItem {
  id: string;
  to: string;
  labelKey: string;
}

export interface NavGroup extends NavItem {
  children: NavItem[];
}

export const collectionLinks: NavItem[] = [
  { id: 'all', to: '/catalog', labelKey: 'shell.nav.allProducts' },
  { id: 'bars', to: '/catalog?category=bar', labelKey: 'shell.nav.bars' },
  { id: 'truffles', to: '/catalog?category=truffle', labelKey: 'shell.nav.truffles' },
  { id: 'seasonal', to: '/catalog?category=seasonal', labelKey: 'shell.nav.seasonal' },
];

/** Shopper navigation from docs/design.md: Shop, Collections, Wholesale, Our Story, Contact. */
export const primaryNavigation: (NavItem | NavGroup)[] = [
  { id: 'shop', to: '/catalog', labelKey: 'shell.nav.shop' },
  {
    id: 'collections',
    to: '/catalog',
    labelKey: 'shell.nav.collections',
    children: collectionLinks,
  },
  { id: 'wholesale', to: '/wholesale', labelKey: 'shell.nav.wholesale' },
  { id: 'story', to: '/story', labelKey: 'shell.nav.story' },
  { id: 'contact', to: '/contact', labelKey: 'shell.nav.contact' },
];

export const footerNavigation: { id: string; headingKey: string; items: NavItem[] }[] = [
  {
    id: 'shop',
    headingKey: 'shell.footer.shop',
    items: [...collectionLinks, { id: 'sampler', to: '/sampler', labelKey: 'shell.nav.sampler' }],
  },
  {
    id: 'business',
    headingKey: 'shell.footer.business',
    items: [
      { id: 'wholesale', to: '/wholesale', labelKey: 'shell.nav.wholesale' },
      { id: 'quote', to: '/wholesale/request', labelKey: 'shell.nav.quoteRequest' },
    ],
  },
  {
    id: 'help',
    headingKey: 'shell.footer.help',
    items: [
      { id: 'story', to: '/story', labelKey: 'shell.nav.story' },
      { id: 'care', to: '/care', labelKey: 'shell.nav.care' },
      { id: 'contact', to: '/contact', labelKey: 'shell.nav.contact' },
      { id: 'feedback', to: '/feedback', labelKey: 'shell.nav.feedback' },
    ],
  },
];

export const accountLinks = {
  signIn: { id: 'signIn', to: '/login', labelKey: 'shell.account.signIn' },
  register: { id: 'register', to: '/register', labelKey: 'shell.account.register' },
  account: { id: 'account', to: '/account', labelKey: 'shell.account.account' },
} satisfies Record<string, NavItem>;

export function isNavGroup(item: NavItem | NavGroup): item is NavGroup {
  return 'children' in item;
}

/** Every distinct link target, used by tests to prove each one resolves to a real route. */
export function allNavigationTargets(): string[] {
  const items = [
    ...primaryNavigation.flatMap((item) => (isNavGroup(item) ? [item, ...item.children] : [item])),
    ...footerNavigation.flatMap((group) => group.items),
    ...Object.values(accountLinks),
  ];
  return [...new Set(items.map((item) => item.to))];
}
