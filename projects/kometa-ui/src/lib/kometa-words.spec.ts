import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KometaWords } from './kometa-words';

@Component({
  imports: [KometaWords],
  template: `<k-words [options]="options()" [(value)]="value" [ariaLabel]="ariaLabel()" />`,
})
class Host {
  options = signal([
    { value: 'uz', label: 'Oʻzbekcha' },
    { value: 'ru', label: 'Русский' },
    { value: 'en', label: 'English' },
  ]);
  value = signal('');
  ariaLabel = signal('Til');
}

describe('KometaWords', () => {
  function render() {
    const f = TestBed.createComponent(Host);
    f.detectChanges();
    const root = f.nativeElement.querySelector('k-words') as HTMLElement;
    const buttons = [...root.querySelectorAll('button')] as HTMLButtonElement[];
    return { f, root, buttons };
  }

  it('renders a button per option and names the group', () => {
    const { root, buttons } = render();
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Oʻzbekcha', 'Русский', 'English']);
    expect(root.getAttribute('aria-label') ?? root.querySelector('[aria-label]')?.getAttribute('aria-label')).toBe('Til');
    expect(buttons.every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true);
  });

  it('presses the selected value', () => {
    const { f, buttons } = render();
    f.componentInstance.value.set('ru');
    f.detectChanges();
    expect(buttons[0].getAttribute('aria-pressed')).toBe('false');
    expect(buttons[1].getAttribute('aria-pressed')).toBe('true');
    expect(buttons[2].getAttribute('aria-pressed')).toBe('false');
  });

  it('sets the value when a word is clicked', () => {
    const { f, buttons } = render();
    buttons[2].click();
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('en');
    expect(buttons[2].getAttribute('aria-pressed')).toBe('true');
  });

  it('slides the cream line under the pressed word on click', () => {
    const { f, root, buttons } = render();
    stubBox(buttons[1], 48, 36);
    buttons[1].click();
    f.detectChanges();
    const line = root.querySelector('.line') as HTMLElement;
    expect(line.style.transform).toContain('48');
    expect(line.style.width).toBe('36px');
  });

  it('measures the pressed word again on render', () => {
    const { f, root, buttons } = render();
    f.componentInstance.value.set('en');
    f.detectChanges();
    stubBox(buttons[2], 90, 52);
    f.componentInstance.options.set([...f.componentInstance.options()]);
    f.detectChanges();
    const line = root.querySelector('.line') as HTMLElement;
    expect(line.style.transform).toContain('90');
    expect(line.style.width).toBe('52px');
  });

  it('draws each word through the option template when one is given', () => {
    @Component({
      imports: [KometaWords],
      template: `
        <k-words [options]="options" [(value)]="value" [optionTemplate]="word" />
        <ng-template #word let-opt><i class="mark"></i>{{ opt.label }}</ng-template>`,
    })
    class TemplatedHost {
      options = [{ value: 'a', label: 'Alpha' }, { value: 'b', label: 'Beta' }];
      value = signal('a');
    }
    const f = TestBed.createComponent(TemplatedHost);
    f.detectChanges();
    const buttons = [...f.nativeElement.querySelectorAll('k-words button')] as HTMLButtonElement[];
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Alpha', 'Beta']);
    expect(buttons.every((b) => b.querySelector('.mark'))).toBe(true);
  });

  it('in tabs mode speaks tablist/tab, keeps one tab stop and moves with the arrow keys', () => {
    @Component({
      imports: [KometaWords],
      template: `<k-words tabs [options]="options" [(value)]="value" ariaLabel="Tabs" />`,
    })
    class TabsHost {
      options = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }, { value: 'c', label: 'C' }];
      value = signal('a');
    }
    const f = TestBed.createComponent(TabsHost);
    f.detectChanges();
    const root = f.nativeElement.querySelector('k-words') as HTMLElement;
    const tabs = [...root.querySelectorAll('button')] as HTMLButtonElement[];
    expect(root.getAttribute('role')).toBe('tablist');
    expect(tabs.map((t) => t.getAttribute('role'))).toEqual(['tab', 'tab', 'tab']);
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
    expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual([null, '-1', '-1']);
    expect(tabs[0].hasAttribute('aria-pressed')).toBe(false);
    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('b');
    tabs[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('c');
    tabs[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    f.detectChanges();
    expect(f.componentInstance.value()).toBe('a');
    expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
  });
});

function stubBox(el: HTMLElement, left: number, width: number) {
  Object.defineProperty(el, 'offsetLeft', { configurable: true, value: left });
  Object.defineProperty(el, 'offsetWidth', { configurable: true, value: width });
}
