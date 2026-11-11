import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaSplit, KometaSplitSide } from './kometa-split';

@Component({
  imports: [KometaSplit],
  template: `<kometa-split [left]="left()" [right]="right()" />`,
})
class Host {
  left = signal<KometaSplitSide>({ amount: '12 000', label: 'Naqd' });
  right = signal<KometaSplitSide>({ amount: '8 500', label: 'Karta' });
}

describe('KometaSplit', () => {
  it('shows the caller amounts and labels without reformatting', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('kometa-split') as HTMLElement;
    const amounts = [...el.querySelectorAll('.amount')].map((node) => node.textContent!.trim());
    const labels = [...el.querySelectorAll('.label')].map((node) => node.textContent!.trim());
    expect(amounts).toEqual(['12 000', '8 500']);
    expect(labels).toEqual(['Naqd', 'Karta']);
    expect(getComputedStyle(el.querySelector('.amount') as HTMLElement).fontFamily.toLowerCase()).toContain('syne');
  });
});
