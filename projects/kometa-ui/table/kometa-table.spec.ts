import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { KometaTable } from './kometa-table';

@Component({
  imports: [KometaTable],
  template: `
    <k-table class="mine" [value]="rows()" dataKey="id.n" groupRowsBy="group" tableStyleClass="wide" [tableStyle]="{ 'min-width': '100%' }" [scrollHeight]="cap()">
      <ng-template #header><tr><th scope="col">Name</th></tr></ng-template>
      <ng-template #groupheader let-row><tr class="band"><th>{{ row.group }}</th></tr></ng-template>
      <ng-template #body let-row let-i="rowIndex"><tr class="row"><td>{{ i }}:{{ row.name }}</td></tr></ng-template>
      <ng-template #emptymessage><tr class="none"><td>Nothing</td></tr></ng-template>
    </k-table>
  `,
})
class Host {
  rows = signal([
    { id: { n: 1 }, name: 'a', group: 'G1' },
    { id: { n: 2 }, name: 'b', group: 'G1' },
    { id: { n: 3 }, name: 'c', group: 'G2' },
  ]);
  cap = signal<string | null>(null);
}

describe('KometaTable', () => {
  const mount = () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    return f;
  };
  const el = (f: { nativeElement: HTMLElement }) => f.nativeElement.querySelector('k-table') as HTMLElement;

  it('is a plain table: the header in thead, a row per value in tbody with its index', () => {
    const f = mount();
    expect(el(f).classList.contains('ktable') && el(f).classList.contains('mine')).toBe(true);
    expect(el(f).querySelector('thead th')?.textContent).toBe('Name');
    expect([...el(f).querySelectorAll('tbody .row')].map((r) => r.textContent)).toEqual(['0:a', '1:b', '2:c']);
  });

  it('puts the table class and style on the <table>', () => {
    const f = mount();
    const table = el(f).querySelector('table')!;
    expect(table.classList.contains('wide') && table.classList.contains('ktable-table')).toBe(true);
    expect(table.style.minWidth).toBe('100%');
  });

  it('draws a group header when the grouping field changes', () => {
    const f = mount();
    expect([...el(f).querySelectorAll('tbody .band')].map((r) => r.textContent!.trim())).toEqual(['G1', 'G2']);
  });

  it('shows the empty message only when there are no rows', () => {
    const f = mount();
    expect(el(f).querySelector('.none')).toBeNull();
    f.componentInstance.rows.set([]);
    f.detectChanges();
    expect(el(f).querySelector('.none')?.textContent).toBe('Nothing');
    expect(el(f).querySelector('.row')).toBeNull();
  });

  it('a scrollHeight caps the wrapper', () => {
    const f = mount();
    f.componentInstance.cap.set('640px');
    f.detectChanges();
    const wrap = el(f).querySelector('.ktable-scroll') as HTMLElement;
    expect(wrap.classList.contains('is-capped')).toBe(true);
    expect(wrap.style.maxHeight).toBe('640px');
  });
});
