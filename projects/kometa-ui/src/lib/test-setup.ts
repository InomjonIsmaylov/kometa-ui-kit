import { afterEach } from 'vitest';

/*
 * Loaded before every spec in all three projects (angular.json `test.options.setupFiles`).
 *
 * jsdom implements neither matchMedia nor ResizeObserver. `??=` so a spec that stubs its own — vendor-page.spec.ts stubs matchMedia to
 * report a narrow viewport — still wins.
 *
 * `matches: false` for every query is the same answer the app code already falls back to when
 * matchMedia is absent (theme.ts: system dark; vendor-page.ts: narrow), so no existing spec's
 * expectation moves.
 */
const w = window as Window & { matchMedia?: Window['matchMedia'] };
w.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent: () => false,
})) as unknown as Window['matchMedia'];

/*
 * jsdom's localStorage outlives a spec file: the files in one worker share it. A spec that signs
 * in and never clears leaves a real token for the next file, whose ConsumerAuth then starts
 * signed in and makes requests that spec never expected (Wave 2 Task 7: an order-dependent
 * GET /api/consumer/favourites in vendor-page-meta and lead-token once the workers reshuffled).
 * Cleared after every test, in every project, so no spec has to remember.
 */
afterEach(() => localStorage.clear());

const g = globalThis as { ResizeObserver?: unknown };
g.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
