import {
  initialWizardState,
  wizardReducer,
  type WizardAction,
  type WizardState,
} from './wizard.js';

/** The wizard's state, the account it belongs to, and a counter that changes when it is discarded. */
export interface QuoteDraftEntry {
  readonly owner: string | null;
  readonly generation: number;
  readonly state: WizardState;
}

/**
 * Keeps the quote wizard's state outside the page, so it survives the page unmounting: the sign-in
 * guard replaces the wizard when the one-hour session ends, and a visitor may open another page
 * and come back. Memory only, for one browser tab: nothing is written to browser storage, a reload
 * clears it, and it is never shown to a different account (signing in as someone else discards it).
 */
export interface QuoteDraftStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): QuoteDraftEntry;
  /** Makes `owner` the draft's account. A different account starts from an empty wizard. */
  claim(owner: string | null): void;
  /** A user action: applies only while the draft belongs to `owner`. */
  update(owner: string | null, action: WizardAction): void;
  /**
   * The result of a request started earlier: applies only if the draft has not been discarded
   * since (`generation` unchanged), even when the page has unmounted in the meantime.
   */
  settle(generation: number, action: WizardAction): void;
  /** Discards the draft (tests, and anything that must start from nothing). */
  clear(): void;
}

export function createQuoteDraftStore(): QuoteDraftStore {
  let entry: QuoteDraftEntry = { owner: null, generation: 0, state: initialWizardState() };
  const listeners = new Set<() => void>();
  function publish(next: QuoteDraftEntry) {
    entry = next;
    for (const listener of listeners) listener();
  }
  function apply(action: WizardAction) {
    const state = wizardReducer(entry.state, action);
    if (state !== entry.state) publish({ ...entry, state });
  }
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => entry,
    claim(owner) {
      if (owner !== entry.owner)
        publish({ owner, generation: entry.generation + 1, state: initialWizardState() });
    },
    update(owner, action) {
      if (owner === entry.owner) apply(action);
    },
    settle(generation, action) {
      if (generation === entry.generation) apply(action);
    },
    clear() {
      publish({ owner: null, generation: entry.generation + 1, state: initialWizardState() });
    },
  };
}

/** The app's store: one wizard per browser tab. */
export const quoteDraftStore = createQuoteDraftStore();
