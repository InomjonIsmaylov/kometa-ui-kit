import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { KometaPhotos, type KometaPhoto } from './kometa-photos';

@Component({
  imports: [KometaPhotos],
  template: `<k-photos [photos]="photos" [(open)]="open" [(index)]="index" closeLabel="Yopish" />`,
})
class Host {
  photos: KometaPhoto[] = [1, 2, 3].map((n) => ({ url: `/f${n}.webp`, thumbUrl: `/t${n}.webp` }));
  open = signal(true);
  index = signal(0);
}

describe('KometaPhotos', () => {
  const mount = async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement, host: fixture.componentInstance };
  };

  it('shows the photo, the count and a thumbnail strip; the arrows wrap around', async () => {
    const { fixture, el } = await mount();
    expect(el.querySelector('img.big')?.getAttribute('src')).toBe('/f1.webp');
    expect(el.querySelector('.count')?.textContent?.trim()).toBe('1 / 3');
    expect(el.querySelectorAll('.th').length).toBe(3);
    (el.querySelector('.arrow.prev') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(el.querySelector('.count')?.textContent?.trim()).toBe('3 / 3');
    fixture.destroy();
  });

  it('a thumbnail jumps, Arrow keys move, and the Close word closes', async () => {
    const { fixture, el, host } = await mount();
    (el.querySelectorAll('.th')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.index()).toBe(1);
    el.querySelector('dialog')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(host.index()).toBe(2);
    const close = el.querySelector('.close') as HTMLButtonElement;
    expect(close.textContent!.trim()).toBe('Yopish');
    close.click();
    fixture.detectChanges();
    expect(host.open()).toBe(false);
    expect(el.querySelector('img.big')).toBeNull();
    fixture.destroy();
  });

  it('rotates and zooms within limits, offers the download, and starts upright on the next photo', async () => {
    const { fixture, el } = await mount();
    const tool = (label: string) => el.querySelector(`[aria-label="${label}"]`) as HTMLElement;
    const transform = () => (el.querySelector('img.big') as HTMLElement).style.transform;
    const big = el.querySelector('img.big') as HTMLElement;
    tool('Rotate right').click();
    fixture.detectChanges();
    expect(big.classList.contains('sideways')).toBe(true);
    tool('Rotate right').click();
    fixture.detectChanges();
    expect(big.classList.contains('sideways')).toBe(false);
    expect(transform()).toBe('rotate(180deg) scale(1)');
    tool('Rotate left').click();
    tool('Rotate left').click();
    tool('Rotate left').click();
    fixture.detectChanges();
    expect(big.classList.contains('sideways')).toBe(true);
    tool('Rotate right').click();
    tool('Rotate right').click();
    tool('Rotate right').click();
    tool('Rotate right').click();
    fixture.detectChanges();
    expect(transform()).toBe('rotate(270deg) scale(1)');
    expect(big.classList.contains('sideways')).toBe(true);
    tool('Rotate right').click();
    fixture.detectChanges();
    expect(transform()).toBe('rotate(360deg) scale(1)');
    expect(big.classList.contains('sideways')).toBe(false);
    tool('Rotate right').click();
    tool('Rotate right').click();
    fixture.detectChanges();
    expect(transform()).toBe('rotate(540deg) scale(1)');
    for (let i = 0; i < 20; i++) tool('Zoom in').click();
    fixture.detectChanges();
    expect(transform()).toBe('rotate(540deg) scale(3)');
    expect(tool('Zoom in').getAttribute('aria-disabled')).toBe('true');
    expect(tool('Download').getAttribute('href')).toBe('/f1.webp');
    (el.querySelector('.arrow.next') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(transform()).toBe('rotate(0deg) scale(1)');
    fixture.destroy();
  });
});
