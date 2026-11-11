import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaAnimate, kometaAnimationName, kometaMotionVars } from './kometa-motion';
import { KometaPop } from './kometa-pop';

@Component({
  imports: [KometaPop, KometaAnimate],
  template: `
    <k-pop ariaLabel="Shop" [animation]="anim()"><button type="button">One</button></k-pop>
    <p class="a" kAnimate="zoom" [kAnimateDelay]="120" kAnimateDuration="300">Hi</p>
    <p class="b" kAnimate>Default</p>
  `,
})
class Host {
  anim = signal('');
}

describe('Kometa motion', () => {
  it('maps presets to their keyframes and passes custom names through', () => {
    expect(kometaAnimationName('fade')).toBe('k-m-fade');
    expect(kometaAnimationName('my-swoosh')).toBe('my-swoosh');
    expect(kometaAnimationName('')).toBeNull();
    expect(kometaAnimationName('none')).toBe('none');
  });

  it('gives a preset its -out twin, reversed, and a custom pair its second name, forwards', () => {
    expect(kometaMotionVars('flip')).toEqual({ '--k-anim': 'k-m-flip', '--k-anim-out': 'k-m-flip-out', '--k-anim-dir': 'reverse' });
    expect(kometaMotionVars('in-a out-b')).toEqual({ '--k-anim': 'in-a', '--k-anim-out': 'out-b', '--k-anim-dir': 'normal' });
    expect(kometaMotionVars('in-a')['--k-anim-out']).toBe('none');
    expect(kometaMotionVars('')).toEqual({});
  });

  it('injects the preset keyframes once and binds the chosen motion on the panel', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const styles = document.querySelectorAll('style#kometa-motion');
    expect(styles.length).toBe(1);
    expect(styles[0].textContent).toContain('@keyframes k-m-spring-out');
    const panel = (f.nativeElement as HTMLElement).querySelector('.pop') as HTMLElement;
    expect(panel.style.getPropertyValue('--k-anim')).toBe('');
    f.componentInstance.anim.set('blur');
    f.detectChanges();
    expect(panel.style.getPropertyValue('--k-anim')).toBe('k-m-blur');
  });

  it('kAnimate sets the animation on its element', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const a = (f.nativeElement as HTMLElement).querySelector('.a') as HTMLElement;
    expect(a.style.animationName).toBe('k-m-zoom');
    expect(a.style.animationDelay).toBe('120ms');
    expect(a.style.animationDuration).toBe('300ms');
    expect(((f.nativeElement as HTMLElement).querySelector('.b') as HTMLElement).style.animationName).toBe('k-m-rise');
  });
});
