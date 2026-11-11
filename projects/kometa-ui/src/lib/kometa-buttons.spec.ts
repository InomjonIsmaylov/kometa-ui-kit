import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaErase } from 'kometa-ui/erase';
import { KometaHalo } from 'kometa-ui/halo';
import { KometaPair } from 'kometa-ui/pair';
import { KometaWord } from 'kometa-ui/word';

@Component({
  imports: [KometaWord, KometaErase, KometaHalo, KometaPair],
  template: `
    <button k-word lead [busy]="busy()" (click)="hits.set(hits() + 1)">Add</button>
    <button k-word quiet>Nudge</button>
    <button k-erase>Delete service</button>
    <button k-halo aria-label="Close">x</button>
    <k-pair keep="Keep it" confirm="Delete" [busy]="busy()" (kept)="kept.set(kept() + 1)" (confirmed)="gone.set(gone() + 1)" />
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
    for (const s of ['[lead]', '[k-word]', '[k-erase]', '[k-halo]']) {
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
    expect(q('[k-word][quiet]').classList.contains('quiet')).toBe(true);
  });

  it('the pair emits kept and confirmed, with the caller\'s words', () => {
    const { f, q } = render();
    const [keep, go] = Array.from(f.nativeElement.querySelectorAll('k-pair button')) as HTMLButtonElement[];
    expect(keep.textContent?.trim()).toBe('Keep it');
    expect(go.textContent?.trim()).toBe('Delete');
    keep.click();
    go.click();
    expect(f.componentInstance.kept()).toBe(1);
    expect(f.componentInstance.gone()).toBe(1);
    expect(q('k-pair')).not.toBeNull();
  });

  it('while the pair is busy the red button spins and the quiet one locks', () => {
    const { f } = render();
    f.componentInstance.busy.set(true);
    f.detectChanges();
    const [keep, go] = Array.from(f.nativeElement.querySelectorAll('k-pair button')) as HTMLButtonElement[];
    expect(keep.disabled).toBe(true);
    expect(go.classList.contains('busy')).toBe(true);
    expect(go.getAttribute('aria-busy')).toBe('true');
  });
});

@Component({
  imports: [KometaPair],
  template: `<k-pair keep="Back" confirm="Save" tone="primary" [busy]="busy()" [confirmDisabled]="invalid()"
    (kept)="kept.set(kept() + 1)" (confirmed)="saved.set(saved() + 1)" />`,
})
class PairHost {
  busy = signal(false);
  invalid = signal(true);
  kept = signal(0);
  saved = signal(0);
}

describe('KometaPair confirmDisabled and busy', () => {
  function render() {
    const f = TestBed.createComponent(PairHost);
    f.detectChanges();
    const [keep, go] = Array.from(f.nativeElement.querySelectorAll('k-pair button')) as HTMLButtonElement[];
    return { f, keep, go };
  }

  it('confirmDisabled greys out only the confirm button', () => {
    const { f, keep, go } = render();
    expect(go.disabled).toBe(true);
    expect(keep.disabled).toBe(false);
    keep.click();
    expect(f.componentInstance.kept()).toBe(1);
  });

  it('busy disables the confirm button, so a second tap cannot confirm again', () => {
    const { f, go } = render();
    f.componentInstance.invalid.set(false);
    f.componentInstance.busy.set(true);
    f.detectChanges();
    expect(go.disabled).toBe(true);
    go.click();
    expect(f.componentInstance.saved()).toBe(0);
  });
});
