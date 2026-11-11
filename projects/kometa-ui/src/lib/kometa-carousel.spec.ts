import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaCarousel, KometaSlide } from './kometa-carousel';

@Component({
  imports: [KometaCarousel, KometaSlide],
  template: `
    <k-carousel [(index)]="index" [edges]="edges()" ariaLabel="Works">
      <div kSlide>One</div>
      <div kSlide>Two <a href="#x">link</a></div>
      <div kSlide>Three</div>
    </k-carousel>
  `,
})
class Host {
  index = signal(0);
  edges = signal(true);
}

describe('KometaCarousel', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-carousel') as HTMLElement;
    const view = el.querySelector('.kc-view') as HTMLElement;
    view.getBoundingClientRect = () => ({ left: 0, width: 300 }) as DOMRect;
    const clickAt = (x: number, target: Element = view) => {
      target.dispatchEvent(new MouseEvent('click', { clientX: x, bubbles: true }));
      f.detectChanges();
    };
    const ticks = () => Array.from(el.querySelectorAll('.kc-ticks button')) as HTMLButtonElement[];
    return { f, el, view, clickAt, ticks };
  }

  it('is a labelled carousel region of slides, with only the current one reachable', () => {
    const { el } = render();
    expect(el.getAttribute('role')).toBe('region');
    expect(el.getAttribute('aria-roledescription')).toBe('carousel');
    expect(el.getAttribute('aria-label')).toBe('Works');
    const slides = el.querySelectorAll('[kSlide]');
    expect(slides[0].getAttribute('aria-label')).toBe('1 / 3');
    expect(slides[0].hasAttribute('inert')).toBe(false);
    expect(slides[1].hasAttribute('inert')).toBe(true);
  });

  it('draws one tick per slide and goes to a slide from its tick', () => {
    const { f, ticks } = render();
    expect(ticks().length).toBe(3);
    expect(ticks()[0].getAttribute('aria-current')).toBe('true');
    expect(ticks()[2].getAttribute('aria-label')).toBe('Slide 3');
    ticks()[2].click();
    f.detectChanges();
    expect(f.componentInstance.index()).toBe(2);
    expect(ticks()[2].getAttribute('aria-current')).toBe('true');
  });

  it('goes forward from the right third and back from the left, and stops at the ends', () => {
    const { f, clickAt } = render();
    clickAt(10);
    expect(f.componentInstance.index()).toBe(0);
    clickAt(290);
    expect(f.componentInstance.index()).toBe(1);
    clickAt(150);
    expect(f.componentInstance.index()).toBe(1);
    clickAt(290);
    clickAt(290);
    expect(f.componentInstance.index()).toBe(2);
    clickAt(10);
    expect(f.componentInstance.index()).toBe(1);
  });

  it('leaves clicks on a link inside a slide alone', () => {
    const { f, el, clickAt } = render();
    f.componentInstance.index.set(1);
    f.detectChanges();
    clickAt(290, el.querySelector('a')!);
    expect(f.componentInstance.index()).toBe(1);
  });

  it('ignores edge clicks with edges off', () => {
    const { f, clickAt } = render();
    f.componentInstance.edges.set(false);
    f.detectChanges();
    clickAt(290);
    expect(f.componentInstance.index()).toBe(0);
  });

  it('shows the chevron for the side under the pointer only when it can go there', () => {
    const { f, view } = render();
    const aim = (x: number) => {
      view.dispatchEvent(new MouseEvent('pointermove', { clientX: x, bubbles: true }));
      f.detectChanges();
    };
    aim(290);
    expect(view.getAttribute('data-side')).toBe('next');
    aim(10);
    expect(view.hasAttribute('data-side')).toBe(false);
  });

  it('moves with the arrow keys when focused', () => {
    const { f, el } = render();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance.index()).toBe(1);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance.index()).toBe(0);
  });

  it('slides the track by the index', () => {
    const { f, el } = render();
    f.componentInstance.index.set(2);
    f.detectChanges();
    expect((el.querySelector('.kc-track') as HTMLElement).style.transform).toBe('translateX(-200%)');
  });
});
