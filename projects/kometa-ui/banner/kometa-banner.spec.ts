import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaBanner, KometaBannerTone } from './kometa-banner';

@Component({
  imports: [KometaBanner],
  template: `
    <k-banner [tone]="tone()" [surface]="surface()" [dismissible]="dismissible()" [closeLabel]="closeLabel()" (dismissed)="count.set(count() + 1)">
      {{ text() }}
    </k-banner>
  `,
})
class Host {
  tone = signal<KometaBannerTone>('warn');
  surface = signal<'bare' | 'glass'>('bare');
  dismissible = signal(true);
  closeLabel = signal('Yopish');
  text = signal('Internet yoʻq. Navbatlar saqlanadi va keyin yuboriladi.');
  count = signal(0);
}

@Component({
  imports: [KometaBanner],
  template: `<k-banner id="bare" tone="warn" dismissible closeLabel="Yopish">A</k-banner><k-banner id="calm" tone="warn" roleOverride="status">B</k-banner>`,
})
class BareHost {}

describe('KometaBanner', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('k-banner') as HTMLElement;
    return { f, root, close: () => root.querySelector('button.close') as HTMLButtonElement | null };
  }

  it('renders the projected sentence beside the hairline with no box', () => {
    const { root } = render();
    expect(root.querySelector('.text')?.textContent).toContain('Internet yoʻq.');
    const css = stylesheet(KometaBanner);
    expect(css).toMatch(/border-left:\s*2px solid var\(--c\)/);
    expect(css).toMatch(/padding-left:\s*12px/);
    // Own styles only: other components' styles in the document have rounded corners.
    // The default is boxless; only the glass surface (its own rule) has a radius.
    expect(ownStyles(KometaBanner).replace(/\[data-surface=["']?glass["']?\][^{]*\{[^}]*\}/g, '')).not.toContain('border-radius');
  });

  it('takes a glass surface for use over a busy background, and is bare by default', () => {
    const { f, root } = render();
    expect(root.getAttribute('data-surface')).toBe('bare');
    f.componentInstance.surface.set('glass');
    f.detectChanges();
    expect(root.getAttribute('data-surface')).toBe('glass');
    const css = ownStyles(KometaBanner);
    expect(css).toMatch(/data-surface=["']?glass["']?\][^{]*\.bn[^{]*\{[^}]*backdrop-filter:\s*blur/);
    expect(css).toMatch(/data-surface=["']?glass["']?\][^{]*\.bn[^{]*\{[^}]*inset 3px 0 0 var\(--[^)]*c\)/);
  });

  it('reflects the tone as data-tone and maps it to a state token', () => {
    const { f, root } = render();
    for (const tone of ['warn', 'ok', 'info', 'error'] as const) {
      f.componentInstance.tone.set(tone);
      f.detectChanges();
      expect(root.getAttribute('data-tone')).toBe(tone);
    }
    const css = stylesheet(KometaBanner);
    for (const t of ['--red', '--green', '--blue', '--error']) expect(css).toContain(`var(${t})`);
  });

  it('takes a bare dismissible attribute and a role override',()=> {
    const f = TestBed.createComponent(BareHost);
    f.detectChanges();
    const bare = f.nativeElement.querySelector('#bare') as HTMLElement;
    const calm = f.nativeElement.querySelector('#calm') as HTMLElement;
    expect(bare.querySelector('button.close')).not.toBeNull();
    expect(bare.getAttribute('role')).toBe('alert');
    expect(calm.getAttribute('role')).toBe('status');
  });

  it('uses role status for ok and info and role alert for warn and error', () => {
    const { f, root } = render();
    const roles: Record<string, string> = { warn: 'alert', error: 'alert', ok: 'status', info: 'status' };
    for (const tone of Object.keys(roles) as KometaBannerTone[]) {
      f.componentInstance.tone.set(tone);
      f.detectChanges();
      expect(root.getAttribute('role')).toBe(roles[tone]);
    }
  });

  it('shows the close word the caller supplied only when dismissible', () => {
    const { f, close } = render();
    expect(close()?.textContent?.trim()).toBe('Yopish');
    f.componentInstance.closeLabel.set('Закрыть');
    f.detectChanges();
    expect(close()?.textContent?.trim()).toBe('Закрыть');
    f.componentInstance.dismissible.set(false);
    f.detectChanges();
    expect(close()).toBeNull();
  });

  it('names the close button "Dismiss" and draws × when no close word is given', () => {
    const { f, close } = render();
    expect(close()?.hasAttribute('aria-label')).toBe(false);
    f.componentInstance.closeLabel.set('');
    f.detectChanges();
    expect(close()?.textContent?.trim()).toBe('×');
    expect(close()?.getAttribute('aria-label')).toBe('Dismiss');
  });

  it('collapses and emits dismissed once when the close word is pressed', () => {
    const { f, root, close } = render();
    expect(root.classList.contains('gone')).toBe(false);
    close()!.click();
    f.detectChanges();
    expect(root.classList.contains('gone')).toBe(true);
    expect(f.componentInstance.count()).toBe(1);
  });

  it('takes the collapsed content out of the tab order and the tree', () => {
    const { f, root, close } = render();
    expect(root.querySelector('.clip')?.hasAttribute('inert')).toBe(false);
    close()!.click();
    f.detectChanges();
    expect(root.querySelector('.clip')?.hasAttribute('inert')).toBe(true);
  });

  it('collapses with rows 1fr to 0fr and opacity', () => {
    const css = stylesheet(KometaBanner);
    expect(css).toMatch(/grid-template-rows:\s*1fr/);
    expect(css).toMatch(/gone\)?[^{]*\{[^}]*grid-template-rows:\s*0fr[^}]*opacity:\s*0/);
  });

  it('removes the transition under reduced motion', () => {
    const css = stylesheet(KometaBanner);
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{[^}]*transition:\s*none/);
  });

  it('gives the close word a visible focus ring and a coarse pointer target', () => {
    const css = stylesheet(KometaBanner);
    expect(css).toContain('focus-visible');
    expect(css).toContain('2px solid var(--amber)');
    expect(css).toMatch(/pointer: coarse\)[^}]*min-height:\s*44px/);
  });

  it('uses no colour literal beyond token fallbacks', () => {
    expect(withoutFallbacks(ownStyles(KometaBanner))).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});

function withoutFallbacks(css: string): string {
  return css.replace(/var\(--[\w-]+,\s*#[0-9a-f]{3,8}\)/gi, '');
}

function ownStyles(component: unknown): string {
  const def = (component as { ɵcmp?: { styles?: string[] | string } }).ɵcmp;
  return def?.styles == null ? '' : Array.isArray(def.styles) ? def.styles.join('\n') : String(def.styles);
}

function stylesheet(component: unknown): string {
  const fromDef = ownStyles(component);
  return fromDef.replaceAll('%NS%', '');
}
