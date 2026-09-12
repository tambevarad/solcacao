import { createContext, useContext, type ReactNode } from 'react';
import type { Locale } from '../../../../contracts/index.js';
export interface LocaleState {
  locale: Locale;
  setLocale(value: Locale): void;
  t(key: string): string;
}
const Context = createContext<LocaleState>({
  locale: 'en',
  setLocale: () => {
    throw new Error('Template: implement locale switching');
  },
  t: (key) => key,
});
export function LocaleProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
export function useLocale() {
  return useContext(Context);
}
