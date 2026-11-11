# kometa-ui

> Angular 22 UI kit: standalone, OnPush, signal-based components with the `k-` selector prefix, themed
> by CSS custom properties, light and dark. No PrimeNG, Material or Tailwind dependency.

This guide is for AI coding agents building an app with `kometa-ui`. The per-component reference
(selectors, inputs, outputs, types, defaults) is `components.md` next to this file, generated from the
source. Live docs: https://inomjonismaylov.github.io/kometa-ui-kit/ (one page per component, `#button`, `#drawer`...).

## Setup (all three steps are required)

```bash
npm install kometa-ui
```

```ts
// app.config.ts
import { provideKometaUi } from 'kometa-ui';
export const appConfig: ApplicationConfig = { providers: [provideKometaUi()] };
```

```scss
// styles.scss: `layers` MUST be the first @use, or component styles lose to the app's.
@use 'kometa-ui/styles/layers';
@use 'kometa-ui/styles/base'; // tokens, fonts and base primitives
```

Tailwind v4: also `@import 'kometa-ui/styles/kometa-theme.css';` to map the tokens to utilities.

## Using components

- Import each class from its entry point, `kometa-ui/<name>` (the file name without `kometa-`):
  `import { KometaButton } from 'kometa-ui/button'; import { KometaDrawer } from 'kometa-ui/drawer';`.
  `from 'kometa-ui'` re-exports them all and works, but it puts every kit component any lazy route uses into the
  app's initial chunk.
  then list them in the standalone component's `imports: [...]`.
- Find the class for a selector in `components.md` (`<k-button>` is `KometaButton`, `button[k-halo]` is `KometaHalo`).
- Inputs are signal inputs: bind them with `[label]="x"` or a static `label="Save"`. Boolean inputs take a bare attribute: `<k-button outlined fluid />`.
- `model` inputs are two-way: `<k-toggle [(checked)]="on" />`, `<k-select [(value)]="city" [options]="cities" />`.
- Forms: components marked "A Signal Forms control" in `components.md` bind with `[formField]="form.name"`
  (`@angular/forms/signals`); those marked "Works with Angular forms" take `formControl` / `formControlName` / `ngModel`.
  The rest bind through their `model`.
- Output names are the library's own, not DOM names: `<k-button (clicked)="save()">`, `<k-drawer (closing)="...">`. Check `components.md` before guessing.
- Read the component's doc comment in `components.md` (or its `.d.ts` in `node_modules/kometa-ui`) before using an input you have not seen; inputs are often unions like `'secondary' | 'danger' | null`.

## Services and app-wide pieces

- Confirm dialogs: put exactly one `<k-tray />` in the root component, then
  `inject(KometaConfirmationService).confirm({ header, message, acceptLabel, rejectLabel, acceptButtonProps: { severity: 'danger' }, accept, reject })`.
- Toasts: `<k-toast [items]="toasts()" (dismiss)="remove($event)" />`; you own the `KometaToastItem[]` list.
- Theme: `inject(ThemeService).set('light' | 'dark' | 'system')`; it writes `data-theme` on `<html>`. Without it the
  system preference wins, dark when the system says nothing.
- `k-tabbar` tabs with `link` and `k-row` with `link` use the router, so the app needs `provideRouter(...)`.

## Styling and theming

- Colours, type and radii come from CSS custom properties: `--bg`, `--card`, `--text`, `--text2`, `--muted`,
  `--border`, `--amber` (the accent), `--amber-ink`, `--on-amber`, `--red`, `--green`, `--blue`, `--violet`,
  `--r-pill`, `--r-card`, `--font-sans`, `--font-mono`. Set one on any element to restyle everything inside it.
- Most components expose their own knobs (e.g. `--kbtn-radius`); see the "Customizing" example on each docs page.
- Component styles are wrapped in `:where()`, so a plain class selector in app CSS overrides them. Do not use
  `::ng-deep`, `!important` or copy component CSS; write a normal rule or set a custom property.
- `k-button`, `k-drawer` and `k-digits` take `styleClass` to put a class on their inner element.
- Overlays (drawer, pop, menu, toast...) take `animation`: a preset name from `KOMETA_ANIMATIONS`, `'none'`, or
  your own `"in out"` keyframe names, which must be defined in global CSS (component-scoped `@keyframes` get renamed).
  `[kAnimate]` animates any element on enter or when scrolled into view.

## Design rules the kit assumes

- One amber (primary) action per screen: the next step the user should take. Use `severity="secondary"` or
  `text` for the rest.
- The look is dense: 11-13px body text, pill-shaped controls, mono numerals for times and prices.
- Prefer a kit component over a native element or a hand-built one (`k-select` over `<select>`, `k-toggle` over a
  checkbox switch, `k-drawer` for sheets and side panels).

## Do not

- Do not install PrimeNG, Angular Material or another UI kit to fill a gap; check `components.md` first.
- Do not import from `kometa-ui/lib/...` or `kometa-ui/src/...`; `'kometa-ui'`, `kometa-ui/<entry>` and `kometa-ui/styles/*` are public.
- Do not skip `@use 'kometa-ui/styles/layers'` or move it below another `@use`.
