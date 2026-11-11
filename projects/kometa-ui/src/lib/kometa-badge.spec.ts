import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaBadge } from './kometa-badge';

@Component({
  imports: [KometaBadge],
  template: `<k-badge [count]="n()" [max]="9" label="{n} unread" [showZero]="zero()"><i class="icon"></i></k-badge>`,
})
class Host {
  n = signal(3);
  zero = signal(false);
}

describe('KometaBadge', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-badge') as HTMLElement;
    const disc = () => el.querySelector('.disc') as HTMLElement | null;
    const set = (n: number) => { f.componentInstance.n.set(n); f.detectChanges(); };
    return { f, el, disc, set };
  }

  it('wraps its content and puts the count on a hidden disc with a spoken label', () => {
    const { el, disc } = render();
    expect(el.querySelector('.icon')).not.toBeNull();
    expect(disc()!.textContent).toBe('3');
    expect(disc()!.getAttribute('aria-hidden')).toBe('true');
    expect(el.querySelector('.sr')!.textContent).toBe('3 unread');
  });

  it('caps the figure at max and redraws the disc on change so it pops again', () => {
    const { disc, set } = render();
    const first = disc();
    set(4);
    expect(disc()).not.toBe(first);
    set(12);
    expect(disc()!.textContent).toBe('9+');
  });

  it('hides at zero unless showZero', () => {
    const { f, disc, set } = render();
    set(0);
    expect(disc()).toBeNull();
    f.componentInstance.zero.set(true);
    f.detectChanges();
    expect(disc()!.textContent).toBe('0');
  });
});
