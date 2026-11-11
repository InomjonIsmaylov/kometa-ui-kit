import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaMarkDay, KometaMarks } from './kometa-marks';

@Component({
  imports: [KometaMarks],
  template: `<kometa-marks [days]="days()" />`,
})
class Host {
  days = signal<KometaMarkDay[]>([
    { label: 'Du', mark: null },
    { label: 'Se', mark: '10–19' },
  ]);
}

describe('KometaMarks', () => {
  it('renders a dash and a muted day for a null mark, and the string under its label', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const days = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.day')];
    expect(days[0].classList.contains('muted')).toBe(true);
    expect(days[0].querySelector('.label')!.textContent!.trim()).toBe('Du');
    expect(days[0].querySelector('.mark')!.textContent!.trim()).toBe('—');
    expect(days[1].classList.contains('muted')).toBe(false);
    expect(days[1].querySelector('.label')!.textContent!.trim()).toBe('Se');
    expect(days[1].querySelector('.mark')!.textContent!.trim()).toBe('10–19');
  });

  it('draws `empty` for a closed day', () => {
    const fixture = TestBed.createComponent(KometaMarks);
    fixture.componentRef.setInput('days', [{ label: 'Du', mark: null }]);
    fixture.componentRef.setInput('empty', 'off');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.mark')!.textContent!.trim()).toBe('off');
  });
});
