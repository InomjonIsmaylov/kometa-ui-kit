import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaHint } from './kometa-hint';

@Component({
  imports: [KometaHint],
  template: `<k-hint [term]="term()" [(open)]="open">{{ text() }}</k-hint>`,
})
class Host {
  term = signal('Lid toʻlovi');
  open = signal(false);
  text = signal('Qidiruvdan kelgan yangi mijozning birinchi tashrifidan 12%.');
}

describe('KometaHint', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('k-hint') as HTMLElement;
    return {
      f,
      root,
      btn: root.querySelector('button.term') as HTMLButtonElement,
      note: root.querySelector('[role="note"]') as HTMLElement,
      reveal: root.querySelector('.reveal') as HTMLElement,
    };
  }

  it('makes the term itself the button and projects the sentence into a note', () => {
    const { btn, note } = render();
    expect(btn.textContent?.trim()).toBe('Lid toʻlovi');
    expect(note.textContent).toContain('birinchi tashrifidan 12%');
  });

  it('is closed at first with aria-expanded false', () => {
    const { btn, reveal } = render();
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(reveal.classList.contains('on')).toBe(false);
  });

  it('opens on click and keeps the open model in sync', () => {
    const { f, btn, reveal } = render();
    btn.click();
    f.detectChanges();
    expect(f.componentInstance.open()).toBe(true);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(reveal.classList.contains('on')).toBe(true);
    btn.click();
    f.detectChanges();
    expect(f.componentInstance.open()).toBe(false);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens when the parent sets the model', () => {
    const { f, btn, reveal } = render();
    f.componentInstance.open.set(true);
    f.detectChanges();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(reveal.classList.contains('on')).toBe(true);
  });

  it('links the button to the note with aria-controls and aria-describedby', () => {
    const { btn, note } = render();
    expect(note.id).not.toBe('');
    expect(btn.getAttribute('aria-controls')).toBe(note.id);
    expect(btn.getAttribute('aria-describedby')).toBe(note.id);
  });

  it('gives two hints two different ids', () => {
    const a = render();
    const b = render();
    expect(a.note.id).not.toBe(b.note.id);
  });

  it('closes on Escape and returns focus to the term', () => {
    const { f, btn, note } = render();
    document.body.appendChild(f.nativeElement);
    btn.click();
    f.detectChanges();
    (note as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance.open()).toBe(false);
    expect(document.activeElement).toBe(btn);
    f.nativeElement.remove();
  });

  it('lets Escape pass through while it is closed', () => {
    const { f, btn } = render();
    let seen = false;
    f.nativeElement.addEventListener('keydown', () => (seen = true));
    btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(seen).toBe(true);
  });

  it('stays in the page with no popup or fixed positioning', () => {
    const css = stylesheet(KometaHint);
    expect(css).not.toContain('position: fixed');
    expect(css).not.toContain('position: absolute');
    expect(css).not.toContain('backdrop-filter');
  });

  it('grows a 1px thread to 24px then fades the sentence in after it', () => {
    const css = stylesheet(KometaHint);
    expect(css).toMatch(/height:\s*1px/);
    expect(css).toMatch(/width:\s*var\(--hint-thread-width, 24px\)/);
    expect(css).toMatch(/opacity 280ms ease 140ms/);
  });

  it('underlines the term with dots and shows a focus ring', () => {
    const css = stylesheet(KometaHint);
    expect(css).toContain('underline dotted');
    expect(css).toContain('2px solid var(--amber)');
  });

  it('removes every transition under reduced motion', () => {
    const css = stylesheet(KometaHint);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*transition:\s*none/);
  });

  it('gives the term a 44px target on a coarse pointer', () => {
    expect(stylesheet(KometaHint)).toMatch(/pointer: coarse\)[^}]*min-height:\s*44px/);
  });

  it('uses no colour literal beyond token fallbacks', () => {
    expect(withoutFallbacks(stylesheet(KometaHint))).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});

function withoutFallbacks(css: string): string {
  return css.replace(/var\(--[\w-]+,\s*#[0-9a-f]{3,8}\)/gi, '');
}

function stylesheet(component: unknown): string {
  const def = (component as { ɵcmp?: { styles?: string[] | string } }).ɵcmp;
  const fromDef = def?.styles == null ? '' : Array.isArray(def.styles) ? def.styles.join('\n') : String(def.styles);
  return fromDef.replaceAll('%NS%', '');
}
