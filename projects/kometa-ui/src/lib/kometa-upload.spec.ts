import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaUpload } from './kometa-upload';

@Component({
  imports: [KometaUpload],
  template: `
    <k-upload
      [name]="name()"
      [sizeLabel]="sizeLabel()"
      [progress]="progress()"
      [state]="state()"
      [statusLabel]="statusLabel()"
      [actionLabel]="actionLabel()"
      [ariaLabel]="ariaLabel()"
      (action)="actions = actions + 1"
    />
  `,
})
class Host {
  name = signal('soch-olish.jpg');
  sizeLabel = signal('1.8 MB');
  progress = signal(0);
  state = signal<'idle' | 'running' | 'done' | 'failed'>('idle');
  statusLabel = signal('');
  actionLabel = signal('');
  ariaLabel = signal('');
  actions = 0;
}

describe('KometaUpload', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('k-upload') as HTMLElement;
    const q = <T extends HTMLElement>(s: string) => root.querySelector(s) as T;
    return { f, root, q };
  }

  it('shows the file name in bold and the size muted on one line', () => {
    const { q } = render();
    expect(q('.file b').textContent).toBe('soch-olish.jpg');
    expect(q('.file span').textContent).toBe('1.8 MB');
  });

  it('leaves the size out when none is given', () => {
    const { f, q } = render();
    f.componentInstance.sizeLabel.set('');
    f.detectChanges();
    expect(q('.file span')).toBeNull();
  });

  it('shows a rounded percentage with a small percent sign', () => {
    const { f, q } = render();
    expect(q('.fig b').textContent).toBe('0');
    f.componentInstance.progress.set(0.456);
    f.detectChanges();
    expect(q('.fig b').textContent).toBe('46');
    expect(q('.fig span').textContent?.trim()).toBe('%');
  });

  it('fills the zone with scaleY of the progress', () => {
    const { f, q } = render();
    expect(q('.track i').style.transform).toBe('scaleY(0)');
    f.componentInstance.progress.set(0.5);
    f.detectChanges();
    expect(q('.track i').style.transform).toBe('scaleY(0.5)');
  });

  it('clamps progress to 0 and 1', () => {
    const { f, q } = render();
    f.componentInstance.progress.set(3);
    f.detectChanges();
    expect(q('.track i').style.transform).toBe('scaleY(1)');
    f.componentInstance.progress.set(-1);
    f.detectChanges();
    expect(q('.track i').style.transform).toBe('scaleY(0)');
    f.componentInstance.progress.set(NaN);
    f.detectChanges();
    expect(q('.track i').style.transform).toBe('scaleY(0)');
  });

  it('is a progressbar with value now and text', () => {
    const { f, q } = render();
    f.componentInstance.state.set('running');
    f.componentInstance.progress.set(0.25);
    f.detectChanges();
    const bar = q('[role="progressbar"]');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-valuenow')).toBe('25');
    expect(bar.getAttribute('aria-valuetext')).toBe('25 %');
    expect(bar.getAttribute('aria-busy')).toBe('true');
    expect(bar.getAttribute('aria-label')).toBe('soch-olish.jpg');
  });

  it('lets the caller name the bar and word its value text', () => {
    const { f, q } = render();
    f.componentInstance.ariaLabel.set('Fayl yuklanmoqda');
    f.componentInstance.statusLabel.set('Yuklanmoqda');
    f.detectChanges();
    const bar = q('[role="progressbar"]');
    expect(bar.getAttribute('aria-label')).toBe('Fayl yuklanmoqda');
    expect(bar.getAttribute('aria-valuetext')).toBe('Yuklanmoqda');
    expect(bar.hasAttribute('aria-busy')).toBe(false);
  });

  it('draws a done upload full and shows its status line', () => {
    const { f, root, q } = render();
    f.componentInstance.progress.set(0.3);
    f.componentInstance.state.set('done');
    f.componentInstance.statusLabel.set('Yuklandi');
    f.detectChanges();
    expect(q('.fig b').textContent).toBe('100');
    expect(q('.track i').style.transform).toBe('scaleY(1)');
    expect(root.getAttribute('data-state')).toBe('done');
    expect(q('.status').textContent?.trim()).toBe('Yuklandi');
    expect(q('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('100');
  });

  it('marks a failed upload with the error colour on the zone border, the fill edge and the status', () => {
    const { f, root, q } = render();
    f.componentInstance.progress.set(0.4);
    f.componentInstance.state.set('failed');
    f.componentInstance.statusLabel.set('Yuklanmadi');
    f.detectChanges();
    expect(root.getAttribute('data-state')).toBe('failed');
    expect(q('.fig b').textContent).toBe('40');
    const css = stylesheet(KometaUpload);
    expect(css).toMatch(/\[data-state=failed\] \{ border-color: var\(--error\)/);
    expect(css).toMatch(/\[data-state=failed\] \.track i \{ border-top-color: var\(--error\)/);
    expect(css).toMatch(/\[data-state=failed\] \.status \{ color: var\(--error\)/);
  });

  it('renders no button without an action label', () => {
    const { q } = render();
    expect(q('button')).toBeNull();
  });

  it('emits action when the quiet button is pressed', () => {
    const { f, q } = render();
    f.componentInstance.actionLabel.set('Bekor qilish');
    f.detectChanges();
    expect(q('button').textContent?.trim()).toBe('Bekor qilish');
    q<HTMLButtonElement>('button').click();
    q<HTMLButtonElement>('button').click();
    expect(f.componentInstance.actions).toBe(2);
    expect(q<HTMLButtonElement>('button').type).toBe('button');
  });

  it('lets a long name wrap instead of truncating', () => {
    const { f, q } = render();
    f.componentInstance.name.set('juda-uzun-fayl-nomi-'.repeat(8) + '.jpg');
    f.detectChanges();
    expect(q('.file b').textContent).toContain('juda-uzun-fayl-nomi-');
    const css = stylesheet(KometaUpload);
    expect(css).toContain('overflow-wrap: anywhere');
    expect(css).not.toContain('text-overflow');
  });

  it('draws a Syne 44px figure in a dashed zone that fills from the bottom', () => {
    const css = stylesheet(KometaUpload);
    expect(css).toContain('font-family: var(--font-display, Syne, sans-serif)');
    expect(css).toContain('--upload-fig-size, 44px');
    expect(css).toContain('tabular-nums');
    expect(css).toContain('1px dashed');
    expect(css).toContain('transform-origin: bottom');
  });

  it('removes its transition under reduced motion and gives a coarse pointer 44px', () => {
    const css = stylesheet(KometaUpload);
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{[^}]*transition: none/);
    expect(css).toMatch(/pointer: coarse\) \{[^}]*min-height: 44px/);
    expect(css).toContain('outline: 2px solid var(--amber)');
  });

  it('uses tokens rather than colour literals', () => {
    const css = stylesheet(KometaUpload);
    expect(css).toContain('var(--muted)');
    expect(css).toContain('var(--glass-line');
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgba?\(/);
  });
});

function stylesheet(component: unknown): string {
  const styles = (component as { ɵcmp?: { styles?: string[] | string } }).ɵcmp?.styles;
  const css = styles == null ? '' : Array.isArray(styles) ? styles.join('\n') : String(styles);
  // The compiler scopes selectors and namespaces tokens; undo that so the assertions read like the source.
  return css.replace(/%NS%/g, '').replace(/\[_ng(?:content|host)-%COMP%\]/g, '').replace(/["']/g, '').replace(/\s+/g, ' ');
}

/** Colour literals that are not the fallback inside a `var(--x, ...)`. */
function literalColours(css: string): string[] {
  const noFallbacks = css.replace(/var\(--[\w-]+,\s*[^()]*(\([^()]*\)[^()]*)*\)/g, '');
  return noFallbacks.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) ?? [];
}
