import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

export type ThemePreference = 'system' | 'dark' | 'light';
export type Theme = 'dark' | 'light';

/** Also read by the inline script in index.html — rename both or neither. */
export const THEME_KEY = 'kometa.theme';

/** try/catch, not a null check: Safari's private window throws from the getter itself. */
export function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === 'dark' || v === 'light' ? v : 'system';
  } catch {
    return 'system';
  }
}

/**
 * Spec §3: follow the system, dark when it says nothing, a settings screen can override. The CSS
 * does all of the painting — this only writes the override and answers "which one is showing" for
 * the one thing CSS cannot reach, the map's basemap style.
 *
 * Shared by the customer app and the vendor console since 2026-09-17. One service and one
 * `kometa.theme` key, because the two apps are served from one origin: a barber who runs the
 * console and the consumer app in the same browser sets the theme once. (The admin console is
 * deliberately not a caller — it stays dark-only.)
 *
 * Root-provided but injected only by lazy routes, so it never reaches the customer app's initial
 * bundle.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly preference = signal<ThemePreference>(this.browser ? readPreference() : 'system');
  private readonly systemLight = signal(false);

  readonly resolved = computed<Theme>(() => {
    const p = this.preference();
    return p === 'system' ? (this.systemLight() ? 'light' : 'dark') : p;
  });

  constructor() {
    if (!this.browser || typeof matchMedia !== 'function') return;
    const query = matchMedia('(prefers-color-scheme: light)');
    this.systemLight.set(query.matches);
    query.addEventListener?.('change', (e) => this.systemLight.set(e.matches));
  }

  set(next: ThemePreference): void {
    this.preference.set(next);
    if (next === 'system') this.root.removeAttribute('data-theme');
    else this.root.setAttribute('data-theme', next);
    try {
      if (next === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private window: the choice holds for this page view.
    }
  }
}
