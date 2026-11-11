import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaFrame } from './kometa-frame';

@Component({
  imports: [KometaFrame],
  template: `
    <kometa-frame [caption]="caption()">
      <img alt="Do'kon" src="/shop.jpg" />
    </kometa-frame>
  `,
})
class Host {
  caption = signal('');
}

describe('KometaFrame', () => {
  it('projects the picture in a 16px frame and omits an empty caption', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('kometa-frame') as HTMLElement;
    const frame = el.querySelector('.frame') as HTMLElement;
    expect(frame.querySelector('img')!.getAttribute('alt')).toBe("Do'kon");
    expect(el.querySelector('.caption')).toBeNull();
    expect(getComputedStyle(frame).borderRadius).toBe('16px');
  });

  it('puts a caption under the frame when one is set', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.caption.set('Chilonzor');
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('kometa-frame') as HTMLElement;
    const caption = el.querySelector('.caption') as HTMLElement;
    expect(caption.textContent!.trim()).toBe('Chilonzor');
    expect(el.querySelector('.frame')!.nextElementSibling).toBe(caption);
  });
});
