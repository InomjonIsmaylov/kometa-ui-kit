import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaTally } from './kometa-tally';

@Component({
  imports: [KometaTally],
  template: `<k-tally [value]="value()" [max]="max()" [ticks]="10" unit="visits" locale="en-US" />`,
})
class Host {
  value = signal(0);
  max = signal<number | null>(60);
}

describe('KometaTally', () => {
  // Angular's scheduler asks for frames too, so each one is kept by id and cancelled by id.
  let frames: Map<number, FrameRequestCallback>, id: number;
  beforeEach(() => {
    frames = new Map();
    id = 0;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => (frames.set(++id, cb), id));
    vi.stubGlobal('cancelAnimationFrame', (n: number) => frames.delete(n));
  });
  afterEach(() => vi.unstubAllGlobals());

  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-tally') as HTMLElement;
    const t0 = performance.now();
    const tick = (ms: number) => { const run = [...frames.values()]; frames.clear(); run.forEach((cb) => cb(t0 + ms)); f.detectChanges(); };
    return { f, el, tick };
  }

  it('counts up to the new value with the ticks filling to match', () => {
    const { f, el, tick } = render();
    f.componentInstance.value.set(1200);
    f.componentInstance.max.set(2400);
    f.detectChanges();
    expect(el.querySelector('.sr')!.textContent!.trim()).toBe('1,200 visits');
    tick(300);
    const mid = Number(el.querySelector('.fig')!.textContent!.replace(/[^0-9]/g, ''));
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1200);
    tick(2000);
    expect(el.querySelector('.fig')!.textContent).toBe('1,200visits');
    expect(el.querySelectorAll('.ticks i.on').length).toBe(5);
  });

  it('draws no ticks without a max', () => {
    const { f, el } = render();
    f.componentInstance.max.set(null);
    f.detectChanges();
    expect(el.querySelector('.ticks')).toBeNull();
  });

  it('hides the moving figure from screen readers', () => {
    const { el } = render();
    expect(el.querySelector('.fig')!.getAttribute('aria-hidden')).toBe('true');
  });
});
