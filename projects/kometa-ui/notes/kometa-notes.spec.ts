import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaNotes } from './kometa-notes';

@Component({
  imports: [KometaNotes],
  template: `<k-notes ariaLabel="Reply" inputId="reply-id" placeholder="Say thanks" [rows]="3" [maxlength]="max()" [count]="count()" [disabled]="disabled()" [(value)]="value" />`,
})
class Host {
  value = signal('Hello');
  max = signal<number | null>(300);
  count = signal(true);
  disabled = signal(false);
}

describe('KometaNotes', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('k-notes') as HTMLElement;
    const ta = root.querySelector('textarea') as HTMLTextAreaElement;
    const type = (text: string) => { ta.value = text; ta.dispatchEvent(new Event('input')); f.detectChanges(); };
    return { f, root, ta, type, count: () => root.querySelector('.count') as HTMLElement | null };
  }

  it('is a textarea named by the caller, showing the model, the rows, the limit and the placeholder', () => {
    const { ta } = render();
    expect(ta.value).toBe('Hello');
    expect(ta.rows).toBe(3);
    expect(ta.getAttribute('aria-label')).toBe('Reply');
    expect(ta.id).toBe('reply-id');
    expect(ta.getAttribute('maxlength')).toBe('300');
    expect(ta.placeholder).toBe('Say thanks');
  });

  it('writes what is typed to the model', () => {
    const { f, type } = render();
    type('Thank you');
    expect(f.componentInstance.value()).toBe('Thank you');
  });

  it('follows the model from outside', () => {
    const { f, ta } = render();
    f.componentInstance.value.set('Written for you');
    f.detectChanges();
    expect(ta.value).toBe('Written for you');
  });

  it('shows the count only in the last 30 characters, amber and then red at the limit', () => {
    const { f, type, count } = render();
    expect(count()).toBeNull();
    type('x'.repeat(280));
    expect(count()?.textContent?.trim()).toBe('280 / 300');
    expect(count()?.classList.contains('warn')).toBe(true);
    expect(count()?.classList.contains('over')).toBe(false);
    f.componentInstance.value.set('x'.repeat(300));
    f.detectChanges();
    expect(count()?.classList.contains('over')).toBe(true);
    expect(count()?.classList.contains('warn')).toBe(false);
  });

  it('announces the count only as it crosses 30, 20, 10 and 5 left and at the limit, not on every key', () => {
    const { type, count, root } = render();
    const live = () => root.querySelector('[aria-live]')!.textContent!.trim();
    expect(live()).toBe('');
    type('x'.repeat(270));
    expect(live()).toBe('270 / 300');
    expect(count()?.hasAttribute('aria-live')).toBe(false);
    type('x'.repeat(275));
    expect(count()?.textContent?.trim()).toBe('275 / 300');
    expect(live()).toBe('270 / 300');
    type('x'.repeat(281));
    expect(live()).toBe('281 / 300');
    type('x'.repeat(300));
    expect(live()).toBe('300 / 300');
  });

  it('draws no count without a limit or when the page draws its own', () => {
    const { f, type, count } = render();
    type('x'.repeat(290));
    expect(count()).not.toBeNull();
    f.componentInstance.count.set(false);
    f.detectChanges();
    expect(count()).toBeNull();
    f.componentInstance.count.set(true);
    f.componentInstance.max.set(null);
    f.detectChanges();
    expect(count()).toBeNull();
  });

  it('can be disabled, and draws a hairline that grows on focus with no box', () => {
    const { f, ta } = render();
    f.componentInstance.disabled.set(true);
    f.detectChanges();
    expect(ta.disabled).toBe(true);
    const css = (KometaNotes as unknown as { ɵcmp: { styles: string[] } }).ɵcmp.styles.join('\n');
    expect(css).toMatch(/focus-within[^{]*::after[^{]*\{[^}]*transform:\s*none/);
    expect(css).not.toMatch(/border:\s*1px/);
  });
});
