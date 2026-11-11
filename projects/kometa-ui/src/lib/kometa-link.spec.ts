import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, vi } from 'vitest';
import { KometaLink } from './kometa-link';

@Component({
  imports: [KometaLink],
  template: `<kometa-link [text]="text()" [copyLabel]="copyLabel()" [copiedLabel]="copiedLabel()" />`,
})
class Host {
  text = signal('https://kometa.com.uz/book/chilonzor');
  copyLabel = signal('Nusxa');
  copiedLabel = signal('Nusxalandi');
}

@Component({
  imports: [KometaLink],
  template: `<code>https://kometa.com.uz/book/x</code><kometa-link [flashValue]="flash()" text="x" copyLabel="Nusxa" copiedLabel="Nusxalandi" />`,
})
class HostWithValue {
  flash = signal(true);
}

describe('KometaLink', () => {
  const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

  afterEach(() => {
    vi.useRealTimers();
    if (clipboard) Object.defineProperty(navigator, 'clipboard', clipboard);
    else Reflect.deleteProperty(navigator, 'clipboard');
  });

  function render() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    return { fixture, button };
  }

  function stubClipboard(writeText: ReturnType<typeof vi.fn>) {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  }

  it('copies the text, shows the copied label, and returns after 900ms', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);
    const { fixture, button } = render();
    expect(button.textContent!.trim()).toBe('Nusxa');

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    button.click();
    await vi.advanceTimersByTimeAsync(0);
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith('https://kometa.com.uz/book/chilonzor');
    expect(button.textContent!.trim()).toBe('Nusxalandi');

    await vi.advanceTimersByTimeAsync(899);
    fixture.detectChanges();
    expect(button.textContent!.trim()).toBe('Nusxalandi');

    await vi.advanceTimersByTimeAsync(1);
    fixture.detectChanges();
    expect(button.textContent!.trim()).toBe('Nusxa');
  });

  it('sweeps a band over the value before it, unless told not to', async () => {
    stubClipboard(vi.fn().mockResolvedValue(undefined));
    const fixture = TestBed.createComponent(HostWithValue);
    fixture.detectChanges();
    const value = fixture.nativeElement.querySelector('code') as HTMLElement;
    const animate = vi.fn();
    value.animate = animate;
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    await Promise.resolve();
    await Promise.resolve();
    expect(animate).toHaveBeenCalledTimes(1);

    fixture.componentInstance.flash.set(false);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    await Promise.resolve();
    await Promise.resolve();
    expect(animate).toHaveBeenCalledTimes(1);
  });

  it('stays on the copy label when the clipboard refuses', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')));
    const { fixture, button } = render();

    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    button.click();
    await vi.advanceTimersByTimeAsync(900);
    fixture.detectChanges();

    expect(button.textContent!.trim()).toBe('Nusxa');
  });
});
