import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaQuiet } from './kometa-quiet';

@Component({
  imports: [KometaQuiet],
  template: `<k-quiet [title]="title()" [hint]="hint()" />`,
})
class Host {
  title = signal('Hali boʻsh');
  hint = signal('');
}

describe('KometaQuiet', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    return f;
  }

  it('renders a Syne title and no picture', () => {
    const f = render();
    const el = f.nativeElement.querySelector('k-quiet') as HTMLElement;
    const title = el.querySelector('.title') as HTMLElement;
    expect(title.textContent).toContain('Hali boʻsh');
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('svg')).toBeNull();
    const css = stylesheet(KometaQuiet);
    expect(css).toContain('font-family: var(--font-display, "Syne", sans-serif)');
  });

  it('omits the hint sentence when hint is empty', () => {
    const el = render().nativeElement.querySelector('k-quiet') as HTMLElement;
    expect(el.querySelector('.hint')).toBeNull();
  });

  it('shows one muted hint sentence when hint is set', () => {
    const f = render();
    f.componentInstance.hint.set('Birinchi yozuv shu yerda chiqadi.');
    f.detectChanges();
    const hint = (f.nativeElement.querySelector('k-quiet') as HTMLElement).querySelector('.hint') as HTMLElement;
    expect(hint.textContent).toContain('Birinchi yozuv shu yerda chiqadi.');
    expect(stylesheet(KometaQuiet)).toContain('var(--muted)');
  });

  it('puts an [art] picture above the title and leaves other content under the hint', () => {
    const f = TestBed.createComponent(WithArt);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-quiet') as HTMLElement;
    const kids = Array.from(el.children).map((c) => (c.getAttribute('class') || c.tagName).toLowerCase());
    expect(kids).toEqual(['art', 'title', 'hint', 'button']);
    expect(el.querySelector('.art svg')).not.toBeNull();
  });

  it('collapses the picture box when there is no picture', () => {
    const f = render();
    expect((f.nativeElement.querySelector('.art') as HTMLElement).childElementCount).toBe(0);
    expect(stylesheet(KometaQuiet)).toMatch(/\.art[^{,]*:empty[^{]*\{[^}]*display: none/);
  });
});

@Component({
  imports: [KometaQuiet],
  template: `<k-quiet title="No classes" hint="Pick another coach."><button type="button">Clear</button><svg art viewBox="0 0 10 10"></svg></k-quiet>`,
})
class WithArt {}

function stylesheet(component: unknown): string {
  const def = (component as { ɵcmp?: { styles?: string[] | string } }).ɵcmp;
  return def?.styles == null ? '' : (Array.isArray(def.styles) ? def.styles.join('\n') : String(def.styles)).replaceAll('%NS%', '');
}
