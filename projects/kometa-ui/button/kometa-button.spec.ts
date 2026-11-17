import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { KometaButton, KometaButtonElement } from './kometa-button';

@Component({
  imports: [KometaButton],
  template: `
    <button k-button id="a" [disabled]="off()" [loading]="busy()" (click)="hits.set(hits() + 1)">Save</button>
    <button k-button id="b" severity="secondary" outlined size="small" class="mine">Cancel</button>
    <button k-button id="c" severity="danger" fluid type="submit" aria-label="Delete it">Delete</button>
    <a k-button id="d" href="#book" [loading]="busy()" (click)="hits.set(hits() + 1)">Book</a>
    <form (submit)="$event.preventDefault(); submits.set(submits() + 1)"><button k-button id="e">In a form</button></form>
  `,
})
class Host {
  off = signal(false);
  busy = signal(false);
  hits = signal(0);
  submits = signal(0);
}

describe('KometaButton', () => {
  const mount = () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const q = <T extends HTMLElement = HTMLButtonElement>(id: string) => f.nativeElement.querySelector(`#${id}`) as T;
    return { f, q };
  };

  it('is the native element itself, carrying the content and the caller click', () => {
    const { f, q } = mount();
    expect(q('a').tagName).toBe('BUTTON');
    expect(q('a').classList.contains('kbtn')).toBe(true);
    expect(q('a').textContent!.trim()).toBe('Save');
    q('a').click();
    expect(f.componentInstance.hits()).toBe(1);
  });

  it('defaults a button to type="button" but keeps a written type', () => {
    const { f, q } = mount();
    expect(q('a').type).toBe('button');
    expect(q('c').type).toBe('submit');
    q('e').click();
    expect(f.componentInstance.submits()).toBe(0);
  });

  it('draws severity, outlined, small and fluid as classes beside the caller class and native attributes', () => {
    const { q } = mount();
    expect(['kbtn', 'secondary', 'outlined', 'sm', 'mine'].every((c) => q('b').classList.contains(c))).toBe(true);
    expect(q('a').classList.contains('secondary')).toBe(false);
    expect(q('c').classList.contains('danger')).toBe(true);
    expect(q('c').classList.contains('kbtn-fluid')).toBe(true);
    expect(q('c').getAttribute('aria-label')).toBe('Delete it');
  });

  it('native disabled blocks the tap', () => {
    const { f, q } = mount();
    f.componentInstance.off.set(true);
    f.detectChanges();
    q('a').click();
    expect(f.componentInstance.hits()).toBe(0);
  });

  it('loading swallows the click but keeps the button enabled and focused', () => {
    const { f, q } = mount();
    f.componentInstance.busy.set(true);
    f.detectChanges();
    q('a').focus();
    q('a').click();
    expect(f.componentInstance.hits()).toBe(0);
    expect(q('a').disabled).toBe(false);
    expect(document.activeElement).toBe(q('a'));
    expect(q('a').getAttribute('aria-busy')).toBe('true');
    expect(q('a').getAttribute('aria-disabled')).toBe('true');
    expect(q('a').querySelector('.kbtn-spin')).not.toBeNull();
  });

  it('works on a link, and loading stops its navigation', () => {
    const { f, q } = mount();
    const a = q<HTMLAnchorElement>('d');
    expect(a.tagName).toBe('A');
    expect(a.classList.contains('kbtn')).toBe(true);
    expect(a.hasAttribute('type')).toBe(false);
    f.componentInstance.busy.set(true);
    f.detectChanges();
    const e = new MouseEvent('click', { bubbles: true, cancelable: true });
    a.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
    expect(f.componentInstance.hits()).toBe(0);
  });
});

@Component({
  imports: [KometaButton],
  template: `<button k-button id="l" icon="+">Go</button><button k-button id="r" icon="→" iconPos="right">Go</button>`,
})
class IconHost {}

describe('KometaButton icon', () => {
  it('puts the icon before or after the content', () => {
    const f = TestBed.createComponent(IconHost);
    f.detectChanges();
    const kids = (id: string) => [...f.nativeElement.querySelector(`#${id}`).children].map((c: HTMLElement) => c.className);
    expect(kids('l')).toEqual(['kbtn-icon', 'kbtn-label']);
    expect(kids('r')).toEqual(['kbtn-label', 'kbtn-icon']);
  });
});

@Component({
  imports: [KometaButtonElement],
  template: `
    <k-button id="a" label="Save" [disabled]="off()" [loading]="busy()" (clicked)="hits.set(hits() + 1)" />
    <k-button id="b" label="Cancel" severity="secondary" [outlined]="true" size="small" styleClass="mine" />
    <k-button id="c" label="Delete" severity="danger" [fluid]="true" type="submit" ariaLabel="Delete it" />
  `,
})
class LegacyHost {
  off = signal(false);
  busy = signal(false);
  hits = signal(0);
}

describe('KometaButtonElement (deprecated <k-button>)', () => {
  it('still draws a k-button inside and passes its inputs on', () => {
    const f = TestBed.createComponent(LegacyHost);
    f.detectChanges();
    const q = (id: string) => f.nativeElement.querySelector(`#${id} button`) as HTMLButtonElement;
    expect(q('a').textContent!.trim()).toBe('Save');
    expect(q('a').type).toBe('button');
    q('a').click();
    expect(f.componentInstance.hits()).toBe(1);
    expect(['kbtn', 'secondary', 'outlined', 'sm', 'mine'].every((c) => q('b').classList.contains(c))).toBe(true);
    expect(q('c').type).toBe('submit');
    expect(q('c').getAttribute('aria-label')).toBe('Delete it');
    expect((f.nativeElement.querySelector('#c') as HTMLElement).classList.contains('kbtn-fluid')).toBe(true);
    f.componentInstance.busy.set(true);
    f.detectChanges();
    q('a').click();
    expect(f.componentInstance.hits()).toBe(1);
    expect(q('a').getAttribute('aria-busy')).toBe('true');
  });
});
