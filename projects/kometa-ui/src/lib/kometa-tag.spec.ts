import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaTag, KometaTagTone } from './kometa-tag';

@Component({
  imports: [KometaTag],
  template: `<k-tag [tone]="tone()">{{ word() }}</k-tag>`,
})
class Host {
  tone = signal<KometaTagTone>('now');
  word = signal('Oʻtirgan');
}

describe('KometaTag', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('k-tag') as HTMLElement;
    return { f, root };
  }

  it('renders a dot and the projected word', () => {
    const { root } = render();
    expect(root.querySelector('.dot')).not.toBeNull();
    expect(root.textContent?.trim()).toBe('Oʻtirgan');
  });

  it('is a status mark and not a button', () => {
    const { root } = render();
    expect(root.querySelector('button')).toBeNull();
    expect(root.getAttribute('role')).toBeNull();
    expect(root.getAttribute('tabindex')).toBeNull();
    expect(root.querySelector('.dot')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('reflects each tone as data-tone', () => {
    const { f, root } = render();
    for (const tone of ['now', 'wait', 'book', 'done', 'warn', 'error'] as const) {
      f.componentInstance.tone.set(tone);
      f.detectChanges();
      expect(root.getAttribute('data-tone')).toBe(tone);
    }
  });

  it('defaults to the muted book tone', () => {
    const f = TestBed.createComponent(KometaTag);
    f.detectChanges();
    expect((f.nativeElement as HTMLElement).getAttribute('data-tone')).toBe('book');
  });

  it('is a dot and a word with no container, and has tokens for every state colour', () => {
    const css = stylesheet(KometaTag);
    expect(css).not.toMatch(/background:\s*var\(--glass\)/);
    expect(css).toMatch(/padding:\s*0;/);
    for (const t of ['--amber', '--blue', '--green', '--red', '--error', '--muted']) expect(css).toContain(`var(${t})`);
  });

  it('never fills with amber and only uses amber as the dot colour', () => {
    const css = stylesheet(KometaTag);
    expect(css).toMatch(/--dot:\s*var\(--amber\)/);
    expect(css).not.toMatch(/background:\s*var\(--amber\)/);
  });

  it('uses no colour literal beyond token fallbacks', () => {
    expect(withoutFallbacks(stylesheet(KometaTag))).not.toMatch(/#[0-9a-f]{3,8}\b/i);
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

describe('KometaTag dot', () => {
  it('can leave the dot out', () => {
    @Component({ imports: [KometaTag], template: `<k-tag [dot]="false">Word</k-tag>` })
    class NoDot {}
    const f = TestBed.createComponent(NoDot);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.dot')).toBeNull();
  });
});
