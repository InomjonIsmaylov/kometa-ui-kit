import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaErase } from './kometa-erase';
import { KometaHalo } from './kometa-halo';
import { KometaPair } from './kometa-pair';
import { KometaWord } from './kometa-word';

@Component({
  imports: [KometaWord, KometaErase, KometaHalo, KometaPair],
  template: `
    <button kometa-word lead [busy]="busy()" (click)="hits.set(hits() + 1)">Add</button>
    <button kometa-word quiet>Nudge</button>
    <button kometa-erase>Delete service</button>
    <button kometa-halo aria-label="Close">x</button>
    <kometa-pair keep="Keep it" confirm="Delete" [busy]="busy()" (kept)="kept.set(kept() + 1)" (confirmed)="gone.set(gone() + 1)" />
  `,
})
class Host {
  busy = signal(false);
  hits = signal(0);
  kept = signal(0);
  gone = signal(0);
}

describe('the round 11 buttons', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const q = (s: string) => f.nativeElement.querySelector(s) as HTMLButtonElement;
    return { f, q };
  }

  it('stay real buttons, so type, disabled and click are the browser\'s own', () => {
    const { q } = render();
    for (const s of ['[lead]', '[kometa-word]', '[kometa-erase]', '[kometa-halo]']) {
      expect(q(s).tagName).toBe('BUTTON');
    }
    q('[lead]').click();
    expect(q('[lead]').textContent?.trim()).toBe('Add');
  });

  it('the line button marks itself busy for assistive tech and clears again', () => {
    const { f, q } = render();
    expect(q('[lead]').getAttribute('aria-busy')).toBeNull();
    f.componentInstance.busy.set(true);
    f.detectChanges();
    expect(q('[lead]').getAttribute('aria-busy')).toBe('true');
    expect(q('[lead]').classList.contains('busy')).toBe(true);
    f.componentInstance.busy.set(false);
    f.detectChanges();
    expect(q('[lead]').getAttribute('aria-busy')).toBeNull();
  });

  it('the word button takes quiet as a plain attribute', () => {
    const { q } = render();
    expect(q('[kometa-word][quiet]').classList.contains('quiet')).toBe(true);
  });

  it('the pair emits kept and confirmed, with the caller\'s words', () => {
    const { f, q } = render();
    const [keep, go] = Array.from(f.nativeElement.querySelectorAll('kometa-pair button')) as HTMLButtonElement[];
    expect(keep.textContent?.trim()).toBe('Keep it');
    expect(go.textContent?.trim()).toBe('Delete');
    keep.click();
    go.click();
    expect(f.componentInstance.kept()).toBe(1);
    expect(f.componentInstance.gone()).toBe(1);
    expect(q('kometa-pair')).not.toBeNull();
  });

  it('while the pair is busy the red button spins and the quiet one locks', () => {
    const { f } = render();
    f.componentInstance.busy.set(true);
    f.detectChanges();
    const [keep, go] = Array.from(f.nativeElement.querySelectorAll('kometa-pair button')) as HTMLButtonElement[];
    expect(keep.disabled).toBe(true);
    expect(go.classList.contains('busy')).toBe(true);
    expect(go.getAttribute('aria-busy')).toBe('true');
  });
});
