import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaNote } from './kometa-note';

@Component({
  imports: [KometaNote],
  template: `<kometa-note [label]="label()" [(open)]="open">{{ text() }}</kometa-note>`,
})
class Host {
  label = signal('Daromad nima?');
  open = signal(false);
  text = signal("Davr uchun tushum, to'lovlargacha.");
}

describe('KometaNote', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('kometa-note') as HTMLElement;
    const mk = root.querySelector('button.mk') as HTMLButtonElement;
    const tip = root.querySelector('[role="tooltip"]') as HTMLElement;
    const pointer = (type: string, pointerType: string) => {
      const e = new Event(type, { bubbles: true });
      Object.defineProperty(e, 'pointerType', { value: pointerType });
      root.dispatchEvent(e);
      f.detectChanges();
    };
    return { f, root, mk, tip, pointer };
  }

  it('is a button marker with the caller\'s name and a tooltip tab that holds the projected sentence', () => {
    const { mk, tip } = render();
    expect(mk.getAttribute('aria-label')).toBe('Daromad nima?');
    expect(mk.getAttribute('aria-expanded')).toBe('false');
    expect(tip.textContent).toContain("Davr uchun tushum, to'lovlargacha.");
    expect(tip.getAttribute('popover')).toBe('manual');
  });

  it('lets the tab describe the marker only when the caller gave it no name', () => {
    const { f, mk, tip } = render();
    expect(mk.hasAttribute('aria-describedby')).toBe(false);
    f.componentInstance.label.set('');
    f.detectChanges();
    expect(mk.hasAttribute('aria-label')).toBe(false);
    expect(mk.getAttribute('aria-describedby')).toBe(tip.id);
  });

  it('opens on focus and closes on blur', () => {
    const { f, mk } = render();
    mk.dispatchEvent(new Event('focus'));
    f.detectChanges();
    expect(f.componentInstance.open()).toBe(true);
    expect(mk.getAttribute('aria-expanded')).toBe('true');
    mk.dispatchEvent(new Event('blur'));
    f.detectChanges();
    expect(f.componentInstance.open()).toBe(false);
  });

  it('opens on a mouse hover and closes when the mouse leaves, but a touch hover does nothing', () => {
    const { f, pointer } = render();
    pointer('pointerenter', 'touch');
    expect(f.componentInstance.open()).toBe(false);
    pointer('pointerenter', 'mouse');
    expect(f.componentInstance.open()).toBe(true);
    pointer('pointerleave', 'mouse');
    expect(f.componentInstance.open()).toBe(false);
  });

  it('stays open when the mouse leaves while the marker holds focus', () => {
    const { f, mk, pointer } = render();
    document.body.append(f.nativeElement);
    mk.focus();
    pointer('pointerenter', 'mouse');
    pointer('pointerleave', 'mouse');
    expect(f.componentInstance.open()).toBe(true);
    f.nativeElement.remove();
  });

  it('opens on a tap, which on a phone is a click with no hover before it', () => {
    const { f, mk } = render();
    mk.click();
    f.detectChanges();
    expect(f.componentInstance.open()).toBe(true);
  });

  it('closes on Escape and says so only when it was open', () => {
    const { f, mk } = render();
    const press = () => {
      const e = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
      const stop = vi.spyOn(e, 'stopPropagation');
      mk.dispatchEvent(e);
      f.detectChanges();
      return stop;
    };
    expect(press()).not.toHaveBeenCalled();
    f.componentInstance.open.set(true);
    f.detectChanges();
    expect(press()).toHaveBeenCalled();
    expect(f.componentInstance.open()).toBe(false);
  });
});
