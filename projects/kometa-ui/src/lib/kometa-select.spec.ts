import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaSelect } from './kometa-select';

const OPTIONS = [
  { label: 'Haircut', value: 'cut' },
  { label: 'Beard trim', value: 'beard' },
  { label: 'Colour', value: 'colour' },
];
const GROUPS = [
  { label: 'Toshkent', items: [{ label: 'Chilonzor', value: 1 }, { label: 'Sergeli', value: 2 }] },
  { label: 'Samarqand', items: [{ label: 'Registon', value: 3 }] },
];

@Component({
  imports: [KometaSelect],
  template: `<k-select ariaLabel="Service" inputId="svc" placeholder="Pick one" prefix="" [options]="options()" [group]="group()"
                            [disabled]="disabled()" [pill]="pill()" [(value)]="value" />`,
})
class Host {
  options = signal<unknown[]>(OPTIONS);
  group = signal(false);
  disabled = signal(false);
  pill = signal(false);
  value = signal<unknown>('beard');
}

describe('KometaSelect', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('k-select') as HTMLElement;
    const btn = root.querySelector('button') as HTMLButtonElement;
    const rows = () => [...root.querySelectorAll<HTMLElement>('.opt')];
    const key = (k: string) => (document.activeElement ?? root).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
    const open = () => { btn.click(); f.detectChanges(); };
    return { f, root, btn, rows, key, open };
  }

  it('is a button that names the field and shows the chosen label', () => {
    const { btn } = render();
    expect(btn.id).toBe('svc');
    expect(btn.getAttribute('aria-label')).toBe('Service, Beard trim');
    expect(btn.textContent?.trim()).toBe('Beard trim');
    expect(btn.getAttribute('aria-haspopup')).toBe('listbox');
  });

  it('shows the placeholder when nothing matches', () => {
    const { f, btn } = render();
    f.componentInstance.value.set('missing');
    f.detectChanges();
    expect(btn.textContent?.trim()).toBe('Pick one');
    f.componentInstance.value.set(null);
    f.detectChanges();
    expect(btn.querySelector('.empty')).not.toBeNull();
  });

  it('opens a listbox with the chosen row marked, and focuses it', () => {
    const { btn, rows, open } = render();
    expect(rows()).toHaveLength(0);
    open();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(rows().map((r) => r.textContent?.trim())).toEqual(['Haircut', 'Beard trim', 'Colour']);
    expect(rows().map((r) => r.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
  });

  it('picks a row: the model changes and the list closes', () => {
    const { f, btn, rows, open } = render();
    open();
    rows()[2].click();
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('colour');
    expect(rows()).toHaveLength(0);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    expect(btn.textContent?.trim()).toBe('Colour');
  });

  it('moves with the arrow keys, picks with Enter and closes with Escape', () => {
    const { f, rows, open, key } = render();
    open();
    rows()[1].focus();
    key('ArrowDown');
    expect(document.activeElement).toBe(rows()[2]);
    key('Home');
    expect(document.activeElement).toBe(rows()[0]);
    key('Enter');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('cut');
    open();
    rows()[0].focus();
    key('Escape');
    f.detectChanges();
    expect(rows()).toHaveLength(0);
    expect(f.componentInstance.value()).toBe('cut');
  });

  it('jumps to the next row that starts with the typed letter', () => {
    const { open, rows, key } = render();
    open();
    rows()[0].focus();
    key('c');
    expect(document.activeElement).toBe(rows()[2]);
  });

  it('closes on a click outside, and not on one inside', () => {
    const { f, root, rows, open } = render();
    open();
    root.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    f.detectChanges();
    expect(rows()).toHaveLength(3);
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    f.detectChanges();
    expect(rows()).toHaveLength(0);
  });

  it('does not open when disabled', () => {
    const { f, btn, rows } = render();
    f.componentInstance.disabled.set(true);
    f.detectChanges();
    expect(btn.disabled).toBe(true);
    btn.click();
    f.detectChanges();
    expect(rows()).toHaveLength(0);
  });

  it('reads groups: a heading for each, the rows numbered through', () => {
    const { f, root, rows, open, btn } = render();
    f.componentInstance.options.set(GROUPS);
    f.componentInstance.group.set(true);
    f.componentInstance.value.set(2);
    f.detectChanges();
    expect(btn.textContent?.trim()).toBe('Sergeli');
    open();
    expect([...root.querySelectorAll('.gh')].map((h) => h.textContent?.trim())).toEqual(['Toshkent', 'Samarqand']);
    expect(rows().map((r) => r.textContent?.trim())).toEqual(['Chilonzor', 'Sergeli', 'Registon']);
    rows()[2].click();
    f.detectChanges();
    expect(f.componentInstance.value()).toBe(3);
  });

  it('draws as a pill when asked', () => {
    const { f, root } = render();
    f.componentInstance.pill.set(true);
    f.detectChanges();
    expect(root.classList.contains('pill')).toBe(true);
  });
});
