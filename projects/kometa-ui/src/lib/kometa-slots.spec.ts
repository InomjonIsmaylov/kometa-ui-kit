import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaSlots } from './kometa-slots';

@Component({
  imports: [KometaSlots],
  template: `<k-slots [slots]="slots()" [(value)]="value" [clearable]="clearable()" [ariaLabel]="'Vaqt'" />`,
})
class Host {
  slots = signal([
    { value: '09:30', label: '09:30', note: 'band', disabled: true },
    { value: '10:30', label: '10:30', note: "bo'sh" },
    { value: '11:15', label: '11:15' },
  ]);
  value = signal('');
  clearable = signal(false);
}

describe('KometaSlots', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('k-slots') as HTMLElement;
    const buttons = [...root.querySelectorAll('button')] as HTMLButtonElement[];
    return { f, root, buttons };
  }

  it('renders a chip per slot with its note and names the group', () => {
    const { root, buttons } = render();
    expect(root.getAttribute('role')).toBe('group');
    expect(root.getAttribute('aria-label')).toBe('Vaqt');
    expect(buttons.map((b) => b.textContent?.replace(/\s+/g, ' ').trim())).toEqual([
      '09:30 band',
      "10:30 bo'sh",
      '11:15',
    ]);
    expect(buttons[2].querySelector('small')).toBeNull();
    expect(buttons.every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true);
  });

  it('presses the chosen chip and gives it the edge class', () => {
    const { f, buttons } = render();
    f.componentInstance.value.set('10:30');
    f.detectChanges();
    expect(buttons.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false']);
    expect(buttons.map((b) => b.classList.contains('edge'))).toEqual([false, true, false]);
  });

  it('sets the value on click', () => {
    const { f, buttons } = render();
    buttons[2].click();
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('11:15');
    expect(buttons[2].getAttribute('aria-pressed')).toBe('true');
  });

  it('ignores a disabled chip', () => {
    const { f, buttons } = render();
    expect(buttons[0].disabled).toBe(true);
    buttons[0].click();
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('');
  });

  it('marks the chosen chip with an edge, not an amber fill', () => {
    render();
    const css = [...document.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n');
    const edge = css.match(/button\.edge[^{]*\{[^}]*\}/)?.[0] ?? '';
    expect(edge).toContain('inset 2px 0 0 var(--slot-edge, var(--amber))');
    expect(edge).not.toMatch(/background/);
  });

  it('a second tap on the chosen chip clears it only when clearable', () => {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const slots = f.nativeElement.querySelector('k-slots') as HTMLElement;
    const second = () => (slots.querySelectorAll('button')[1] as HTMLButtonElement);
    second().click();
    second().click();
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('10:30');

    f.componentInstance.clearable.set(true);
    f.detectChanges();
    second().click();
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('');
  });
});

describe('KometaSlots disabled', () => {
  it('disabled disables every chip', () => {
    @Component({ imports: [KometaSlots], template: `<k-slots [slots]="s" disabled />` })
    class H { s = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }]; }
    const f = TestBed.createComponent(H);
    f.detectChanges();
    const b = [...(f.nativeElement as HTMLElement).querySelectorAll('button')];
    expect(b.length).toBe(2);
    expect(b.every((x) => x.disabled)).toBe(true);
  });
});
