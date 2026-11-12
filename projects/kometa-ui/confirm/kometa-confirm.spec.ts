import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaConfirm } from './kometa-confirm';

@Component({
  imports: [KometaConfirm],
  template: `
    <k-confirm [asking]="asking()">
      <span data-row>Mark paid cash <button type="button" class="mark">Mark</button></span>
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
    expect(buttons.map((button) => button.textContent!.trim())).toEqual(['Mark', "Yo'q", 'Ha']);
    for (const button of buttons.slice(1)) {
      expect(button.closest('[data-question]')).not.toBeNull();
    }

    // Its own compiled styles, not the page: those tags come and go with other specs' fixtures.
    const css = ((KometaConfirm as unknown as { ɵcmp?: { styles?: string[] } }).ɵcmp?.styles ?? []).join('\n').replaceAll('%NS%', '');
    expect(css).toContain('prefers-reduced-motion: reduce');
    expect(css).not.toMatch(/button[^{]*\{[^}]*background:\s*var\(--amber\)/);
  });

  it('moves focus into the pane it shows when focus was inside, and leaves it alone otherwise', async () => {
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    el.querySelector<HTMLButtonElement>('.mark')!.focus();
    fixture.componentInstance.asking.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement?.textContent).toBe("Yo'q");
    fixture.componentInstance.asking.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(el.querySelector('.mark'));

    (document.activeElement as HTMLElement).blur();
    fixture.componentInstance.asking.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(document.body);
    fixture.nativeElement.remove();
  });
});
