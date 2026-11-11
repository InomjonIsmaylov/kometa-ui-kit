import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { KometaRow, KometaRows } from './kometa-rows';

@Component({
  imports: [KometaRows, KometaRow],
  template: `
    <kometa-rows label="Visit" id="facts">
      <kometa-row label="Service">Haircut</kometa-row>
      <kometa-row label="Time">Mon · <span class="num">14:00</span></kometa-row>
    </kometa-rows>
    <kometa-rows ariaLabel="Settings" id="list">
      <kometa-row title="Edit" meta="Name and address" tone="amber" link="/profile/edit"><svg rowIcon></svg></kometa-row>
      <kometa-row title="Help" href="/help.html"><span class="val">3</span></kometa-row>
      <kometa-row title="Out" tone="danger" button [disabled]="busy()" (activated)="taps.update(n => n + 1)"><svg rowIcon></svg></kometa-row>
      <kometa-row title="Theme"><button class="own" type="button">Dark</button></kometa-row>
    </kometa-rows>
  `,
})
class Host {
  busy = signal(false);
  taps = signal(0);
}

describe('KometaRows', () => {
  function render() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('draws a labelled list panel with a hairline between rows', () => {
    const { el } = render();
    const panel = el.querySelector('#facts .panel') as HTMLElement;
    expect(panel.getAttribute('role')).toBe('list');
    expect(panel.getAttribute('aria-labelledby')).toBe(el.querySelector('#facts .cap')!.id);
    expect(el.querySelector('#facts .cap')!.textContent).toBe('Visit');
    expect(getComputedStyle(panel).borderRadius).toBe('20px');
    const rows = el.querySelectorAll('#facts kometa-row');
    expect(rows[0].getAttribute('role')).toBe('listitem');
    // jsdom draws no pseudo-elements: the hairline is the rule on every row but the first.
    const css = [...document.querySelectorAll('style')].map((n) => n.textContent).join('');
    expect(css).toMatch(/kometa-row:not\(:first-child\)::before\s*\{[^}]*left: 16px;[^}]*height: 1px;[^}]*var\(--glass-line/);
    expect(rows).toHaveLength(2);
  });

  it('names an unlabelled panel with aria-label and no heading', () => {
    const { el } = render();
    expect(el.querySelector('#list .cap')).toBeNull();
    expect(el.querySelector('#list .panel')!.getAttribute('aria-label')).toBe('Settings');
  });

  it('makes a fact a term and a definition, the value right-aligned', () => {
    const { el } = render();
    const row = el.querySelector('#facts kometa-row')!;
    expect(row.querySelector('.t')!.getAttribute('role')).toBe('term');
    const value = row.querySelector('.end') as HTMLElement;
    expect(value.getAttribute('role')).toBe('definition');
    expect(value.textContent).toBe('Haircut');
    expect(getComputedStyle(value).textAlign).toBe('end');
    expect(el.querySelector('#facts .num')!.textContent).toBe('14:00');
  });

  it('makes a link row one anchor with the title, tile, meta and a chevron', () => {
    const { el } = render();
    const a = el.querySelector('#list a.r[href="/profile/edit"]') as HTMLElement;
    expect(a.querySelector('.t')!.textContent).toBe('Edit');
    expect(a.querySelector('.m')!.textContent).toBe('Name and address');
    expect(a.querySelector('.ico svg')).not.toBeNull();
    expect(a.querySelector('.chev')).not.toBeNull();
    expect(a.closest('kometa-row')!.getAttribute('data-tone')).toBe('amber');
    expect(parseFloat(getComputedStyle(a).minHeight)).toBeGreaterThanOrEqual(44);
  });

  it('draws a plain href row, with its trailing value before the chevron', () => {
    const { el } = render();
    const a = el.querySelector('#list a.r[href="/help.html"]') as HTMLElement;
    expect(a.querySelector('.end .val')!.textContent).toBe('3');
    expect(a.querySelector('.end')!.nextElementSibling!.classList.contains('chev')).toBe(true);
  });

  it('emits activated from a button row, and a disabled one does not', () => {
    const { fixture, el } = render();
    const b = el.querySelector('#list button.r') as HTMLButtonElement;
    expect(b.closest('kometa-row')!.classList.contains('danger')).toBe(true);
    b.click();
    expect(fixture.componentInstance.taps()).toBe(1);
    fixture.componentInstance.busy.set(true);
    fixture.detectChanges();
    expect(b.disabled).toBe(true);
    b.click();
    expect(fixture.componentInstance.taps()).toBe(1);
  });

  it('keeps a static row free of links, chevron and wash so it can hold its own control', () => {
    const { el } = render();
    const row = el.querySelector('#list .own')!.closest('kometa-row')!;
    expect(row.querySelector('a, .chev')).toBeNull();
    expect(row.classList.contains('act')).toBe(false);
    expect(row.querySelector('.r')!.tagName).toBe('DIV');
  });
});
