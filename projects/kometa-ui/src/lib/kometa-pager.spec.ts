import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaPager, pageWindow } from './kometa-pager';

@Component({
  imports: [KometaPager],
  template: `<k-pager [total]="total()" [(page)]="page" [(pageSize)]="size" />`,
})
class Host {
  total = signal(134);
  page = signal(1);
  size = signal(25);
}

describe('pageWindow', () => {
  it('shows every page of a short list', () => expect(pageWindow(2, 5)).toEqual([1, 2, 3, 4, 5]));
  it('gaps of two or more become one rule, a gap of one shows its number', () => {
    expect(pageWindow(1, 9)).toEqual([1, 2, null, 9]);
    expect(pageWindow(5, 9)).toEqual([1, null, 4, 5, 6, null, 9]);
    expect(pageWindow(3, 9)).toEqual([1, 2, 3, 4, null, 9]);
    expect(pageWindow(9, 9)).toEqual([1, null, 8, 9]);
  });
  it('one page is just 1', () => expect(pageWindow(1, 1)).toEqual([1]));
});

describe('KometaPager', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('k-pager') as HTMLElement;
    const q = (s: string) => [...root.querySelectorAll(s)] as HTMLButtonElement[];
    return { f, root, q };
  }

  it('draws the caption, the page words and marks the current one', () => {
    const { root, q } = render();
    expect(root.querySelector('.cap')?.textContent?.trim()).toBe('1–25 / 134');
    expect(q('.num').map((b) => b.textContent?.trim())).toEqual(['1', '2', '6']);
    expect(q('.num')[0].getAttribute('aria-current')).toBe('page');
    expect(q('.num')[1].getAttribute('aria-current')).toBeNull();
    expect(root.querySelectorAll('.gap').length).toBe(1);
  });

  it('goes to a page, and the arrows stop at the ends', () => {
    const { f, q } = render();
    const [prev, next] = q('.arrow');
    expect(prev.disabled).toBe(true);
    q('.num')[1].click();
    f.detectChanges();
    expect(f.componentInstance.page()).toBe(2);
    expect(prev.disabled).toBe(false);
    next.click();
    f.detectChanges();
    expect(f.componentInstance.page()).toBe(3);
    f.componentInstance.page.set(6);
    f.detectChanges();
    expect(next.disabled).toBe(true);
  });

  it('a new rows-per-page returns to page 1 and presses its word', () => {
    const { f, q, root } = render();
    f.componentInstance.page.set(3);
    f.detectChanges();
    const sizes = q('.sizes button');
    expect(sizes.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false']);
    sizes[2].click();
    f.detectChanges();
    expect(f.componentInstance.size()).toBe(50);
    expect(f.componentInstance.page()).toBe(1);
    expect(root.querySelector('.cap')?.textContent?.trim()).toBe('1–50 / 134');
  });

  it('is hidden when the total fits the smallest size, and shown again past it', () => {
    const { f, root } = render();
    f.componentInstance.total.set(10);
    f.detectChanges();
    expect(root.hidden).toBe(true);
    f.componentInstance.total.set(11);
    f.detectChanges();
    expect(root.hidden).toBe(false);
  });

  it('pulls a page past the end back to the last one', () => {
    const { f } = render();
    f.componentInstance.page.set(6);
    f.detectChanges();
    f.componentInstance.total.set(60);
    f.detectChanges();
    expect(f.componentInstance.page()).toBe(3);
  });

  it('speaks the page language', () => {
    document.documentElement.lang = 'ru';
    const { root } = render();
    expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('Страницы');
    expect(root.querySelector('.arrow')?.getAttribute('aria-label')).toBe('Предыдущая страница');
    document.documentElement.lang = '';
  });
});
