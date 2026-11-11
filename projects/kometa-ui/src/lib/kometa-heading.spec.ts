import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaHeading } from './kometa-heading';

@Component({
  imports: [KometaHeading],
  template: `
    <kometa-heading [title]="title()" [level]="level()" headingId="near-h">
      @if (action()) { <button action type="button">Hammasi</button> }
    </kometa-heading>
  `,
})
class Host {
  title = signal('Yaqin atrofda');
  level = signal<2 | 3 | 4>(2);
  action = signal(true);
}

describe('KometaHeading', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = () => f.nativeElement.querySelector('kometa-heading') as HTMLElement;
    return { f, el };
  }

  it('renders the title as an h2 by default', () => {
    const { el } = render();
    expect(el().querySelector('h2')?.textContent).toBe('Yaqin atrofda');
    expect(el().querySelector('h3, h4')).toBeNull();
  });

  it('puts the caller id on the heading element',()=> {
    const { el } = render();
    expect(el().querySelector('h2')?.id).toBe('near-h');
  });

  it('renders the matching heading level', () => {
    const { f, el } = render();
    f.componentInstance.level.set(3);
    f.detectChanges();
    expect(el().querySelector('h3')?.textContent).toBe('Yaqin atrofda');
    expect(el().querySelector('h2')).toBeNull();
    f.componentInstance.level.set(4);
    f.detectChanges();
    expect(el().querySelector('h4')).not.toBeNull();
  });

  it('draws a decorative hairline between the title and the action', () => {
    const { el } = render();
    const rule = el().querySelector('.rule') as HTMLElement;
    expect(rule.getAttribute('aria-hidden')).toBe('true');
    expect([...el().children].map((c) => c.tagName)).toEqual(['H2', 'I', 'BUTTON']);
  });

  it('projects the action and keeps it pressable', () => {
    const { el } = render();
    expect((el().querySelector('button') as HTMLButtonElement).textContent).toBe('Hammasi');
  });

  it('runs the hairline out to the edge when there is no action', () => {
    const { f, el } = render();
    f.componentInstance.action.set(false);
    f.detectChanges();
    expect(el().querySelector('button')).toBeNull();
    expect(el().querySelector('.rule')).not.toBeNull();
    expect(stylesheet(KometaHeading)).toContain('flex: 1');
  });

  it('sets the title in Syne 700 at 22px with a token hairline and no literal colour', () => {
    render();
    const css = stylesheet(KometaHeading);
    expect(css).toContain('font-family: var(--font-display, "Syne", sans-serif)');
    expect(css).toContain('font-weight: 700');
    expect(css).toContain('var(--heading-size, 22px)');
    expect(css).toContain('var(--glass-line');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

function stylesheet(component: unknown): string {
  const def = (component as { ɵcmp?: { styles?: string[] | string } }).ɵcmp;
  const fromDef = def?.styles == null ? '' : Array.isArray(def.styles) ? def.styles.join('\n') : String(def.styles);
  const fromDoc = [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n');
  return `${fromDef}\n${fromDoc}`;
}
