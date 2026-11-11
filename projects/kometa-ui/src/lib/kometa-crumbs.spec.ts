import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaCrumb, KometaCrumbs } from './kometa-crumbs';

@Component({
  imports: [KometaCrumbs],
  template: `<k-crumbs [items]="items" (picked)="got = $event" />`,
})
class Host {
  items: KometaCrumb[] = [{ label: 'Shops', href: '/shops' }, { label: 'Usta Barber' }, { label: 'Schedule' }];
  got: KometaCrumb | null = null;
}

describe('KometaCrumbs', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    return { f, el: f.nativeElement as HTMLElement };
  }

  it('is a labelled nav around an ordered list', () => {
    const { el } = render();
    expect(el.querySelector('nav')!.getAttribute('aria-label')).toBe('Breadcrumb');
    expect(el.querySelectorAll('nav ol li').length).toBe(3);
  });

  it('links a crumb with href, makes the rest buttons, and marks the last as the page', () => {
    const { el } = render();
    const li = el.querySelectorAll('li');
    expect(li[0].querySelector('a')!.getAttribute('href')).toBe('/shops');
    expect(li[1].querySelector('button')!.textContent).toBe('Usta Barber');
    const here = li[2].querySelector('[aria-current="page"]')!;
    expect(here.textContent).toBe('Schedule');
    expect(li[2].querySelector('a, button')).toBeNull();
  });

  it('emits picked for a crumb with no href', () => {
    const { f, el } = render();
    el.querySelector('button')!.click();
    expect(f.componentInstance.got!.label).toBe('Usta Barber');
  });

  it('steps each level further in, and sizes the one before the page up', () => {
    const { el } = render();
    const li = el.querySelectorAll('li');
    expect(li[2].style.getPropertyValue('--i')).toBe('2');
    expect(li[1].classList.contains('near')).toBe(true);
    expect(li[0].classList.contains('near')).toBe(false);
  });
});
