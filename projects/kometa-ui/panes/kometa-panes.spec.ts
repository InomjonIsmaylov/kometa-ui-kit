import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaPanes } from './kometa-panes';

@Component({
  imports: [KometaPanes],
  template: `<k-panes [(size)]="size" [snaps]="snaps()"><nav kStart>Clients</nav><article>Anvar</article></k-panes>`,
})
class Host {
  size = signal(50);
  snaps = signal([25, 33, 50, 66, 75]);
}

describe('KometaPanes', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-panes') as HTMLElement;
    const grip = el.querySelector('[role="separator"]') as HTMLElement;
    const press = (key: string) => {
      grip.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      f.detectChanges();
    };
    const drag = (x: number) => {
      grip.parentElement!.getBoundingClientRect = () => ({ left: 0, width: 400 }) as DOMRect;
      grip.dispatchEvent(Object.assign(new MouseEvent('pointerdown', { bubbles: true }), { pointerId: 1 }));
      grip.dispatchEvent(Object.assign(new MouseEvent('pointermove', { clientX: x, bubbles: true }), { pointerId: 1 }));
      grip.dispatchEvent(Object.assign(new MouseEvent('pointerup', { bubbles: true }), { pointerId: 1 }));
      f.detectChanges();
    };
    return { f, el, grip, press, drag };
  }

  it('puts kStart in the first pane at its size and the rest in the second', () => {
    const { el, grip } = render();
    const panes = el.querySelectorAll<HTMLElement>('.pane');
    expect(panes[0].textContent).toBe('Clients');
    expect(panes[0].style.width).toBe('50%');
    expect(panes[1].textContent).toBe('Anvar');
    expect(grip.getAttribute('aria-valuenow')).toBe('50');
    expect(grip.getAttribute('aria-valuemin')).toBe('25');
    expect(grip.getAttribute('aria-valuemax')).toBe('75');
    expect(el.querySelectorAll('.snaps i').length).toBe(5);
    expect(el.querySelector('.snaps i.on')!.getAttribute('style')).toContain('left: 50%');
  });

  it('steps between snaps with the arrows and to the ends with Home/End', () => {
    const { f, press } = render();
    press('ArrowRight');
    expect(f.componentInstance.size()).toBe(66);
    press('ArrowLeft');
    press('ArrowLeft');
    expect(f.componentInstance.size()).toBe(33);
    press('End');
    press('ArrowRight');
    expect(f.componentInstance.size()).toBe(75);
    press('Home');
    expect(f.componentInstance.size()).toBe(25);
  });

  it('snaps a drag to the nearest stop', () => {
    const { f, drag } = render();
    drag(250); // 62.5%
    expect(f.componentInstance.size()).toBe(66);
  });

  it('goes anywhere between min and max without snaps', () => {
    const { f, el, press, drag } = render();
    f.componentInstance.snaps.set([]);
    f.detectChanges();
    expect(el.querySelector('.snaps')).toBeNull();
    drag(250);
    expect(f.componentInstance.size()).toBe(63);
    drag(10);
    expect(f.componentInstance.size()).toBe(15);
    press('ArrowRight');
    expect(f.componentInstance.size()).toBe(20);
  });
});
