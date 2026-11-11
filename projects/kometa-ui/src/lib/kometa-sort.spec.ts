import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaSort, KometaSortHeader } from './kometa-sort';

@Component({
  imports: [KometaSort, KometaSortHeader],
  template: `
    <kometa-sort [options]="options" [key]="key()" [dir]="dir()" (pick)="picked.push($event)" />
    <table><thead><tr>
      <th kometaSortHeader="name" [active]="key()" [dir]="dir()" (pick)="picked.push($event)">Name</th>
      <th kometaSortHeader="date" [active]="key()" [dir]="dir()" (pick)="picked.push($event)">Date</th>
    </tr></thead></table>
  `,
})
class Host {
  options = [{ value: 'name', label: 'Name' }, { value: 'date', label: 'Date' }];
  key = signal('name');
  dir = signal<'asc' | 'desc'>('asc');
  picked: string[] = [];
}

describe('KometaSort', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const el = f.nativeElement as HTMLElement;
    return { f, el, words: () => [...el.querySelectorAll('kometa-sort button')] as HTMLButtonElement[] };
  }

  it('presses the active word and draws its direction', () => {
    const { f, words } = render();
    expect(words().map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
    expect(words()[0].querySelector('.glyph')?.textContent).toBe('↑');
    f.componentInstance.dir.set('desc');
    f.detectChanges();
    expect(words()[0].querySelector('.glyph')?.textContent).toBe('↓');
    expect(words()[1].querySelector('.glyph')).toBeNull();
  });

  it('reports the tapped key, the active one included', () => {
    const { f, words } = render();
    words()[1].click();
    words()[0].click();
    expect(f.componentInstance.picked).toEqual(['date', 'name']);
  });

  it('names the group and the direction for a screen reader', () => {
    const { el, words } = render();
    expect(el.querySelector('kometa-sort')?.getAttribute('aria-label')).toBe('Sort');
    expect(words()[0].querySelector('.sr')?.textContent).toBe('ascending');
  });
});

describe('KometaSortHeader', () => {
  it('sets aria-sort on the th, shows a glyph only on the active column and reports the click', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const ths = [...(f.nativeElement as HTMLElement).querySelectorAll('th')];
    expect(ths.map((t) => t.getAttribute('aria-sort'))).toEqual(['ascending', 'none']);
    expect(ths[0].querySelector('.glyph')?.textContent).toBe('↑');
    expect(ths[1].querySelector('.glyph')).toBeNull();
    f.componentInstance.key.set('date');
    f.componentInstance.dir.set('desc');
    f.detectChanges();
    expect(ths.map((t) => t.getAttribute('aria-sort'))).toEqual(['none', 'descending']);
    ths[1].querySelector('button')!.click();
    expect(f.componentInstance.picked).toEqual(['date']);
    expect(ths[0].querySelector('button')?.textContent?.trim()).toBe('Name');
  });
});
