import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaPicker } from './kometa-picker';

@Component({
  imports: [KometaPicker],
  template: `
    <kometa-picker [label]="label()" [hint]="hint()" [variant]="variant()" [accept]="accept()" [multiple]="multiple()"
                   [disabled]="disabled()" [plus]="plus()" [over]="over()" (picked)="got.push($event)">
      <b class="extra">Pro</b>
    </kometa-picker>
  `,
})
class Host {
  label = signal('Rasm tanlang');
  hint = signal('');
  variant = signal<'zone' | 'button'>('button');
  accept = signal('image/*');
  multiple = signal(false);
  disabled = signal(false);
  plus = signal(false);
  over = signal(false);
  got: File[][] = [];
}

describe('KometaPicker', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('kometa-picker') as HTMLElement;
    const input = () => root.querySelector('input[type=file]') as HTMLInputElement;
    const pick = (...files: File[]) => {
      Object.defineProperty(input(), 'files', { value: files, configurable: true });
      input().dispatchEvent(new Event('change'));
      f.detectChanges();
    };
    return { f, root, input, pick };
  }

  it('is a label around a real file input, so the word on it is the input\'s accessible name', () => {
    const { root, input } = render();
    const label = root.querySelector('label')!;
    expect(label.contains(input())).toBe(true);
    expect(label.textContent).toContain('Rasm tanlang');
  });

  it('hands accept, multiple and disabled to the input', () => {
    const { f, input } = render();
    expect(input().accept).toBe('image/*');
    expect(input().multiple).toBe(false);
    f.componentInstance.multiple.set(true);
    f.componentInstance.disabled.set(true);
    f.detectChanges();
    expect(input().multiple).toBe(true);
    expect(input().disabled).toBe(true);
  });

  it('draws the button as a chip with an optional plus and projects extra content after the word', () => {
    const { f, root } = render();
    expect(root.classList.contains('zone')).toBe(false);
    expect(root.querySelector('.plus')).toBeNull();
    expect(root.querySelector('.c')).toBeNull();
    f.componentInstance.plus.set(true);
    f.detectChanges();
    expect(root.querySelector('.plus')?.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('.extra')?.textContent).toBe('Pro');
  });

  it('draws the zone as a frame: four corner marks, a veil, the title, the hint and the projected content', () => {
    const { f, root } = render();
    f.componentInstance.variant.set('zone');
    f.componentInstance.hint.set('JPG yoki PNG');
    f.detectChanges();
    expect(root.classList.contains('zone')).toBe(true);
    expect(root.querySelectorAll('.c')).toHaveLength(4);
    expect(root.querySelector('.veil')).not.toBeNull();
    expect(root.querySelector('.t')?.textContent).toBe('Rasm tanlang');
    expect(root.querySelector('.h')?.textContent).toBe('JPG yoki PNG');
    expect(root.querySelector('.body .extra')).not.toBeNull();
  });

  it('leaves the hint out when there is none', () => {
    const { f, root } = render();
    f.componentInstance.variant.set('zone');
    f.detectChanges();
    expect(root.querySelector('.h')).toBeNull();
  });

  it('marks the host while the page reports a file over its drop target, and while disabled', () => {
    const { f, root } = render();
    f.componentInstance.over.set(true);
    f.componentInstance.disabled.set(true);
    f.detectChanges();
    expect(root.classList.contains('over')).toBe(true);
    expect(root.classList.contains('off')).toBe(true);
  });

  it('emits exactly the files chosen, and empties the input so the same file can be chosen again', () => {
    const { f, input, pick } = render();
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    const spy = vi.spyOn(input(), 'value', 'set');
    pick(file);
    expect(f.componentInstance.got).toEqual([[file]]);
    expect(spy).toHaveBeenCalledWith('');
  });

  it('emits nothing when the chooser was cancelled with no files', () => {
    const { f, pick } = render();
    pick();
    expect(f.componentInstance.got).toEqual([]);
  });
});
