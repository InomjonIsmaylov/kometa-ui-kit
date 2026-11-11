import { Component, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideKometaUi } from 'kometa-ui';
import { KometaDrawer } from './kometa-drawer';

@Component({ template: '' })
class Today {}

@Component({
  imports: [KometaDrawer],
  template: `
    <k-drawer
      [visible]="open()"
      styleClass="kometa-sheet"
      (visibleChange)="onVisible($event)" />
  `,
})
class SheetHost {
  readonly open = signal(false);
  readonly closed = output<void>();

  onVisible(next: boolean): void {
    this.open.set(next);
    if (!next) this.closed.emit();
  }
}

describe('a kometa-sheet drawer and browser back', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function openSheet() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SheetHost],
      providers: [provideKometaUi(), provideRouter([{ path: 'today', component: Today }])],
    });
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/today');
    const fixture = TestBed.createComponent(SheetHost);
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    fixture.detectChanges();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, router, closed };
  }

  it('closes the drawer on popstate instead of changing the route', async () => {
    const { fixture, router, closed } = await openSheet();
    const back = vi.spyOn(history, 'back');

    window.dispatchEvent(new PopStateEvent('popstate'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(closed).toHaveBeenCalled();
    expect(router.url).toBe('/today');
    expect(back).not.toHaveBeenCalled();
  });

  it('pops the history entry on a programmatic close while that entry is current', async () => {
    const { fixture } = await openSheet();
    const back = vi.spyOn(history, 'back').mockImplementation(() => {});

    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(back).toHaveBeenCalledTimes(1);
  });

  it('pops the history entry when the sheet is destroyed while that entry is current', async () => {
    const { fixture } = await openSheet();
    const back = vi.spyOn(history, 'back').mockImplementation(() => {});

    fixture.destroy();

    expect(back).toHaveBeenCalledTimes(1);
  });

  it('does not pop when the sheet entry is no longer current', async () => {
    const { fixture } = await openSheet();
    const back = vi.spyOn(history, 'back').mockImplementation(() => {});
    history.replaceState({}, '');

    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(back).not.toHaveBeenCalled();
  });
});

@Component({
  imports: [KometaDrawer],
  template: `
    @if (withOpener()) {
      <button type="button" id="opener" (click)="open.set(true)">Open</button>
    }
    <k-drawer [visible]="open()" styleClass="kometa-sheet" (visibleChange)="open.set($event)">
      @if (withHeading) {
        <h2>Title</h2>
      }
      <input id="first-field" />
    </k-drawer>
  `,
})
class FocusHost {
  readonly open = signal(false);
  readonly withOpener = signal(true);
  withHeading = true;
}

@Component({
  imports: [KometaDrawer],
  template: `
    <k-drawer [visible]="open()" styleClass="kometa-sheet" (visibleChange)="open.set($event)">
      <h2 id="own-title">Title</h2>
    </k-drawer>
  `,
})
class NamedHost {
  readonly open = signal(false);
}

/** The pay drawer: "loading" with nothing focusable, then a state that brings its heading. */
@Component({
  imports: [KometaDrawer],
  template: `
    <k-drawer [visible]="open()" styleClass="kometa-sheet" (visibleChange)="open.set($event)">
      @if (ready()) { <h2>Late</h2> } @else { <p>Loading</p> }
    </k-drawer>
  `,
})
class LateHost {
  readonly open = signal(false);
  readonly ready = signal(false);
}

describe('a kometa-sheet drawer and focus', () => {
  async function setup(withHeading = true) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [FocusHost], providers: [provideKometaUi()] });
    const fixture = TestBed.createComponent(FocusHost);
    fixture.componentInstance.withHeading = withHeading;
    fixture.detectChanges();
    const opener = document.getElementById('opener')!;
    opener.focus();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, opener };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('moves focus to the sheet heading on show ', async () => {
    vi.spyOn(history, 'back').mockImplementation(() => {});
    await setup();
    const heading = document.body.querySelector<HTMLElement>('.kometa-sheet .kdrawer-content h2')!;
    expect(document.activeElement).toBe(heading);
    expect(heading.getAttribute('tabindex')).toBe('-1');
  });

  it('makes the sheet a modal dialog named by its heading', async () => {
    vi.spyOn(history, 'back').mockImplementation(() => {});
    await setup();
    const root = document.body.querySelector<HTMLElement>('.kdrawer.kometa-sheet')!;
    const heading = root.querySelector<HTMLElement>('.kdrawer-content h2')!;
    expect(root.getAttribute('role')).toBe('dialog');
    expect(root.getAttribute('aria-modal')).toBe('true');
    expect(heading.id).not.toBe('');
    expect(root.getAttribute('aria-labelledby')).toBe(heading.id);
  });

  it('keeps the id a heading already has', async () => {
    vi.spyOn(history, 'back').mockImplementation(() => {});
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [NamedHost], providers: [provideKometaUi()] });
    const fixture = TestBed.createComponent(NamedHost);
    fixture.detectChanges();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = document.body.querySelector<HTMLElement>('.kdrawer.kometa-sheet')!;
    expect(root.getAttribute('aria-labelledby')).toBe('own-title');
    expect(document.getElementById('own-title')).not.toBeNull();
  });

  it('is a dialog without a name when the sheet has no h2', async () => {
    vi.spyOn(history, 'back').mockImplementation(() => {});
    await setup(false);
    const root = document.body.querySelector<HTMLElement>('.kdrawer.kometa-sheet')!;
    expect(root.getAttribute('role')).toBe('dialog');
    expect(root.hasAttribute('aria-labelledby')).toBe(false);
  });

  it('names and focuses a heading that arrives after the sheet has shown', async () => {
    vi.spyOn(history, 'back').mockImplementation(() => {});
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [LateHost], providers: [provideKometaUi()] });
    const fixture = TestBed.createComponent(LateHost);
    fixture.detectChanges();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = document.body.querySelector<HTMLElement>('.kdrawer.kometa-sheet')!;
    expect(root.hasAttribute('aria-labelledby')).toBe(false);

    fixture.componentInstance.ready.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const heading = root.querySelector<HTMLElement>('.kdrawer-content h2')!;
    expect(root.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(document.activeElement).toBe(heading);
  });

  it('falls back to the first focusable control when the sheet has no h2', async () => {
    vi.spyOn(history, 'back').mockImplementation(() => {});
    await setup(false);
    expect(document.activeElement?.id).toBe('first-field');
  });

  it('hands focus back to the opener on close', async () => {
    vi.spyOn(history, 'back').mockImplementation(() => {});
    const { fixture, opener } = await setup();
    document.getElementById('first-field')!.focus();
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(opener);
  });

  it('hands focus back to the opener when the sheet is destroyed', async () => {
    vi.spyOn(history, 'back').mockImplementation(() => {});
    const { fixture, opener } = await setup();
    document.getElementById('first-field')!.focus();
    fixture.destroy();
    expect(document.activeElement).toBe(opener);
  });

  it('leaves focus alone when the opener has left the DOM', async () => {
    vi.spyOn(history, 'back').mockImplementation(() => {});
    const { fixture, opener } = await setup();
    const focus = vi.spyOn(opener, 'focus');
    fixture.componentInstance.withOpener.set(false);
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(focus).not.toHaveBeenCalled();
  });
});

@Component({
  imports: [KometaDrawer],
  template: `
    <k-drawer [visible]="open()" [dismissible]="dismissible()" ariaLabel="Named" position="bottom" (visibleChange)="open.set($event)"
                   (kometaSheetClosed)="gone.set(gone() + 1)" (opened)="shown.set(shown() + 1)">
      <h2>Title</h2>
    </k-drawer>
  `,
})
class DismissHost {
  readonly open = signal(true);
  readonly dismissible = signal(true);
  readonly gone = signal(0);
  readonly shown = signal(0);
}

@Component({
  imports: [KometaDrawer],
  template: `
    <k-drawer [visible]="true" [style]="{ width: '321px' }">
      <ng-template #headless><div class="mine">own head</div></ng-template>
    </k-drawer>
  `,
})
class HeadlessHost {}

describe('k-drawer on the native dialog', () => {
  async function mount() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [DismissHost], providers: [provideKometaUi()] });
    const f = TestBed.createComponent(DismissHost);
    f.detectChanges();
    await f.whenStable();
    const dlg = f.nativeElement.querySelector('dialog') as HTMLDialogElement;
    return { f, dlg };
  }

  it('opens, says so once, and carries the position class and the name', async () => {
    const { f, dlg } = await mount();
    expect(dlg.open).toBe(true);
    expect(f.componentInstance.shown()).toBe(1);
    expect(dlg.classList.contains('kdrawer-bottom')).toBe(true);
    expect(dlg.getAttribute('aria-label')).toBe('Named');
  });

  it('Escape (the cancel event) is refused to the browser and closes it when dismissable', async () => {
    const { f, dlg } = await mount();
    const e = new Event('cancel', { cancelable: true });
    dlg.dispatchEvent(e);
    await f.whenStable();
    expect(e.defaultPrevented).toBe(true);
    expect(f.componentInstance.open()).toBe(false);
  });

  it('a click on the dark area closes it; a click inside does not', async () => {
    const { f, dlg } = await mount();
    (dlg.querySelector('h2') as HTMLElement).click();
    await f.whenStable();
    expect(f.componentInstance.open()).toBe(true);
    dlg.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await f.whenStable();
    expect(f.componentInstance.open()).toBe(false);
  });

  it('not dismissable: the dark area does nothing, Escape (its own switch) still closes', async () => {
    const { f, dlg } = await mount();
    f.componentInstance.dismissible.set(false);
    f.detectChanges();
    dlg.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await f.whenStable();
    expect(f.componentInstance.open()).toBe(true);
    dlg.dispatchEvent(new Event('cancel', { cancelable: true }));
    await f.whenStable();
    expect(f.componentInstance.open()).toBe(false);
  });

  it('reports kometaSheetClosed and drops the dialog once the leave is over', async () => {
    const { f } = await mount();
    f.componentInstance.open.set(false);
    f.detectChanges();
    await vi.waitFor(() => expect(f.componentInstance.gone()).toBe(1), { timeout: 2000 });
    f.detectChanges();
    expect(f.nativeElement.querySelector('dialog')).toBeNull();
  });

  it('a headless template replaces the content box and takes the given width', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [HeadlessHost], providers: [provideKometaUi()] });
    const f = TestBed.createComponent(HeadlessHost);
    f.detectChanges();
    await f.whenStable();
    const dlg = f.nativeElement.querySelector('dialog') as HTMLDialogElement;
    expect(dlg.querySelector('.mine')?.textContent).toBe('own head');
    expect(dlg.style.width).toBe('321px');
  });
});
