import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaInplace } from './kometa-inplace';

@Component({
  imports: [KometaInplace],
  template: `<k-inplace [(value)]="name" ariaLabel="Shop name" [disabled]="off()" />`,
})
class Host {
  name = signal('Usta Barber');
  off = signal(false);
}

describe('KometaInplace', () => {
  async function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement.querySelector('k-inplace') as HTMLElement;
    const word = () => el.querySelector('.word') as HTMLButtonElement | null;
    const box = () => el.querySelector('input') as HTMLInputElement | null;
    const open = async () => { word()!.click(); f.detectChanges(); await f.whenStable(); };
    const press = async (key: string) => {
      box()!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      f.detectChanges();
      await f.whenStable();
    };
    return { f, el, word, box, open, press };
  }

  it('shows the value as a labelled word', async () => {
    const { word } = await render();
    expect(word()!.textContent!.trim()).toBe('Usta Barber');
    expect(word()!.getAttribute('aria-label')).toBe('Shop name: Usta Barber');
  });

  it('opens an input with the old value struck above, and saves on Enter', async () => {
    const { f, el, box, word, open, press } = await render();
    await open();
    expect(el.querySelector('.old')!.textContent).toBe('Usta Barber');
    expect(document.activeElement).toBe(box());
    box()!.value = '  Kometa Barber ';
    await press('Enter');
    expect(f.componentInstance.name()).toBe('Kometa Barber');
    expect(box()).toBeNull();
    expect(word()!.classList.contains('saved')).toBe(true);
    expect(document.activeElement).toBe(word());
  });

  it('cancels on Escape and keeps the old value when emptied', async () => {
    const { f, box, open, press } = await render();
    await open();
    box()!.value = 'Something else';
    await press('Escape');
    expect(f.componentInstance.name()).toBe('Usta Barber');
    await open();
    box()!.value = '   ';
    await press('Enter');
    expect(f.componentInstance.name()).toBe('Usta Barber');
  });

  it('saves when focus leaves the field', async () => {
    const { f, box, open } = await render();
    await open();
    box()!.value = 'Blurred';
    box()!.dispatchEvent(new FocusEvent('blur'));
    f.detectChanges();
    expect(f.componentInstance.name()).toBe('Blurred');
  });

  it('does not open when disabled', async () => {
    const { f, word, box } = await render();
    f.componentInstance.off.set(true);
    f.detectChanges();
    expect(word()!.disabled).toBe(true);
    word()!.click();
    f.detectChanges();
    expect(box()).toBeNull();
  });
});
