import { Injectable, signal } from '@angular/core';

/** What the playground edits: a template, a component class in TypeScript and plain CSS. */
export interface PlaySource { html: string; ts: string; css: string }

const KEY = 'kometa-playground';

/** The playground's source, kept per viewer in localStorage so a reload does not lose it. */
@Injectable({ providedIn: 'root' })
export class PlayStore {
  readonly source = signal<PlaySource | null>(read());

  set(src: PlaySource): void {
    this.source.set(src);
    try { localStorage.setItem(KEY, JSON.stringify(src)); } catch { /* private window: keep it for this visit only */ }
  }

  /** Opens the playground on this source, as from a props panel's "Open in playground". */
  open(src: PlaySource): void {
    this.set(src);
    location.hash = 'playground';
  }
}

function read(): PlaySource | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return v && typeof v.html === 'string' && typeof v.ts === 'string' ? { css: '', ...v } : null;
  } catch {
    return null;
  }
}
