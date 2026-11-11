import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaChip } from './kometa-chip';

@Component({
  imports: [KometaChip],
  template: `
    <div role="group" aria-label="Filtr">
      <k-chip [(selected)]="open" [disabled]="off()"><i class="icon"></i>Hozir ochiq</k-chip>
      <k-chip [(selected)]="rated">4.5+<span chip-count>12</span></k-chip>
    </div>
  `,
})
class Host {
  open = signal(false);
  rated = signal(true);
  off = signal(false);
}

describe('KometaChip', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const buttons = [...(f.nativeElement as HTMLElement).querySelectorAll('button')] as HTMLButtonElement[];
    return { f, first: buttons[0], second: buttons[1] };
  }

  it('renders a real button per chip with the projected icon and words', () => {
    const { first } = render();
    expect(first.type).toBe('button');
    expect(first.querySelector('.icon')).not.toBeNull();
    expect(first.textContent).toContain('Hozir ochiq');
  });

  it('mirrors the selected model into aria-pressed', () => {
    const { f, first, second } = render();
    expect(first.getAttribute('aria-pressed')).toBe('false');
    expect(second.getAttribute('aria-pressed')).toBe('true');
    f.componentInstance.open.set(true);
    f.detectChanges();
    expect(first.getAttribute('aria-pressed')).toBe('true');
  });

  it('toggles on click and writes the model back', () => {
    const { f, first } = render();
    first.click();
    f.detectChanges();
    expect(f.componentInstance.open()).toBe(true);
    first.click();
    f.detectChanges();
    expect(f.componentInstance.open()).toBe(false);
  });

  it('lets several chips be chosen at once', () => {
    const { f, first } = render();
    first.click();
    f.detectChanges();
    expect(f.componentInstance.open()).toBe(true);
    expect(f.componentInstance.rated()).toBe(true);
  });

  it('does not toggle while disabled', () => {
    const { f, first } = render();
    f.componentInstance.off.set(true);
    f.detectChanges();
    expect(first.disabled).toBe(true);
    first.click();
    expect(f.componentInstance.open()).toBe(false);
  });

  it('projects a count after the words', () => {
    const { second } = render();
    expect(second.querySelector('.count')!.textContent).toBe('12');
  });

  it('gives a chosen chip the amber edge and never an amber fill', () => {
    const css = ownStyles(KometaChip);
    expect(css).toContain("button[aria-pressed=true] { box-shadow: inset 2px 0 0 var(--chip-accent, var(--amber))");
    expect(css).not.toMatch(/background:\s*var\(--amber\)/);
  });

  it('uses tokens and no colour literal outside a var fallback', () => {
    const css = ownStyles(KometaChip);
    for (const token of ['var(--glass', 'var(--glass-line', 'var(--text)', 'var(--ease-spring', 'var(--amber)']) {
      expect(css).toContain(token);
    }
    expect(literalColours(ownStyles(KometaChip))).toEqual([]);
  });

  it('removes the transition for reduced motion and goes solid for reduced transparency', () => {
    const css = ownStyles(KometaChip);
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*transition: none/);
    expect(css).toMatch(/prefers-reduced-transparency: reduce\)\s*\{[^}]*var\(--card\)/);
  });

  it('is 44px tall on a coarse pointer', () => {
    expect(ownStyles(KometaChip)).toMatch(/pointer: coarse\)\s*\{[^}]*min-height: 44px/);
  });
});

/** Colour literals that are not the fallback inside a `var(--x, ...)`. */
function literalColours(css: string): string[] {
  const noFallbacks = css.replace(/var\(--[\w-]+,\s*[^()]*(\([^()]*\)[^()]*)*\)/g, '');
  return noFallbacks.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) ?? [];
}

function ownStyles(component: unknown): string {
  const styles = (component as { ɵcmp?: { styles?: string[] | string } }).ɵcmp?.styles;
  const css = styles == null ? '' : Array.isArray(styles) ? styles.join('\n') : String(styles);
  // The compiler scopes selectors and namespaces tokens; undo that so the assertions read like the source.
  return css.replace(/%NS%/g, '').replace(/\[_ng(?:content|host)-%COMP%\]/g, '').replace(/["']/g, '').replace(/\s+/g, ' ');
}


@Component({
  imports: [KometaChip],
  template: `
    @for (o of options; track o) {
      <k-chip controlled [selected]="picked() === o" (toggled)="asked.set(o)">{{ o }}</k-chip>
    }
  `,
})
class ControlledHost {
  options = ['a', 'b'];
  picked = signal('a');
  asked = signal('');
}

describe('KometaChip controlled', () => {
  it('emits toggled and keeps showing what the parent binds when it refuses', () => {
    const f = TestBed.createComponent(ControlledHost);
    f.detectChanges();
    const [a, b] = [...(f.nativeElement as HTMLElement).querySelectorAll('button')] as HTMLButtonElement[];
    b.click();
    f.detectChanges();
    expect(f.componentInstance.asked()).toBe('b');
    expect(b.getAttribute('aria-pressed')).toBe('false');
    a.click(); // a radio parent refuses to unselect
    f.detectChanges();
    expect(a.getAttribute('aria-pressed')).toBe('true');
    f.componentInstance.picked.set('b');
    f.detectChanges();
    expect(a.getAttribute('aria-pressed')).toBe('false');
    expect(b.getAttribute('aria-pressed')).toBe('true');
  });
});
