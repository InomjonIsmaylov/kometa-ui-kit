import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaSwipe } from './kometa-swipe';

@Component({
  imports: [KometaSwipe],
  template: `<k-swipe rightLabel="Done" leftLabel="Cancel visit" (swipedRight)="right = right + 1" (swipedLeft)="left = left + 1">
    <button class="inner" (click)="clicks = clicks + 1">10:00 Anvar</button></k-swipe>`,
})
class Host {
  right = 0;
  left = 0;
  clicks = 0;
}

describe('KometaSwipe', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-swipe') as HTMLElement;
    el.getBoundingClientRect = () => ({ width: 400 }) as DOMRect;
    const face = el.querySelector('.face') as HTMLElement;
    const fire = (type: string, x: number, y = 0) => {
      face.dispatchEvent(Object.assign(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }), { pointerId: 1 }));
      f.detectChanges();
    };
    const swipe = (dx: number) => { fire('pointerdown', 200); fire('pointermove', 200 + dx); return () => fire('pointerup', 200 + dx); };
    return { f, el, face, fire, swipe };
  }

  it('fills the ticks as you pull right and fires on release when they are full', () => {
    const { f, el, face, swipe } = render();
    swipe(100);
    expect(face.style.transform).toBe('translateX(100px)');
    expect(el.querySelectorAll('.ticks i.on').length).toBe(6);
    const release = swipe(210);
    expect(el.querySelectorAll('.ticks i.on').length).toBe(12);
    release();
    expect(f.componentInstance.right).toBe(1);
    expect(face.style.transform).toBe('translateX(0px)');
  });

  it('springs back when let go short', () => {
    const { f, face, swipe } = render();
    swipe(80)();
    expect(f.componentInstance.right).toBe(0);
    expect(face.style.transform).toBe('translateX(0px)');
  });

  it('grows the ring on a pull left, turns it red past 45% and slides the row out', () => {
    const { f, el, face, swipe } = render();
    swipe(-100);
    expect(el.querySelector('.left')!.classList).not.toContain('go');
    const release = swipe(-200);
    expect(el.querySelector('.left')!.classList).toContain('go');
    release();
    expect(face.style.transform).toBe('translateX(-400px)');
    vi.advanceTimersByTime(300);
    expect(f.componentInstance.left).toBe(1);
  });

  it('leaves a mostly vertical move to the page', () => {
    const { face, fire } = render();
    fire('pointerdown', 200, 0);
    fire('pointermove', 215, 60);
    expect(face.style.transform).toBe('translateX(0px)');
  });

  it('does not pass the click that ends a swipe to the content', () => {
    const { f, el, swipe } = render();
    swipe(50)();
    (el.querySelector('.inner') as HTMLElement).click();
    expect(f.componentInstance.clicks).toBe(0);
    (el.querySelector('.inner') as HTMLElement).click();
    expect(f.componentInstance.clicks).toBe(1);
  });

  it('offers each action as a button that slides the row aside on focus', () => {
    const { f, el, face } = render();
    const done = el.querySelector('.right') as HTMLButtonElement, cancel = el.querySelector('.left') as HTMLButtonElement;
    expect(done.textContent).toContain('Done');
    expect(cancel.getAttribute('aria-label')).toBe('Cancel visit');
    done.dispatchEvent(new FocusEvent('focus'));
    f.detectChanges();
    expect(face.style.transform).toBe('translateX(120px)');
    done.click();
    expect(f.componentInstance.right).toBe(1);
  });
});
