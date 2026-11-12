# Accessibility

This page says what `kometa-ui` does for accessibility today, read from the component source in
`projects/kometa-ui/<entry>/kometa-<entry>.ts`. It is meant to help you decide whether the kit fits your app.

**The kit has not been formally audited against WCAG 2.2, and it does not claim conformance.** Colour contrast,
touch target sizes and real screen reader output were not checked for this page. If you find a problem, please open
an issue: https://github.com/InomjonIsmaylov/kometa-ui-kit/issues

## What the kit does across the board

- **Native elements first.** Clickable things are real `<button>`s, links are `<a href>`, and form fields are real
  `<input>` / `<textarea>` elements, so Enter and Space work without extra code. Modals (`k-drawer`, `k-tray`,
  `k-photos`) use the browser's `<dialog>` with `showModal()`, so the page behind is inert and focus stays inside.
- **Visible focus.** Interactive components draw a `:focus-visible` outline (usually 2px `--amber`), and
  `styles/base.scss` sets a global `:focus-visible` outline. `k-notes` and `k-number` show focus as an underline
  instead of an outline.
- **Reduced motion.** Every component that animates has a `@media (prefers-reduced-motion: reduce)` block that turns
  its transitions and keyframe animations off. `k-fold`, `k-tally`, `k-link` and `[kAnimate]` also check
  `matchMedia('(prefers-reduced-motion: reduce)')` in code.
- **Names.** Most components take an `ariaLabel` input (some also `ariaLabelledBy`, or a required `label`) and pass it
  to the right element. Most of these inputs default to empty, so **naming is your job** (see the Notes column).
- **ARIA patterns.** Custom widgets use the matching roles and states: `slider`, `spinbutton`, `switch`,
  `checkbox`, `radiogroup`/`radio`, `listbox`/`option`, `combobox`, `menu`/`menuitem`, `tablist`/`tab`, `dialog`,
  `alertdialog`, `meter`, `progressbar`, `timer`, `separator`, and `aria-expanded`, `aria-pressed`, `aria-selected`,
  `aria-current`, `aria-valuenow`/`aria-valuetext`, `aria-invalid`.
- **Announcements.** Status components use `role="status"` / `role="alert"` or `aria-live` (banner, toast, wait,
  skeleton, upload, reorder, photos counter, date header). Decorative glyphs are `aria-hidden="true"`, and several
  components add visually hidden text (`.sr`) where the visible text is not enough (badge, tally, rules, sort).
- **Popups** (select, multi, suggest, menu, actions, context, fab, date, time, pop) close on Escape and give focus
  back to their trigger (multi and suggest keep focus in their input throughout); most close on Tab too.

## Components

"Native" means the keys a plain `<button>`, `<a>` or `<input>` already handles (Tab, Enter, Space, typing).
Keys listed are the ones the component's own code handles.

### Actions and buttons

| Component | Keyboard | Screen reader | Notes |
|---|---|---|---|
| `k-button` | Native | `<button>`, `aria-busy` while `loading`, icon `aria-hidden` | Icon-only buttons need `ariaLabel`. |
| `button[k-halo]` | Native | Host is your `<button>` | Icon-only: add `aria-label` yourself. |
| `button[k-erase]` | Native | Host is your `<button>` | Same as above. |
| `button[k-word]` | Native | Host is your `<button>`, `aria-busy` when `busy` | |
| `k-pair` | Native | Two `<button>`s, `aria-busy` on confirm | |
| `k-link` | Native | `<button>`, `ariaLabel` | The "copied" text swaps in the button with no live region; may not be announced. |
| `k-fab` | Escape, Tab, Arrow Up/Down, Home/End in the menu | `aria-haspopup="menu"`, `aria-expanded`, `role="menu"`/`menuitem` | `ariaLabel` defaults to "Actions". |
| `k-actions` | Escape, Tab, Arrow Up/Down, Home/End | `aria-haspopup="menu"`, `role="menu"`/`menuitem`, required `label` | |
| `k-context` | ContextMenu key or Shift+F10 opens; Escape, Tab, Arrow Up/Down, Home/End | `role="menu"`/`menuitem`/`separator` | The host content must be focusable for the keyboard opener to work. |
| `k-swipe` | Native (the hidden actions are real buttons and slide into view on focus) | `<button>`s; left action uses `leftLabel` as `aria-label` | Swiping is pointer-only, but each action is also a button. |

### Form controls

| Component | Keyboard | Screen reader | Notes |
|---|---|---|---|
| `k-field` | Native | `<input>` named by required `label`; `aria-required`, `aria-invalid`, error in `role="alert"` linked by `aria-describedby` | The label is `aria-label` plus placeholder; there is no visible label once typed. |
| `k-search` | Native; `clear` button | `type="search"`, required `ariaLabel` | Clear button is hidden from AT unless `clearLabel` is set. |
| `k-notes` | Native | `<textarea>`, `ariaLabel`; counter is `aria-live="polite"` | Counter announces on every keystroke. Focus shown as an underline. |
| `k-number` | Arrow Up/Down (Shift x10) | `<input role="spinbutton">` with `aria-valuemin/max/now`, `aria-invalid` | +/- buttons are `aria-hidden` and `tabindex="-1"` (arrows replace them). Pass `ariaLabel` or `inputId` + `<label>`. |
| `k-stepper` | Arrow Up/Down, PageUp/PageDown, Home/End | `role="spinbutton"`, `aria-valuetext` with unit, `aria-readonly` | +/- buttons are named "−"/"+" unless `decrementLabel`/`incrementLabel`. Pass `ariaLabel`. |
| `k-digits` | Native | `type="tel"` inside a `<label>` with the prefix | Without `ariaLabel` the name is just the prefix (e.g. "+998"). |
| `k-code` | Backspace on an empty cell goes back | `role="group"` named by `label`; one input per digit | Cells have no name unless `cellLabel` is set. |
| `k-check` | Native | `<button role="checkbox">`, `aria-checked`, `aria-readonly` | Projected text is the name. |
| `k-tick` | Native | `<button role="checkbox">`, `aria-checked`, `aria-invalid` | No text: pass `ariaLabel`, `ariaLabelledBy` or `inputId` + `<label for>`. |
| `k-toggle` | Native | `<button role="switch">`, `aria-checked`, `ariaDescribedBy` | Without `ariaLabel`/`ariaLabelledBy` the name is the on/off word, which changes with state. |
| `k-chip` | Native | `aria-pressed` | |
| `k-rating` | Arrow keys, Home/End (roving tabindex) | `role="radiogroup"`/`radio`, `aria-checked`, `aria-required`, `aria-invalid` | Pass `ariaLabel`. |
| `k-slider` | Arrow keys, PageUp/PageDown, Home/End | `role="slider"`, `aria-valuetext`, `ariaLabel`/`ariaLabelledBy` | |
| `k-hue` | Arrow keys, Home/End | `role="slider"`, `aria-valuetext` is the colour value | Value is read as a raw colour string (e.g. a hex code), not a colour name. Pass `ariaLabel`. |
| `k-select` | Arrow Up/Down opens; Arrow Up/Down, Home/End, Enter/Space, Escape, Tab, type-ahead | Button with `aria-haspopup="listbox"`, `role="listbox"`/`option`, `aria-selected` | Group headings are `aria-hidden`, so groups are not announced. |
| `k-menu` | Arrow Up/Down opens; Arrow Up/Down, Home/End, Escape | Trigger `aria-haspopup="listbox"`, `aria-expanded`; `role="listbox"`/`option` | |
| `k-multi` | Arrow Up/Down, Enter (Space in pill mode), Backspace removes last, Escape, Tab | `role="combobox"`, `aria-activedescendant`, `aria-multiselectable` listbox | Chip remove buttons are `tabindex="-1"`; use Backspace or the list. |
| `k-suggest` | Arrow Up/Down, Enter, Escape, Tab | `role="combobox"`, `aria-autocomplete="list"`, `aria-activedescendant` | Pass `ariaLabel` or `inputId` + `<label>`. |
| `k-date` | Arrow keys (day/week), PageUp/PageDown (month), Escape, Tab closes | `aria-haspopup="dialog"`, `role="dialog"`, day buttons with full date `aria-label`, `aria-pressed`, `aria-current="date"`, month header `aria-live` | Prev/next month buttons are `tabindex="-1"`; use PageUp/PageDown. |
| `k-time` | Arrow keys, Escape, Tab closes | `aria-haspopup="dialog"`, `role="dialog"`, `aria-pressed` | The Clear button cannot be reached by keyboard (see Known gaps). |
| `k-inplace` | Enter saves, Escape cancels | Button then `<input>`, `ariaLabel` | |
| `k-film` | Native | `role="group"`, `aria-pressed` | Tab through each day. |
| `k-slots` | Native | `role="group"`, `aria-pressed` | |
| `k-picker` | Native file input | Real `<input type="file">` in a `<label>`, focus ring via `:has(:focus-visible)` | |
| `k-reveal` | Arrow keys (Shift x4), Home/End | `role="slider"`, `aria-valuetext`; images use `beforeLabel`/`afterLabel` as `alt` | |

### Navigation

| Component | Keyboard | Screen reader | Notes |
|---|---|---|---|
| `k-tabbar` | Arrow Left/Right, Home/End (roving tabindex) | `role="tablist"`/`tab`, `aria-selected`; with links `role="navigation"` and `aria-current="page"` | Tabs have no `aria-controls`; link your panels yourself. |
| `k-words` | With `tabs`: Arrow Left/Right, Home/End | `tabs`: `tablist`/`tab`/`aria-selected`; otherwise `group` + `aria-pressed` | |
| `k-crumbs` | Native | `<nav>` (default name "Breadcrumb"), `<ol>`, `aria-current="page"` | |
| `k-pager` | Native | `<nav>`, `aria-current="page"`, named prev/next, page sizes `aria-pressed` | Labels come from a built-in dictionary. |
| `k-steps` | None (display only) | `<ol>`, `aria-current="step"` | |
| `k-tree` | Arrow Up/Down, Arrow Right (open), Arrow Left (back) | `role="group"`, `aria-expanded`, `aria-current` | Column browser, not a `role="tree"`. |
| `k-rows` / `k-row` | Native | `role="list"`/`listitem`; facts use `term`/`definition` | Icon-only rows need `ariaLabel`. |
| `k-sort`, `th[kometaSortHeader]` | Native | `aria-pressed` plus hidden direction text; header sets `aria-sort` | |

### Disclosure and overlays

| Component | Keyboard | Screen reader | Notes |
|---|---|---|---|
| `k-accordion` | Arrow Up/Down, Home/End between headers | `role="heading"` + `aria-level`, button `aria-expanded`/`aria-controls`, `role="region"` | |
| `k-fold` | Native | Button `aria-expanded`/`aria-controls`, `role="region"` | Body is created only while open. |
| `k-hint` | Native, Escape closes | Button `aria-expanded`, `aria-describedby`, `role="note"` | |
| `k-note` | Opens on focus, closes on blur and Escape | `role="tooltip"`, `aria-describedby` | Icon button needs `label` or it is named by the note text. |
| `[kometaTip]` | Shows on keyboard focus, Escape hides | `role="tooltip"`, adds `aria-describedby` to the host | The tip has `pointer-events: none`, so it cannot be hovered. |
| `k-pop` | Escape (focus back to opener); closes when focus leaves | `role="dialog"`, `ariaLabel`/`ariaLabelledBy` | Not modal; focus goes to its first control. |
| `k-drawer` | Escape (`closeOnEscape`) | Modal `<dialog>`, `aria-modal`, named by its first `h2` or `ariaLabel` | Focus goes to the heading, and back to the opener on close. |
| `k-tray` | Escape rejects | Modal `<dialog role="alertdialog">`, named by its heading | Focus goes to the heading; return on close is left to the browser. |
| `k-photos` | Arrow Left/Right, Escape | Modal `<dialog>`, named tool buttons, counter `aria-live` | Thumbnail buttons have no name if photos lack `alt`. |
| `k-confirm` | Native (buttons are yours) | Hidden pane uses `visibility: hidden` | Does not move focus when it swaps panes. |
| `k-carousel` | Arrow Left/Right when the carousel or its ticks have focus | `role="region"` + `aria-roledescription="carousel"`, slides `group`/"slide", off-screen slides `inert`, tick buttons `aria-current` | No live announcement of slide changes (not checked whether needed). |
| `k-reorder` | Space/Enter grab and drop, Arrow Up/Down, Home/End, Escape cancels | Grip `aria-pressed`, `aria-live="assertive"` announcements | |
| `k-panes` | Arrow keys, Home/End | `role="separator"` with `aria-valuenow`; default name "Resize panes" | |

### Feedback and status

| Component | Keyboard | Screen reader | Notes |
|---|---|---|---|
| `k-banner` | Native | `role="status"`, or `alert` for warn/error (`roleOverride`) | `dismissible` without `closeLabel` gives an unnamed close button. |
| `k-toast` | None | `aria-live="polite"` container, items `role="status"` or `alert` | See Known gaps. |
| `k-wait` | None | `role="status"`, required `label` | |
| `k-skeleton` | None | `role="status"` + `aria-busy` (line shape is `aria-hidden`) | Pass `ariaLabel`. |
| `k-upload` | Native (action button) | `role="progressbar"`, `aria-valuetext`, status `role="status"` | |
| `k-meter` | None | `role="meter"`, `aria-valuetext` | |
| `k-countdown` | None | `role="timer"`, `ariaLabel` | |
| `k-badge` | None | Number `aria-hidden`, hidden text from `label` ("{n} new") | |
| `k-tally` | None | Animated figure `aria-hidden`, hidden text with the value | |
| `k-rules` | None | `<ul>`, met rules get hidden "done" text | |

### Display

| Component | Keyboard | Screen reader | Notes |
|---|---|---|---|
| `k-table` | None of its own | Native `<table>`, `ariaLabel` | Header and rows are your templates. |
| `k-person` | None | `<img alt="imageAlt">`; bare initials get `role="img"` | Bare with an image and no `imageAlt` has no name. |
| `k-avatars` | None | `role="group"`, "+N" is `role="img"` with `moreLabel` | |
| `k-stars` | None | `role="img"`, required `label` | |
| `k-share` | None | Bar `role="img"`, required `label`; legend is a `<dl>` | |
| `k-heading` | None | Real `h2`–`h4` | |
| `k-trail` / `k-step` | None | `role="list"`/`listitem`, `<time>` | |
| `k-keys` | None | `<kbd>` | |
| `k-tag` | None | Text with an `aria-hidden` dot | Tone is colour only; the word carries the meaning. |
| `k-frame` | None | Plain `div` and `p` caption | Not a `<figure>`/`<figcaption>`. |
| `k-marks`, `k-split`, `k-quiet` | None | Plain text | Not checked further. |

## Known gaps

- **Toast cannot be dismissed or paused by keyboard.** `projects/kometa-ui/toast/kometa-toast.ts`: items close on a
  mouse click and pause only on pointer hover; there is no close button, and keyboard focus does not stop the timer.
  Items also carry `role="status"`/`alert` inside an `aria-live` container, which may announce twice (not checked
  with a screen reader).
- **`k-time` Clear button is keyboard-unreachable.** `projects/kometa-ui/time/kometa-time.ts`: Tab closes the
  popup and the arrow keys only move across the time buttons (`.t`), so "Clear" can only be clicked.
- **`k-banner` close button can have no name.** `projects/kometa-ui/banner/kometa-banner.ts`: `closeLabel` defaults
  to `''` and the button's only content is that label.
- **`k-code` cells are unnamed by default.** `projects/kometa-ui/code/kometa-code.ts`: `cellLabel` defaults to `''`.
- **`k-toggle` name follows its state.** `projects/kometa-ui/toggle/kometa-toggle.ts`: without `ariaLabel` or
  `ariaLabelledBy` the switch is named "On"/"Off" (its `onLabel`/`offLabel`), which says nothing about what it controls.
- **`k-digits` is named by its prefix only** unless `ariaLabel` is set (`projects/kometa-ui/digits/kometa-digits.ts`).
- **`k-notes` counter is chatty.** `projects/kometa-ui/notes/kometa-notes.ts`: the `aria-live="polite"` counter
  updates on every keystroke.
- **`[kometaTip]` is not hoverable.** `projects/kometa-ui/tip/kometa-tip.ts`: the tip has `pointer-events: none`, so
  moving the pointer onto it hides it (WCAG 1.4.13 expects hover content to stay while hovered).
- **`k-photos` thumbnails need `alt`.** `projects/kometa-ui/photos/kometa-photos.ts`: each thumbnail button's only
  content is an `<img [alt]="t.alt ?? ''">`.
- **`k-confirm` does not manage focus.** `projects/kometa-ui/confirm/kometa-confirm.ts`: the pane that held focus
  becomes `visibility: hidden`, so focus is lost unless your code moves it.
- **`k-link` copy result is not announced** (`projects/kometa-ui/link/kometa-link.ts`): no live region.
- **`k-hue` value text is a raw colour string** (`projects/kometa-ui/hue/kometa-hue.ts`).
- **Most `ariaLabel` inputs default to empty.** Controls with no visible text (`k-tick`, `k-slider`, `k-hue`,
  `k-rating`, `k-stepper`, `k-number`, `k-suggest`, `k-multi`, icon-only `k-button`) have no accessible name until you
  pass one.
- **Not checked:** colour contrast of the tokens in `styles/tokens.scss` (light and dark), touch target sizes,
  zoom/reflow at 400%, forced-colors (Windows High Contrast) mode, and actual screen reader output.
