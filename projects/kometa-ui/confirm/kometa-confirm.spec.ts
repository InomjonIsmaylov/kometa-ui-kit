import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaConfirm } from './kometa-confirm';

@Component({
  imports: [KometaConfirm],
  template: `
    <k-confirm [asking]="asking()">
      <span data-row>Mark paid cash</span>
      <span data-question>Sure? <button type="button">Yo'q</button><button type="button">Ha</button></span>
    </k-confirm>
  `,
})
class Host {
  asking = signal(false);
}

describe('KometaConfirm', () => {
  function visible(el: HTMLElement): string {
    return [...el.querySelectorAll<HTMLElement>('.pane')]
      .filter((pane) => !pane.classList.contains('off'))
      .map((pane) => pane.textContent ?? '')
      .join(' ');
  }

  function render(asking: boolean) {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.asking.set(asking);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('k-confirm') as HTMLElement;
  }

  it('shows the row and not the question while not asking', () => {
    const shown = visible(render(false));
    expect(shown).toContain('Mark paid cash');
    expect(shown).not.toContain('Sure?');
    expect(shown).not.toContain('Ha');
  });

  it('shows the question and not the row while asking, without an amber button of its own', () => {
    const el = render(true);
    const shown = visible(el);
    expect(shown).toContain('Sure?');
    expect(shown).toContain('Ha');
    expect(shown).not.toContain('Mark paid cash');

    const buttons = [...el.querySelectorAll('button')];
    expect(buttons.map((button) => button.textContent!.trim())).toEqual(["Yo'q", 'Ha']);
    for (const button of buttons) {
      expect(button.closest('[data-question]')).not.toBeNull();
    }

    // Its own compiled styles, not the page: those tags come and go with other specs' fixtures.
    const css = ((KometaConfirm as unknown as { ɵcmp?: { styles?: string[] } }).ɵcmp?.styles ?? []).join('\n').replaceAll('%NS%', '');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).not.toMatch(/button[^{]*\{[^}]*background:\s*var\(--amber\)/);
  });
});
