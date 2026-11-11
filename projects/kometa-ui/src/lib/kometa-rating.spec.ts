import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, min } from '@angular/forms/signals';
import { KometaRating } from './kometa-rating';

@Component({
  imports: [KometaRating],
  template: `
    <kometa-rating
      [(value)]="value"
      [max]="max()"
      [words]="words()"
      [ariaLabel]="'Baho'"
      [disabled]="disabled()"
      [readonly]="readonly()"
    />
  `,
})
class Host {
  rating = viewChild.required(KometaRating);
  value = signal(0);
  max = signal(5);
  words = signal(['Yomon', 'Past', 'Oʻrtacha', 'Yaxshi', 'Aʼlo']);
  disabled = signal(false);
  readonly = signal(false);
}

@Component({
  imports: [KometaRating, FormField],
  template: `<kometa-rating [formField]="f.score" ariaLabel="Baho" />`,
})
class FormsHost {
  model = signal({ score: 0 });
  f = form(this.model, (p) => {
    min(p.score, 1, { message: 'Baho kerak.' });
  });
}

describe('KometaRating', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('kometa-rating') as HTMLElement;
    const buttons = [...root.querySelectorAll('button')] as HTMLButtonElement[];
    return { f, root, buttons };
  }

  function key(el: HTMLElement, k: string) {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  }

  it('renders five numerals in a named radiogroup', () => {
    const { root, buttons } = render();
    const group = root.querySelector('[role="radiogroup"]') as HTMLElement;
    expect(group.getAttribute('aria-label')).toBe('Baho');
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['1', '2', '3', '4', '5']);
    expect(buttons.every((b) => b.getAttribute('role') === 'radio')).toBe(true);
    expect(buttons.every((b) => b.getAttribute('aria-checked') === 'false')).toBe(true);
  });

  it('draws as many numerals as max says', () => {
    const { f, root } = render();
    f.componentInstance.max.set(3);
    f.detectChanges();
    expect(root.querySelectorAll('button').length).toBe(3);
  });

  it('chooses a numeral on click and checks only that one', () => {
    const { f, buttons } = render();
    buttons[3].click();
    f.detectChanges();
    expect(f.componentInstance.value()).toBe(4);
    expect(buttons.map((b) => b.getAttribute('aria-checked'))).toEqual(['false', 'false', 'false', 'true', 'false']);
  });

  it('keeps the score when the chosen numeral is clicked again', () => {
    const { f, buttons } = render();
    buttons[1].click();
    buttons[1].click();
    f.detectChanges();
    expect(f.componentInstance.value()).toBe(2);
  });

  it('shows the caller word for the score and nothing before one is chosen', () => {
    const { f, root, buttons } = render();
    const word = root.querySelector('.word') as HTMLElement;
    expect(word.textContent?.trim()).toBe('');
    buttons[4].click();
    f.detectChanges();
    expect(word.textContent?.trim()).toBe('Aʼlo');
    f.componentInstance.words.set(['Bad', 'Poor', 'Fair', 'Good', 'Great']);
    f.detectChanges();
    expect(word.textContent?.trim()).toBe('Great');
  });

  it('names each numeral with its word so a screen reader hears both', () => {
    const { f, buttons } = render();
    expect(buttons[0].getAttribute('aria-label')).toBe('1, Yomon');
    f.componentInstance.words.set([]);
    f.detectChanges();
    expect(buttons[0].hasAttribute('aria-label')).toBe(false);
  });

  it('puts only one numeral in the tab order and moves it with the choice', () => {
    const { f, buttons } = render();
    expect(buttons.map((b) => b.tabIndex)).toEqual([0, -1, -1, -1, -1]);
    f.componentInstance.value.set(3);
    f.detectChanges();
    expect(buttons.map((b) => b.tabIndex)).toEqual([-1, -1, 0, -1, -1]);
  });

  it('moves and chooses with the arrow keys and stops at the ends', () => {
    const { f, buttons } = render();
    buttons[1].click();
    f.detectChanges();
    key(buttons[1], 'ArrowRight');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe(3);
    expect(document.activeElement).toBe(buttons[2]);
    key(buttons[2], 'ArrowLeft');
    key(buttons[1], 'ArrowUp');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe(1);
    key(buttons[0], 'ArrowLeft');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe(1);
    key(buttons[0], 'ArrowDown');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe(2);
  });

  it('jumps to the first and last with Home and End', () => {
    const { f, buttons } = render();
    buttons[2].click();
    key(buttons[2], 'End');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe(5);
    expect(document.activeElement).toBe(buttons[4]);
    key(buttons[4], 'Home');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe(1);
  });

  it('ignores other keys', () => {
    const { f, buttons } = render();
    buttons[1].click();
    key(buttons[1], 'a');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe(2);
  });

  it('does nothing when disabled', () => {
    const { f, root, buttons } = render();
    f.componentInstance.disabled.set(true);
    f.detectChanges();
    expect(buttons.every((b) => b.disabled)).toBe(true);
    expect((root.querySelector('[role="radiogroup"]') as HTMLElement).getAttribute('aria-disabled')).toBe('true');
    key(buttons[0], 'ArrowRight');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe(0);
  });

  it('shows a score but takes none when readonly', () => {
    const { f, root, buttons } = render();
    f.componentInstance.value.set(4);
    f.componentInstance.readonly.set(true);
    f.detectChanges();
    buttons[0].click();
    key(buttons[3], 'End');
    f.detectChanges();
    expect(f.componentInstance.value()).toBe(4);
    expect(buttons[3].getAttribute('aria-checked')).toBe('true');
    expect((root.querySelector('[role="radiogroup"]') as HTMLElement).getAttribute('aria-readonly')).toBe('true');
  });

  it('forwards focus() to the chosen numeral or the first', () => {
    const { f, buttons } = render();
    f.componentInstance.rating().focus();
    expect(document.activeElement).toBe(buttons[0]);
    f.componentInstance.value.set(4);
    f.detectChanges();
    f.componentInstance.rating().focus();
    expect(document.activeElement).toBe(buttons[3]);
  });

  it('emits touch when a numeral loses focus', () => {
    const { f, buttons } = render();
    let n = 0;
    f.componentInstance.rating().touch.subscribe(() => n++);
    buttons[0].dispatchEvent(new Event('blur'));
    expect(n).toBe(1);
  });

  it('draws a Syne 26px numeral with a 5px bead and an 18px word', () => {
    const css = stylesheet(KometaRating);
    expect(css).toContain('font-family: var(--font-display, Syne, sans-serif)');
    expect(css).toContain('var(--rating-size, 26px)');
    expect(css).toContain('width: 5px');
    expect(css).toContain('var(--rating-word-size, 18px)');
    expect(css).toContain('var(--muted)');
    expect(css).toContain('--drawer-ease');
  });

  it('removes its transitions under reduced motion and gives a coarse pointer 44px', () => {
    const css = stylesheet(KometaRating);
    expect(css).toMatch(/prefers-reduced-motion: reduce\) \{[^}]*transition: none/);
    expect(css).toMatch(/pointer: coarse\) \{[^}]*min-height: 44px/);
    expect(css).toContain('outline: 2px solid var(--amber)');
  });

  it('uses tokens rather than colour literals', () => {
    const css = stylesheet(KometaRating);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgba?\(/);
  });
});

describe('KometaRating inside Signal Forms', () => {
  it('binds the number both ways through [formField]', async () => {
    const f = TestBed.createComponent(FormsHost);
    f.detectChanges();
    const buttons = [...(f.nativeElement as HTMLElement).querySelectorAll('button')] as HTMLButtonElement[];
    buttons[2].click();
    await f.whenStable();
    expect(f.componentInstance.model().score).toBe(3);
    f.componentInstance.model.set({ score: 5 });
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
    expect(buttons[4].getAttribute('aria-checked')).toBe('true');
  });
});

function stylesheet(component: unknown): string {
  const styles = (component as { ɵcmp?: { styles?: string[] | string } }).ɵcmp?.styles;
  const css = styles == null ? '' : Array.isArray(styles) ? styles.join('\n') : String(styles);
  // The compiler scopes selectors and namespaces tokens; undo that so the assertions read like the source.
  return css.replace(/%NS%/g, '').replace(/\[_ng(?:content|host)-%COMP%\]/g, '').replace(/["']/g, '').replace(/\s+/g, ' ');
}

/** Colour literals that are not the fallback inside a `var(--x, ...)`. */
function literalColours(css: string): string[] {
  const noFallbacks = css.replace(/var\(--[\w-]+,\s*[^()]*(\([^()]*\)[^()]*)*\)/g, '');
  return noFallbacks.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) ?? [];
}
