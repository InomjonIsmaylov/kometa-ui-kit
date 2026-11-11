import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { KometaTab, KometaTabbar } from './kometa-tabbar';

const buttons: KometaTab[] = [
  { value: 'home', label: 'Bosh', icon: 'ph ph-house' },
  { value: 'search', label: 'Qidiruv', icon: 'ph ph-magnifying-glass' },
  { value: 'me', label: 'Profil', icon: 'ph ph-user' },
];
const links: KometaTab[] = buttons.map((t) => ({ ...t, link: '/' + t.value }));

@Component({
  imports: [KometaTabbar],
  template: `<k-tabbar [tabs]="tabs()" [(value)]="value" ariaLabel="Asosiy" />`,
})
class Host {
  tabs = signal<KometaTab[]>(buttons);
  value = signal('home');
}

describe('KometaTabbar', () => {
  function render(tabs: KometaTab[] = buttons) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const f = TestBed.createComponent(Host);
    f.componentInstance.tabs.set(tabs);
    f.detectChanges();
    const tabEls = () => [...(f.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.tab')];
    return { f, tabEls };
  }

  it('renders a tablist of buttons with an icon and a word each', () => {
    const { f, tabEls } = render();
    const bar = f.nativeElement.querySelector('.bar') as HTMLElement;
    expect(bar.getAttribute('role')).toBe('tablist');
    expect(bar.getAttribute('aria-label')).toBe('Asosiy');
    expect(tabEls().map((t) => t.tagName)).toEqual(['BUTTON', 'BUTTON', 'BUTTON']);
    expect(tabEls()[1].querySelector('i')?.className).toBe('ph ph-magnifying-glass');
    expect(tabEls()[1].querySelector('.word')?.textContent).toBe('Qidiruv');
  });

  it('marks the chosen tab with aria-selected and one tab stop', () => {
    const { tabEls } = render();
    expect(tabEls().map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(tabEls().map((t) => t.getAttribute('tabindex'))).toEqual([null, '-1', '-1']);
    expect(tabEls()[0].classList.contains('on')).toBe(true);
  });

  it('chooses a tab on click and writes the value back', () => {
    const { f, tabEls } = render();
    tabEls()[2].click();
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('me');
    expect(tabEls()[2].getAttribute('aria-selected')).toBe('true');
  });

  it('moves with arrows Home and End', () => {
    const { f, tabEls } = render();
    const key = (from: number, k: string) => {
      tabEls()[from].dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
      f.detectChanges();
    };
    key(0, 'ArrowRight');
    expect(f.componentInstance.value()).toBe('search');
    key(1, 'End');
    expect(f.componentInstance.value()).toBe('me');
    key(2, 'ArrowRight');
    expect(f.componentInstance.value()).toBe('home');
    key(0, 'ArrowLeft');
    expect(f.componentInstance.value()).toBe('me');
    key(2, 'Home');
    expect(f.componentInstance.value()).toBe('home');
  });

  it('renders links with aria-current when a tab has a link', () => {
    const { f, tabEls } = render(links);
    const bar = f.nativeElement.querySelector('.bar') as HTMLElement;
    expect(bar.getAttribute('role')).toBe('navigation');
    expect(tabEls().map((t) => t.tagName)).toEqual(['A', 'A', 'A']);
    expect(tabEls()[1].getAttribute('href')).toBe('/search');
    expect(tabEls().map((t) => t.getAttribute('aria-current'))).toEqual(['page', null, null]);
    expect(tabEls()[0].getAttribute('role')).toBeNull();
  });

  it('leaves arrow keys alone on a link bar', () => {
    const { f, tabEls } = render(links);
    tabEls()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }));
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('home');
  });

  it('keeps every word in the DOM so a closed tab still has its name', () => {
    const { tabEls } = render();
    expect(tabEls().map((t) => t.textContent?.trim())).toEqual(['Bosh', 'Qidiruv', 'Profil']);
  });

  it('draws the glass capsule from tokens and opens the word with the spring', () => {
    render();
    const css = stylesheet(KometaTabbar);
    for (const t of ['var(--glass', 'var(--glass-line', 'inset 0 1px 0', 'var(--r-pill', 'var(--ease-spring', '680ms', '--tabbar-word-max, 70px']) {
      expect(css).toContain(t);
    }
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('removes motion and blur under the reduced preferences and grows targets on touch', () => {
    render();
    const css = stylesheet(KometaTabbar);
    expect(css).toContain('prefers-reduced-motion');
    expect(css).toContain('transition: none');
    expect(css).toContain('prefers-reduced-transparency');
    expect(css).toContain('pointer: coarse');
    expect(css).toContain('min-height: 44px');
    expect(css).toContain('2px solid var(--amber)');
  });
});

function stylesheet(component: unknown): string {
  const def = (component as { ɵcmp?: { styles?: string[] | string } }).ɵcmp;
  const fromDef = def?.styles == null ? '' : Array.isArray(def.styles) ? def.styles.join('\n') : String(def.styles);
  const fromDoc = [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n');
  return `${fromDef}\n${fromDoc}`;
}
