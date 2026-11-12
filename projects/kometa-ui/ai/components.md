# kometa-ui component reference

Generated from the library source by `npm run api`; do not edit by hand. Read [usage.md](usage.md) first.
Every class below is standalone: add it to your component's `imports` and import it from its entry point,
`'kometa-ui/<name>'` (the file name without `kometa-`: `KometaButton` comes from `'kometa-ui/button'`).
Inputs are signal inputs; boolean inputs accept a bare attribute (`<k-button outlined />`).

## `k-fold-mark` — KometaFoldMark

Two 1.5px hairlines, 12px. The vertical one scales to nothing when open: a plus becomes a minus.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `open` | input | `boolean` | `false` |  |

## `k-fold-body` — KometaFoldBody

The content half: rows animate 0fr to 1fr (420ms spring, the content fading up 4px in the last 60%), and close faster (260ms). The template is created only while open or animating, so a page loads what it always loaded. Give it `<ng-template>` as its content, or `[tpl]`. `appear`: animate in when it is created already open (a detail row that is only rendered while open).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `open` | input | `boolean` | `false` |  |
| `appear` | input | `boolean` | `false` |  |
| `tpl` | input | `TemplateRef<unknown> \| null` | `null` |  |

## `k-fold` — KometaFold

A disclosure: a real `<button aria-expanded aria-controls>` header (project the title as `<span fold-title>`, any sibling controls as `[fold-aside]`) and a `role="region"` body (an `<ng-template>` child, created only while open). `open` is a model: `[(open)]` or `[open]` and `(openChange)`. The trigger's padding is `--fold-pad`, its hover fill `--fold-hover`.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `open` | model (two-way `[( )]`) | `boolean` | `false` |  |
| `disabled` | input | `boolean` | `false` |  |

## `k-accordion-item` — KometaAccordionItem

One question and its answer: a real `<button aria-expanded aria-controls>` in Syne, a hairline under it that stretches to full width while open (680ms spring), and the answer in a `role="region"` that opens on `grid-template-rows` 0fr to 1fr through `k-fold-body` (so its 420ms spring, its close and its reduced-motion handling are the fold's own). The answer is the projected content and is created only while open. `open` is a model. The question wraps; it is never cut. Named `heading`, not `title`, so no native tooltip rides on the host.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `heading` | input | `string` | **required** | The question, in the caller's words. |
| `open` | model (two-way `[( )]`) | `boolean` | `false` |  |
| `level` | input | `number` | `3` | The `aria-level` of the question's heading. |
| `disabled` | input | `boolean` | `false` | The question cannot be pressed. |

## `k-accordion` — KometaAccordion

A stack of `k-accordion-item`s. One open at a time unless `multiple`; ArrowUp, ArrowDown, Home and End move focus between the questions. Spec: kometa-accordion.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `multiple` | input | `boolean` | `false` |  |

## `[kometaMotion]` — KometaMotion

The `animation` input of every animated component (a host directive). It does not touch the host: the component binds `vars()` (see kometaMotionVars) on the element that moves, which reads `--k-anim` (in) and `--k-anim-out` with `--k-anim-dir` (out). Left empty, the component keeps its own motion; `--k-anim` set in your CSS (say on `:root`) changes it app-wide. Duration and easing are `--k-motion-dur` and `--k-motion-ease`, the travel of the sliding presets `--k-motion-distance`.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `animation` | input | `"" \| KometaAnimation` | `''` |  |

## `[kAnimate]` — KometaAnimate

Plays a motion on any element, once: as it renders (`kAnimateOn="enter"`, the default) or the first time it scrolls into view (`"view"`). `kAnimate` takes a preset or your own keyframes name; `kAnimateDelay` and `kAnimateDuration` are milliseconds, so a list can stagger with `[kAnimateDelay]="$index * 60"`. `replay()` (exported as `kAnimate`) plays it again. Reduced motion skips it. <section kAnimate="rise" kAnimateOn="view">…</section>

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `kAnimate` | input | `"" \| KometaAnimation` | `''` |  |
| `kAnimateOn` | input | `"enter" \| "view"` | `'enter'` |  |
| `kAnimateDelay` | input | `number` | `0` |  |
| `kAnimateDuration` | input | `number` | `600` |  |

## `k-actions` — KometaActions

The "more" menu: a ⋯ button that opens a short list of actions. Not a value chooser (that is `k-menu`): each row does something and the list closes. The list is words under a hairline, with a bar that slides to the row you are on; it opens in the browser's top layer, so a card or table cell cannot clip it, flips above the button when there is no room below and is kept inside the viewport. Arrow keys, Home and End move between rows; Enter runs one; Escape, a click outside, Tab, resize and scroll close it. Content projected into it replaces the ⋯ (the customer top bar puts the avatar glyph there). `label` is the button's accessible name ("More options") and the caller's word. `open` is a model. Spec: kometa-actions.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-7.html (Rail).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `items` | input | `KometaAction[]` | **required** |  |
| `label` | input | `string` | **required** | The button's accessible name, in the caller's language. |
| `disabled` | input | `boolean` | `false` |  |
| `open` | model (two-way `[( )]`) | `boolean` | `false` |  |
| `align` | input | `"end" \| "start"` | `'end'` | Which edge of the button the list lines up with. |

## `k-person` — KometaPerson

A person row: a 36px (or 28px `sm`) glass disc of initials, then the name and an optional meta line; projected content sits at the end of the row. It is also the one avatar. `size="lg"` is a 64px figure (`--person-disc` sets any other width), `shape="square"` a 12px-radius tile for a shop, `image` draws a photo in place of the initials (`imageAlt` names it) and `bare` hides the name beside it. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `name` | input | `string` | **required** |  |
| `meta` | input | `string` | `''` |  |
| `size` | input | `"md" \| "sm" \| "lg"` | `'md'` | `sm` is a 28px disc for dense table rows, `lg` a 64px figure. |
| `shape` | input | `"disc" \| "square"` | `'disc'` |  |
| `image` | input | `string` | `''` | A photo in place of the initials. |
| `imageAlt` | input | `string` | `''` |  |
| `bare` | input | `boolean` | `false` | Only the figure, no name beside it (the name still names it to a screen reader). |
| `initialsText` | input | `string` | `''` | Overrides the letters drawn in the disc (otherwise taken from `name`). |

## `k-avatars` — KometaAvatars

A few people as overlapping glass discs (`k-person`, bare), then a "+N" disc for the rest. On hover or focus inside, the discs fan apart so each face reads. Each disc names its person to a screen reader. Tests in kometa-avatars.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `people` | input | `{ name: string; image?: string; }[]` | **required** |  |
| `max` | input | `number` | `4` | How many discs show before the "+N". |
| `size` | input | `"md" \| "sm" \| "lg"` | `'md'` |  |
| `moreLabel` | input | `string` | `'{n} more'` | What the "+N" disc says aloud; `{n}` is the count. |
| `ariaLabel` | input | `string` | `''` |  |

## `k-badge` — KometaBadge

A count on the corner of whatever it wraps (an icon, an avatar, a button): a cream disc with the figure in mono, cut out of the background by a ring, that pops each time the count changes. Over `max` it shows `99+`; at zero it is gone unless `showZero`. The disc is hidden from a screen reader, which hears `label` (`{n}` is the count) instead, so put the badge inside the control it describes. <button aria-label="Notifications"><k-badge [count]="3"><i class="ti ti-bell"></i></k-badge></button> Tests in kometa-badge.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `count` | input | `number` | `0` |  |
| `max` | input | `number` | `99` | Above this the disc reads `max+`. |
| `showZero` | input | `boolean` | `false` |  |
| `label` | input | `string` | `'{n} new'` | What a screen reader hears; `{n}` is the count. Empty leaves it to the wrapped control's own label. |

## `button[k-word]` — KometaWord

An action that is only a word and an arrow, for the end of a row: `<button k-word>Nudge</button>`. No box, so a column of them stays calm; the arrow leans on hover. Amber ink by default, `quiet` for a secondary word beside it (muted until hovered). `lead` is the page's one call to action (the old `kometa-line`): ink, a hairline under it and the arrow pushed to the end; `busy` swaps the rule for a marching one and the button ignores clicks until it clears. Never a destructive one (that is `k-erase`). 44px tall on a touch screen, whatever it draws. Spec: kometa-word.spec.ts. Lab: docs/superpowers/labs/2026-10-14-blend-ui-lab-round-11.html (C).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `quiet` | input | `boolean` | `false` |  |
| `lead` | input | `boolean` | `false` |  |
| `busy` | input | `boolean` | `false` |  |
| `arrow` | input | `boolean` | `true` | `false` drops the arrow. |

## `k-banner` — KometaBanner

A notice with no box: a 2px state-coloured hairline stands beside the sentence. With `dismissible` a close word (`closeLabel`, supplied by the caller; × named "Dismiss" without one) collapses it (rows 1fr to 0fr, instant under reduced motion) and emits `dismissed`. `ok` and `info` are `role="status"`, `warn` and `error` `role="alert"`. `actionLabel` adds one word beside the sentence (`action` fires), replacing the old inline-alert and load-error retry buttons. The sentence is projected: `<k-banner tone="warn">Internet yoq.</k-banner>`. Spec: kometa-banner.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `tone` | input | `KometaBannerTone` | `'info'` |  |
| `surface` | input | `"bare" \| "glass"` | `'bare'` | `glass` draws a blurred slab with a hairline; the default is the boxless hairline. |
| `dismissible` | input | `boolean` | `false` |  |
| `roleOverride` | input | `"" \| "status" \| "alert"` | `''` | Overrides the live-region role the tone picks (a page-load notice may want `status` even when it warns). |
| `closeLabel` | input | `string` | `''` | The word on the close button; the caller owns the dictionary. Empty draws × named "Dismiss". |
| `actionLabel` | input | `string` | `''` | An action word after the sentence (a Retry); the caller owns the dictionary. |
| `icon` | input | `string` | `''` | A leading glyph in the tone colour (decorative; the sentence carries the meaning). |
| `action` | output | `void` |  |  |
| `dismissed` | output | `void` |  |  |

## `k-button` — KometaButton

The one button. A real `<button class="kbtn">` inside the host, so type, disabled and click stay the browser's own. Looks: the default is the amber main action; `severity` `secondary` is the quiet grey pill, `danger` the red one; `outlined` draws it as a hairline, `text` as an underline-free word; `size="small"` is the compact one; `fluid` fills the row; `loading` shows a spinner and blocks the tap. `styleClass` lands on the inner button, `(clicked)` carries the click. The look is written with `:where()`, so an app stylesheet's `.kbtn` floor (the 48px thumb height) wins without a fight. Spec: kometa-button.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `label` | input | `string` | `''` |  |
| `type` | input | `"button" \| "submit"` | `'button'` |  |
| `severity` | input | `"secondary" \| "danger" \| null` | `null` |  |
| `size` | input | `"small" \| null` | `null` |  |
| `outlined` | input | `boolean` | `false` |  |
| `text` | input | `boolean` | `false` |  |
| `fluid` | input | `boolean` | `false` |  |
| `loading` | input | `boolean` | `false` |  |
| `disabled` | input | `boolean` | `false` |  |
| `ariaLabel` | input | `string` | `''` |  |
| `styleClass` | input | `string` | `''` |  |
| `icon` | input | `string` | `''` | A decorative glyph or emoji beside the label; name the button with `label` or `ariaLabel`. |
| `iconPos` | input | `"left" \| "right"` | `'left'` |  |
| `clicked` | output | `MouseEvent` |  |  |

## `[kSlide]` — KometaSlide

One slide of a `k-carousel`: `<div kSlide>…</div>`. Off-screen slides are inert.

## `k-carousel` — KometaCarousel

Slides in a row, one in view, with a row of ticks under them as the pager: the current tick stands tall and cream, like `k-meter`. With `edges` (on by default) a click on the left or right third of the slide goes back or forward, and a thin chevron shows on that side while the pointer is there. Clicks on a link, button or field inside a slide are left alone. Focused, the arrow keys move too. Tests in kometa-carousel.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `index` | model (two-way `[( )]`) | `number` | `0` | The slide in view, from 0. |
| `edges` | input | `boolean` | `true` | Click the left or right third of the slide to go back or forward. |
| `ariaLabel` | input | `string` | `''` |  |
| `slideLabel` | input | `string` | `'Slide'` | Read before each tick's number: "Slide 2". |

## `k-check` — KometaCheck

A checkbox with no box: a row whose done state draws a 1px line through the label (it grows in from the left over 420ms and the label turns muted). A real `<button role="checkbox" aria-checked>`, so Space and Enter toggle natively. The label is the projected content and may wrap: the line is a background on the inline text, so it runs through every wrapped line. `checked` and `disabled` follow the Signal Forms checkbox contract. A group of them is just several siblings. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md; tests in kometa-check.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `checked` | model (two-way `[( )]`) | `boolean` | `false` |  |
| `disabled` | input | `boolean` | `false` |  |
| `readonly` | input | `boolean` | `false` | Shows the state but ignores presses. |
| `ariaLabel` | input | `string` | `''` | Overrides the projected label as the accessible name. |

## `k-chip` — KometaChip

A glass pill that is a multi-select toggle. Chosen: a 2px inset amber edge, never an amber fill. Project the words (and an optional leading icon) as content, and a count as `<span chip-count>`. `controlled` stops the chip flipping itself: a click only emits `toggled` with the wanted value, and the chip shows whatever `[selected]` the parent binds (a radio group, or a parent that may refuse the change). The page owns the group: wrap several chips in `role="group"` with an aria-label. Spec: kometa-chip.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `selected` | model (two-way `[( )]`) | `boolean` | `false` |  |
| `disabled` | input | `boolean` | `false` |  |
| `controlled` | input | `boolean` | `false` | The parent owns `selected`; a click only emits `toggled`. |
| `toggled` | output | `boolean` |  | Every click, with the value the user asked for. |
| `ariaLabel` | input | `string` | `''` | Overrides the projected words as the accessible name. |

## `k-code` — KometaCode

One cell per digit. A cream line sits under the cell being typed. Length defaults to 6 — the product code, not the lab's 4. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | model (two-way `[( )]`) | `string` | `''` |  |
| `length` | input | `number` | `6` |  |
| `disabled` | input | `boolean` | `false` |  |
| `label` | input | `string` | `''` |  |
| `placeholder` | input | `string` | `''` | Shown in each empty cell, e.g. `·`. |
| `mask` | input | `boolean` | `false` | Hides the digits (a PIN). |
| `cellLabel` | input | `string` | `'Digit'` | Names each cell "<cellLabel> 1", "<cellLabel> 2"…; the caller owns the language. |

## `k-confirm` — KometaConfirm

The row crossfades to the caller's question while `asking` is true. The question, including Yo'q and Ha, is projected; this component draws no button of its own. When focus was inside the component as the panes swap, it moves to the first focusable element of the pane now shown (so the first button of the question is the safe answer). Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `asking` | input | `boolean` | `false` |  |

## `k-context` — KometaContext

A right-click menu for whatever it wraps: a glass card in the top layer at the pointer, kept inside the screen, with the shortcut of each action in mono and destructive ones in red. `null` in `items` draws a divider. The ContextMenu key or Shift+F10 opens it under the focused element. Arrows, Home and End move, Enter picks, Escape and Tab close; focus goes back to where it was. Picking emits `picked` with the item. <k-context [items]="actions" (picked)="run($event)"><div class="row">…</div></k-context> Tests in kometa-context.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `items` | input | `(KometaContextItem \| null)[]` | **required** |  |
| `ariaLabel` | input | `string` | `'Actions'` |  |
| `picked` | output | `KometaContextItem` |  |  |

## `k-countdown` — KometaCountdown

Time running out: a Syne figure "0:42" and a row of ticks that drain one by one, right to left, the way `k-meter` spends a count. `duration` (seconds) is the span the ticks stand for; the end is `until`, or `duration` from when it was drawn. Emits `done` once at zero. Above 40 seconds it draws 30 ticks. Tests in kometa-countdown.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `duration` | input | `number` | `60` | Seconds the full row of ticks stands for. |
| `until` | input | `string \| number \| Date \| null` | `null` | When it ends. Without it, it ends `duration` seconds after it is drawn. |
| `label` | input | `string` | `''` | The muted words after the figure, e.g. "to confirm". |
| `ariaLabel` | input | `string` | `''` |  |
| `done` | output | `void` |  |  |

## `k-crumbs` — KometaCrumbs

Where you are, as a path that walks down the page: each level sits a step further right and a size larger, and the last one, the page itself, is a Syne title behind a "↳". A `<nav>` around an `<ol>`; the last item carries `aria-current="page"` and is not a link. Tests in kometa-crumbs.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `items` | input | `KometaCrumb[]` | **required** | Outermost first; the last one is the current page. |
| `ariaLabel` | input | `string` | `'Breadcrumb'` |  |
| `picked` | output | `KometaCrumb` |  | A crumb with no `href` was pressed. |

## `k-date` — KometaDate

One calendar day. The date is a figure with a hairline under it; it opens a glass month in the browser's top layer (so a drawer or a card cannot clip it), flips above when there is no room below and is kept inside the viewport. Days are bare figures: the chosen day takes the 2px edge, today a small line. The week starts on Monday (`weekStart` 0 for Sunday). Arrow keys move by day and week (across months), PageUp and PageDown by month; Enter picks; Escape, Tab, a click outside, resize and scroll close it. `value` is local midnight (or `null`); `min` and `max` grey out the days beyond. `names` is the caller's language (English when unset); `inputId` lets a `<label for>` name the button. `range` turns it into a period picker: the first tap holds the start, the second the end (an earlier second tap swaps them). The two ends are cream discs and a cream line joins them under the days between. `rangeValue` is `[start, null]` after the first tap and `[start, end]` after the second. `inline` draws the month in place, with no button and no popup, for a panel that already floats (the console's period picker). Spec: kometa-date.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-8.html (Month).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | model (two-way `[( )]`) | `Date \| null` | `null` |  |
| `min` | input | `Date \| null` | `null` |  |
| `max` | input | `Date \| null` | `null` |  |
| `names` | input | `KometaDateNames \| null` | `null` |  |
| `ariaLabel` | input | `string` | `''` |  |
| `inputId` | input | `string` | `''` |  |
| `placeholder` | input | `string` | `'—'` | Shown when there is no value. |
| `disabled` | input | `boolean` | `false` |  |
| `open` | model (two-way `[( )]`) | `boolean` | `false` |  |
| `range` | input | `boolean` | `false` | A period, not a day: see the class note. |
| `inline` | input | `boolean` | `false` |  |
| `weekStart` | input | `0 \| 1` | `1` | The first column: 1 Monday (default) or 0 Sunday. |
| `rangeValue` | model (two-way `[( )]`) | `(Date \| null)[] \| null` | `null` |  |

## `k-digits` — KometaDigits

A `+998` national number. The model is digits only, at most 9, shown as `90 123 45 67`. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | model (two-way `[( )]`) | `string` | `''` | Digits only. The `+998` prefix is display, never stored. |
| `size` | input | `"md" \| "sm"` | `'md'` | `sm` sits in a 44px form row; `md` is the big figure. |
| `ariaLabel` | input | `string` | `''` |  |
| `prefix` | input | `string` | `'+998'` | The country prefix shown before the number (display only). |
| `placeholder` | input | `string` | `''` |  |
| `disabled` | input | `boolean` | `false` |  |

## `k-drawer` — KometaDrawer

A panel that slides in from the right (or up from the bottom) over a dimmed page, on the browser's own modal `<dialog>`: the page behind goes inert, Escape and the dark area are the browser's, and the top layer keeps a drawer above any card. <k-drawer [visible]="open()" (visibleChange)="open.set($event)" [position]="…" styleClass="kometa-sheet">… `visible` is two-way. `dismissible` (default true) lets a click on the dark area close it; Escape has its own switch, `closeOnEscape` (default true), so a sheet can refuse the dark area mid-save and still hand its save to the page on Escape. `opened` fires once it is open, `closing` as the close starts and `kometaSheetClosed` once the leave slide has finished, so a page can drop the sheet without cutting the animation. A `<ng-template #headless>` child replaces the plain content box (the staff drawers draw their own head). `ariaLabel` names a sheet whose heading cannot. A drawer with `styleClass="kometa-sheet"` is also a history entry: browser-back closes it instead of leaving the page, and a programmatic close pops that entry only while it is still the current one. On show focus goes to the sheet's first `h2` (made `tabindex="-1"`), else its first control, and the dialog is named by that heading; on close it returns to the opener while focus is still in the sheet or lost. The heading, not the first field, so a phone's keyboard stays down. Spec: kometa-drawer.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `visible` | model (two-way `[( )]`) | `boolean` | `false` |  |
| `position` | input | `"left" \| "right" \| "bottom"` | `'right'` |  |
| `dismissible` | input | `boolean` | `true` |  |
| `closeOnEscape` | input | `boolean` | `true` |  |
| `styleClass` | input | `string` | `''` |  |
| `style` | input | `{ width?: string; } \| null` | `null` |  |
| `ariaLabel` | input | `string` | `''` |  |
| `opened` | output | `void` |  |  |
| `closing` | output | `void` |  |  |
| `kometaSheetClosed` | output | `void` |  | Fires once the leave slide has finished. |

## `button[k-erase]` — KometaErase

A destructive action that lives inline: a red underlined word. `<button k-erase>Delete service</button>`. It is deliberately quiet; the loud red button belongs to the confirm step (`k-pair`), so the list itself never shouts. Not for the one thing a screen is for, and not for a row's everyday action. Spec: kometa-erase.spec.ts. Lab: docs/superpowers/labs/2026-10-14-blend-ui-lab-round-11.html (D).

## `k-fab` — KometaFab

The page's main action, as a round cream button in the bottom corner. Pressing it dims the page and raises the actions above it as big Syne words, no icons; the `+` turns into a `×`. Picking one emits `picked` with it. By default it is fixed to the screen; `fixed` false pins it to the nearest positioned ancestor instead (a phone frame, a card). The words are a menu: arrows, Home and End move, Escape and a click on the dimmed page close it and hand focus back to the button. Tests in kometa-fab.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `actions` | input | `KometaFabAction[]` | **required** |  |
| `ariaLabel` | input | `string` | `'Actions'` | Names the button and its menu. |
| `icon` | input | `string` | `'+'` |  |
| `fixed` | input | `boolean` | `true` | False pins it to the nearest positioned ancestor instead of the screen. |
| `picked` | output | `KometaFabAction` |  |  |

## `k-field` — KometaField

The text field, as the lab's "whisper" draws it: no box, the placeholder is the label (Syne 700), one 1px hairline under it, and on focus a cream line draws in from the left. Under it an optional "4 / 40" counter and a muted-red error line (`role="alert"`). A Signal Forms custom control (`FormValueControl<string>`): `<k-field [formField]="f.name" label="…" />` binds value, disabled, readonly, required, name, touched, invalid, errors and maxLength by itself. Outside Signal Forms it is a plain control: `[(value)]` and an explicit `error` string. Spec: kometa-field.spec.ts, design in docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.

A Signal Forms control: bind it with `[formField]`.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | model (two-way `[( )]`) | `string` | `''` | The value is the only required property in this contract. A component that wants to integrate with the `Field` directive via this contract, *must* provide a `model()` that will be kept in sync with the value of the bound `FieldTree`. |
| `label` | input | `string` | **required** | The placeholder AND the accessible name: the field has no other label. |
| `placeholder` | input | `string` | `''` | Overrides the placeholder (the label by default); the accessible name stays `label`. |
| `type` | input | `"text" \| "email" \| "tel" \| "url" \| "password"` | `'text'` |  |
| `size` | input | `"md" \| "sm"` | `'md'` | `md` is Syne 24px; `sm` is 18px for a form row 24px does not fit. |
| `inputmode` | input | `string` | `''` |  |
| `autocomplete` | input | `string` | `''` |  |
| `name` | input | `string` | `''` | An input to receive the name for the field. If implemented, the `Field` directive will automatically bind the name from the bound field to this input. |
| `maxLength` | input | `number \| undefined` | `undefined` | Camel-cased because the Signal Forms contract binds `maxLength` by that name. |
| `showCount` | input | `boolean` | `false` | "4 / 40" under the line (just "4" when there is no maxLength). |
| `error` | input | `string` | `''` | A message of the page's own. Non-empty means the field is in error. |
| `required` | input | `boolean` | `false` | An input to receive the required status for the field. If implemented, the `Field` directive will automatically bind the required status from the bound field to this input. |
| `disabled` | input | `boolean` | `false` | An input to receive the disabled status for the field. If implemented, the `Field` directive will automatically bind the disabled status from the bound field to this input. |
| `readonly` | input | `boolean` | `false` | An input to receive the readonly status for the field. If implemented, the `Field` directive will automatically bind the readonly status from the bound field to this input. |
| `touched` | input | `boolean` | `false` | Signal Forms state; a message from `errors` shows only once the field is touched. |
| `invalid` | input | `boolean` | `false` | An input to receive the invalid status for the field. If implemented, the `Field` directive will automatically bind the invalid status from the bound field to this input. |
| `errors` | input | `readonly ValidationError.WithOptionalFieldTree[]` | `[]` | An input to receive the errors for the field. If implemented, the `Field` directive will automatically bind errors from the bound field to this input. |
| `touch` | output | `void` |  | Emitted on blur, which is what marks a Signal Forms field touched. |

## `k-film` — KometaFilm

A week strip of days with one glass thumb sliding behind the pressed one. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md, "Day: film".

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `days` | input | `readonly KometaFilmDay[]` | **required** |  |
| `value` | model (two-way `[( )]`) | `string` | `''` |  |
| `ariaLabel` | input | `string` | `''` |  |
| `disabled` | input | `boolean` | `false` |  |

## `k-frame` — KometaFrame

A framed picture. The caption sits under the frame when it is non-empty. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `caption` | input | `string` | `''` |  |

## `button[k-halo]` — KometaHalo

An icon-only button with no drawn box: 44px, muted glyph, and a disc of light that appears on hover and focus. `<button k-halo aria-label="Close">✕</button>`; the caller always supplies the `aria-label`, because the glyph is the only content. One shape for the close, previous/next and more buttons that were each their own size. Spec: kometa-halo.spec.ts. Lab: docs/superpowers/labs/2026-10-14-blend-ui-lab-round-11.html (E).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `size` | input | `"md" \| "sm" \| "lg"` | `'md'` | `sm` is 32px, `lg` 56px; `--halo-size` sets any other. |

## `k-heading` — KometaHeading

A Syne title and a hairline that runs out to the action, which is any element with an `action` attribute projected into it. With no action the hairline runs out to the edge. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md, "Heading: rule".

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `title` | input | `string` | **required** |  |
| `level` | input | `3 \| 4 \| 2` | `2` |  |
| `headingId` | input | `string` | `''` | The id put on the heading element so a region can name itself with `aria-labelledby`. |
| `rule` | input | `boolean` | `true` | False draws no hairline, so the action sits next to the title. |

## `k-hint` — KometaHint

An explanation that stays in the page. The term itself is the button (dotted underline); opened, a 1px thread grows to 24px and the sentence fades in beside it. Escape closes it and returns focus to the term. `open` is a model. The sentence is projected: `<k-hint term="Lid tolovi">Qidiruvdan kelgan yangi mijozning birinchi tashrifidan 12%.</k-hint>`. Spec: kometa-hint.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `term` | input | `string` | **required** |  |
| `open` | model (two-way `[( )]`) | `boolean` | `false` |  |
| `ariaLabel` | input | `string` | `''` |  |
| `disabled` | input | `boolean` | `false` |  |

## `k-hue` — KometaHue

A colour picked from a row of hue ticks: every tick is drawn in its own hue and the chosen one stands tall. A disc of the colour and its hex in mono sit underneath. Saturation and lightness are fixed by the caller, so every pick sits in one family. The tick row is a `role="slider"` (arrows, Home, End) and can be dragged. `value` is `#RRGGBB`. Tests in kometa-hue.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | model (two-way `[( )]`) | `string` | `'#E7C255'` |  |
| `count` | input | `number` | `24` | How many hues the row offers. |
| `saturation` | input | `number` | `75` |  |
| `lightness` | input | `number` | `62` |  |
| `disabled` | input | `boolean` | `false` |  |
| `showValue` | input | `boolean` | `true` | False hides the disc and hex under the ticks. |
| `ariaLabel` | input | `string` | `''` |  |

## `k-inplace` — KometaInplace

A value you edit where it stands: a Syne word that turns into an input on click. While you type, the old value sits above it struck through, so you can see what you are replacing. Enter or leaving the field saves (an empty entry keeps the old value), Escape cancels, and a save flashes the word. Focus returns to the word either way. `value` is a model and `disabled` an input, so `[formField]` binds it. Tests in kometa-inplace.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | model (two-way `[( )]`) | `string` | `''` |  |
| `disabled` | input | `boolean` | `false` |  |
| `placeholder` | input | `string` | `''` | Shown, muted, while the value is empty. |
| `ariaLabel` | input | `string` | `''` | Names the field; the word reads as "label: value". |

## `k-keys` — KometaKeys

A keyboard shortcut as words in Syne, `Ctrl + Shift + P`, inside the nested `<kbd>` HTML asks for. With `play` the keys light up one after another, as if being pressed: on hover and focus by default, always with `loop`, never with `off` (and never under reduced motion). Tests in kometa-keys.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `keys` | input | `string \| string[]` | **required** | `"Ctrl+Shift+P"` or `['Ctrl', 'Shift', 'P']`. |
| `play` | input | `"hover" \| "loop" \| "off"` | `'hover'` |  |
| `separator` | input | `string` | `'+'` | Drawn between the keys. |

## `k-link` — KometaLink

Copies `text` and reads `copiedLabel` for 900ms (also said through a polite live region). A refused clipboard leaves `copyLabel`. "Flash" (round 10): a cream band also sweeps over the element just before the link, which is where every site shows the value it copies. Skipped for reduced motion and where the value has no element to strike; the label swap alone still answers. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `text` | input | `string` | **required** |  |
| `copyLabel` | input | `string` | **required** |  |
| `copiedLabel` | input | `string` | **required** |  |
| `ariaLabel` | input | `string` | `''` | Names what is copied when the visible word alone is ambiguous (one per table row). |
| `flashValue` | input | `boolean` | `true` | False where the element before the link is not the copied value (admin's poster button). |
| `copiedMs` | input | `number` | `900` | How long `copiedLabel` shows, in ms. |
| `disabled` | input | `boolean` | `false` |  |

## `k-marks` — KometaMarks

A week of marks. A null mark is a muted day with a dash under the label. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `days` | input | `KometaMarkDay[]` | **required** |  |
| `empty` | input | `string` | `'—'` | What a closed day shows in place of a mark. |

## `k-words` — KometaWords

A handful of words with a cream line under the pressed one. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `options` | input | `readonly KometaWordOption[]` | **required** |  |
| `value` | model (two-way `[( )]`) | `string` | `''` |  |
| `ariaLabel` | input | `string` | `''` |  |
| `disabled` | input | `boolean` | `false` |  |
| `tabs` | input | `boolean` | `false` | A real tab strip (its words switch panels): tablist/tab roles, aria-selected, one tab stop, arrow keys. |
| `optionTemplate` | input | `TemplateRef<{ $implicit: KometaWordOption; }> \| null` | `null` |  |

## `k-menu` — KometaMenu

A chooser with no floating sheet: a trigger line (a muted prefix word, the chosen value in Syne, a caret) opens the option list in the page as big Syne words and pushes the content below it down (rows 0fr to 1fr, 420ms). The chosen word is cream with a trailing bead. `value` is a model and `disabled` an input, so `[formField]` binds it like the other shared value controls. Spec: kometa-menu.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `options` | input | `readonly KometaWordOption[]` | **required** |  |
| `value` | model (two-way `[( )]`) | `string` | `''` |  |
| `label` | input | `string` | `''` | The muted word before the chosen value (`Saralash`). |
| `ariaLabel` | input | `string` | `''` | Names the control for a screen reader when the prefix word alone is not enough. |
| `disabled` | input | `boolean` | `false` |  |
| `placeholder` | input | `string` | `''` | Shown as the chosen word while nothing is chosen. |

## `k-meter` — KometaMeter

A Syne figure "17 / 25" over one tick per unit: a spent tick is dim and short, a remaining one bright and tall. Above 40 units it draws 25 ticks and scales; the figure stays exact. Read-only. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4; tests in kometa-meter.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | input | `number` | `0` |  |
| `max` | input | `number` | `25` |  |
| `label` | input | `string` | `''` | The muted line under the ticks, e.g. "bepul lid qoldi". |
| `ariaLabel` | input | `string` | `''` |  |
| `showFigure` | input | `boolean` | `true` | False hides the big figure and leaves the ticks (the value is still read aloud). |

## `k-multi` — KometaMulti

Several choices from a list. What is chosen sits in the field as words with a cross; the field is also an input, so typing narrows the list (a glass list in the browser's top layer, which flips above when there is no room below). Arrow keys move through the list, Enter toggles the row under the cursor, Backspace on an empty input takes the last choice off, Escape closes (and does not reach a drawer behind it), Tab, a click outside, resize and scroll elsewhere close it. The list stays open while you choose. `pill` is the toolbar form: no chips and no typing, a bordered button that shows the caller's `summary` ("Columns 3/7", "Shops: 2 chosen") and the same list under it. `options` are objects read through `optionLabel` and `optionValue`; `optionDot` names a field holding a colour, drawn as a dot before the label. `value` is the array of chosen values, replaced (never changed in place) on every toggle. Spec: kometa-multi.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-9.html (Chips).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `options` | input | `readonly unknown[] \| null \| undefined` | `[]` |  |
| `optionLabel` | input | `string` | `'label'` |  |
| `optionValue` | input | `string` | `'value'` |  |
| `optionDot` | input | `string` | `''` |  |
| `value` | model (two-way `[( )]`) | `readonly any[]` | `[]` |  |
| `placeholder` | input | `string` | `''` |  |
| `summary` | input | `string` | `''` |  |
| `noMatch` | input | `string` | `''` |  |
| `removeLabel` | input | `string` | `'Remove'` |  |
| `pill` | input | `boolean` | `false` |  |
| `max` | input | `number \| null` | `null` | The most choices allowed; null is no limit. A full set can still be reduced. |
| `ariaLabel` | input | `string` | `''` |  |
| `inputId` | input | `string` | `''` |  |
| `disabled` | input | `boolean` | `false` |  |

## `k-note` — KometaNote

An explanation that floats and moves nothing: a small ⓘ marker, and a cream tab with the sentence in the browser's top layer, so a card with `overflow: hidden` or a container query cannot clip or trap it. Hover (mouse), focus and a tap open it; blur, leaving with the mouse and Escape close it. The tab sits above the marker, flips below near the top edge and is kept inside the viewport. `open` is a model. The sentence is projected: `<k-note label="Daromad">Davr uchun tushum, to'lovlargacha.</k-note>`. `label` is the marker's accessible name; when it is empty the tab describes the marker instead. Spec: kometa-note.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-6.html (Ink).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `label` | input | `string` | `''` | The marker's accessible name. |
| `open` | model (two-way `[( )]`) | `boolean` | `false` |  |
| `placement` | input | `"auto" \| "above" \| "below"` | `'auto'` | Where the tab sits; `auto` is above, flipping below near the top edge. |

## `k-notes` — KometaNotes

Free text, several lines. No box: a hairline under the text draws itself on focus, and the field grows with what is written (never shorter than `rows`). With a `maxlength` the count shows only in the last 30 characters, amber and then red at the limit. Screen readers hear the count only as it crosses 30, 20, 10 and 5 left and at the limit, not on every key. A page that draws its own counter passes `[count]="false"`. `value` is a model: `<k-notes [rows]="4" [maxlength]="300" [(value)]="draft" ariaLabel="Reply" />`. Spec: kometa-notes.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-8.html (Whisper).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | model (two-way `[( )]`) | `string` | `''` |  |
| `rows` | input | `number` | `2` |  |
| `maxlength` | input | `number \| null` | `null` |  |
| `placeholder` | input | `string` | `''` |  |
| `ariaLabel` | input | `string` | `''` |  |
| `inputId` | input | `string` | `''` |  |
| `disabled` | input | `boolean` | `false` |  |
| `count` | input | `boolean` | `true` | Draw the near-the-limit count. Off for a page that has its own counter. |
| `readonly` | input | `boolean` | `false` |  |

## `k-number` — KometaNumber

The one number field: a whole number typed into a bare figure, with a hairline under it that draws itself on focus. Digits only; ArrowUp and ArrowDown step by `step` (Shift by ten times it) and stop at `min` and `max`. Typing never leaves the range in `value`: it is held at the nearest end while the box keeps what was typed, and the box catches up when focus leaves. An empty box is `null`, never 0: a price or a count nobody has typed yet must not be saved as zero. A pasted fraction is cut (whole numbers only). `money` groups the figure with a no-break space (ru-RU), floors it at 0 unless `min` says otherwise and fills its row; `suffix` is a unit word after it. `buttons` draws the minus and plus circles either side (a small count). It is a model (`[(value)]`) and a `ControlValueAccessor`, so `[(ngModel)]` and `[formControl]` work too. Spec: kometa-number.spec.ts.

Works with Angular forms (`formControl`, `formControlName`, `ngModel`).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | model (two-way `[( )]`) | `number \| null` | `null` |  |
| `min` | input | `number \| undefined` | `undefined` |  |
| `max` | input | `number \| undefined` | `undefined` |  |
| `step` | input | `number` | `1` |  |
| `suffix` | input | `string` | `''` |  |
| `placeholder` | input | `string` | `''` |  |
| `ariaLabel` | input | `string` | `''` |  |
| `inputId` | input | `string` | `''` |  |
| `money` | input | `boolean` | `false` |  |
| `buttons` | input | `boolean` | `false` | Draws the minus and plus circles either side of the figure. |
| `disabled` | input | `boolean` | `false` |  |
| `readonly` | input | `boolean` | `false` |  |
| `locale` | input | `string` | `'ru-RU'` | The locale `money` groups digits by. |

## `k-pager` — KometaPager

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `total` | input | `number` | **required** |  |
| `page` | model (two-way `[( )]`) | `number` | `1` |  |
| `pageSize` | model (two-way `[( )]`) | `number` | `10` |  |
| `sizes` | input | `readonly number[]` | `[10, 25, 50]` |  |
| `labels` | input | `Partial<KometaPagerLabels>` |  |  |
| `caption` | input | `boolean` | `true` | False hides the "1–25 / 134" caption. |

## `k-pair` — KometaPair

The footer of a confirm that destroys something: an equal pair, a quiet "keep it" beside a red "delete". The red is the primary because the action removes data, so no amber appears on that screen. The caller supplies both words (`keep`, `confirm`) in its language; the pair emits `kept` and `confirmed` and never decides anything. `busy` spins the red button and locks both (so a double tap cannot confirm twice) while the request runs. Use it in a dialog, tray or sheet footer; a non-destructive save and cancel keeps the filled amber button. Spec: kometa-pair.spec.ts. Lab: docs/superpowers/labs/2026-10-14-blend-ui-lab-round-11.html (B).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `keep` | input | `string` | **required** | The quiet side: "Keep it", "Cancel", in the caller's language. |
| `confirm` | input | `string` | **required** | The red side: "Delete", "Remove". |
| `busy` | input | `boolean` | `false` |  |
| `disabled` | input | `boolean` | `false` | Locks both buttons. |
| `confirmDisabled` | input | `boolean` | `false` | Locks only the confirm button, so "keep" still works (a form greying out Save). |
| `tone` | input | `"danger" \| "primary"` | `'danger'` | `primary` draws the confirm side in amber, for a pair that does not destroy anything. |
| `kept` | output | `void` |  |  |
| `confirmed` | output | `void` |  |  |

## `k-panes` — KometaPanes

Two panes side by side with a hairline between them that you drag to resize. The line is a dot until you hover it, then it grows to full height. With `snaps` (percentages of the width) the split only rests on those, and a row of ticks above marks them, the current one standing tall; an empty `snaps` lets it go anywhere between `min` and `max`. The line is a `role="separator"`: arrows step to the next snap (or by 5%), Home and End go to the ends. Put `kStart` on the first pane; everything else is the second. <k-panes [(size)]="split"><nav kStart>…</nav><article>…</article></k-panes> Give the host a height (`--panes-height`). Tests in kometa-panes.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `size` | model (two-way `[( )]`) | `number` | `50` | Width of the first pane, in percent. |
| `snaps` | input | `number[]` | `[25, 33, 50, 66, 75]` | Where the split may rest, in percent; empty for anywhere. |
| `min` | input | `number` | `15` |  |
| `max` | input | `number` | `85` |  |
| `ariaLabel` | input | `string` | `'Resize panes'` |  |

## `k-photos` — KometaPhotos

The full-screen photo viewer: a native modal `<dialog>` (top layer, Escape and focus handling free) with a dark backdrop, the photo large, the count ("3 / 12"), a toolbar (rotate left and right, zoom out and in, download), a Close word, Arrow keys and a swipe to move, and a strip of thumbnails when there is more than one. `open` is two-way; `index` says which photo. Spec: kometa-photos.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `photos` | input | `KometaPhoto[]` | `[]` |  |
| `open` | model (two-way `[( )]`) | `boolean` | `false` |  |
| `index` | model (two-way `[( )]`) | `number` | `0` |  |
| `closeLabel` | input | `string` | `'Close'` |  |
| `prevLabel` | input | `string` | `'Previous'` |  |
| `nextLabel` | input | `string` | `'Next'` |  |
| `ariaLabel` | input | `string` | `''` |  |
| `rotateLeftLabel` | input | `string` | `'Rotate left'` |  |
| `rotateRightLabel` | input | `string` | `'Rotate right'` |  |
| `zoomOutLabel` | input | `string` | `'Zoom out'` |  |
| `zoomInLabel` | input | `string` | `'Zoom in'` |  |
| `downloadLabel` | input | `string` | `'Download'` |  |
| `downloadable` | input | `boolean` | `true` | The download link in the toolbar. |
| `thumbs` | input | `boolean` | `true` | The strip of thumbnails under the photo. |
| `thumbLabel` | input | `string` | `'Photo {n}'` | Name of a thumbnail whose photo has no `alt`; `{n}` is its number. |

## `k-picker` — KometaPicker

The "choose a file" half of an upload: it opens the OS chooser and reports the files, nothing more (progress is `k-upload`'s, the presigned PUT is the page's). Two shapes, one frame language: `zone` is a corner-marked frame with a title and a hint, `button` is a small framed chip. The label wraps a real file input, so keyboard, focus and the accessible name are the browser's. The input is emptied after every pick, so choosing the same file twice still fires `picked`. Drops are the page's: it passes `over` while a file is dragged over its own drop target. Spec: kometa-picker.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-6.html (Frame).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `label` | input | `string` | **required** | The title of the zone, or the word on the button ("Rasm qo'shish"). |
| `hint` | input | `string` | `''` | The muted line under a zone's title; the button has none. |
| `variant` | input | `"button" \| "zone"` | `'button'` |  |
| `accept` | input | `string` | `''` |  |
| `ariaLabel` | input | `string` | `''` | Overrides the accessible name (default: the visible label text). |
| `name` | input | `string` | `''` | The file input's `name`, for a surrounding form. |
| `multiple` | input | `boolean` | `false` |  |
| `disabled` | input | `boolean` | `false` |  |
| `plus` | input | `boolean` | `false` | A "+" before the button's word, for the pickers that add to a list. |
| `over` | input | `boolean` | `false` | The page's own drop target has a file over it: the frame closes in and fills. |
| `picked` | output | `File[]` |  | Exactly what the OS chooser returned (no type check: a non-image is still the page's to refuse). |

## `k-pop` — KometaPop

A small panel hung off a button: a glass card in the browser's top layer (so a drawer or a card cannot clip it) that scales in under the button, flips above when there is no room below and is kept inside the viewport. The caller owns the button and the words; the panel is whatever is projected into it. <button (click)="pop.toggle($event)">…</button> <k-pop #pop ariaLabel="Shop">…</k-pop> `toggle(event)` anchors to the element the event is on (`show(el)` and `hide()` do the same by hand); `open` is two-way. Escape closes and hands focus back to the button, and does not reach a drawer behind it; a click outside, resize, scroll elsewhere and focus moving out of the panel close it without moving focus. The panel is a named dialog: `ariaLabel` or `ariaLabelledBy`. On open focus goes to the first control in it (`focusOnShow` false leaves that to the caller, who hears `opened`). The panel is at most 70% of the screen tall and scrolls inside itself; `width` fixes its width in pixels. Spec: kometa-pop.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-9.html (Glass).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `ariaLabel` | input | `string` | `''` |  |
| `ariaLabelledBy` | input | `string` | `''` |  |
| `width` | input | `number \| null` | `null` |  |
| `focusOnShow` | input | `boolean` | `true` |  |
| `offset` | input | `number` | `8` | Gap in pixels between the button and the panel. |
| `align` | input | `"end" \| "start"` | `'start'` | Which edge of the button the panel lines up with. |
| `open` | model (two-way `[( )]`) | `boolean` | `false` |  |
| `opened` | output | `void` |  | The panel is in place and visible. |

## `k-quiet` — KometaQuiet

Empty state: a Syne title and one muted sentence. No picture. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `title` | input | `string` | **required** |  |
| `hint` | input | `string` | `''` |  |

## `k-rating` — KometaRating

The rating, as the lab's "numerals" draws it: Syne 26px numerals in a radiogroup, the chosen one cream with a 5px bead under it, the others muted, and the word for the score below in Syne 18px. The caller supplies the words (Uzbek, Russian and English differ). `k-stars` still only displays a score; this one is how a score is given. A Signal Forms number control (`FormValueControl<number>`): 0 is "nothing chosen yet". Clicking the chosen numeral again leaves it chosen; a rating is not a toggle. Spec: kometa-rating.spec.ts, design in docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.

A Signal Forms control: bind it with `[formField]`.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | model (two-way `[( )]`) | `number` | `0` | 0 is nothing chosen; 1 to `max` is the score. |
| `max` | input | `number \| undefined` | `undefined` | The top score (default 5). The name is the Signal Forms contract's, so a `max()` rule on the field sets it. |
| `words` | input | `readonly string[]` | `[]` | One word per score, in order: `['Yomon', 'Past', 'Oʻrtacha', 'Yaxshi', 'Aʼlo']`. |
| `ariaLabel` | input | `string` | `''` |  |
| `showWord` | input | `boolean` | `true` | The word for the score under the numerals. |
| `disabled` | input | `boolean` | `false` | An input to receive the disabled status for the field. If implemented, the `Field` directive will automatically bind the disabled status from the bound field to this input. |
| `readonly` | input | `boolean` | `false` | An input to receive the readonly status for the field. If implemented, the `Field` directive will automatically bind the readonly status from the bound field to this input. |
| `required` | input | `boolean` | `false` | An input to receive the required status for the field. If implemented, the `Field` directive will automatically bind the required status from the bound field to this input. |
| `touched` | input | `boolean` | `false` | An input to receive the touched status for the field. If implemented, the `Field` directive will automatically bind the touched status from the bound field to this input. |
| `invalid` | input | `boolean` | `false` | An input to receive the invalid status for the field. If implemented, the `Field` directive will automatically bind the invalid status from the bound field to this input. |
| `touch` | output | `void` |  | Emitted on blur of a numeral, which is what marks a Signal Forms field touched. |

## `k-reorder` — KometaReorder

A list you put in order by dragging each row's grip. The row lifts off the page, tilts a little and casts a shadow while the others slide aside to make room. Each row is drawn by the template you project, with the item as `$implicit`. `items` is a model, so `[(items)]` gets the new order; `moved` says what went where. <k-reorder [(items)]="queue" [labelOf]="nameOf"><ng-template let-c>{{ c.name }}</ng-template></k-reorder> From the keyboard: Space or Enter on a grip picks the row up, the arrows move it, Space drops it, Escape puts it back; each step is announced. Rows are tracked by identity, so items must be distinct objects or values. Tests in kometa-reorder.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `items` | model (two-way `[( )]`) | `T[]` | **required** |  |
| `labelOf` | input | `(item: T) => string` | `(item) => String(item)` | How an item is named to a screen reader. |
| `grabLabel` | input | `string` | `'Move'` | Read before the item's name on each grip. |
| `messages` | input | `Partial<KometaReorderMessages>` |  |  |
| `ariaLabel` | input | `string` | `''` |  |
| `moved` | output | `{ from: number; to: number; }` |  | A row went from one position to another. |

## `k-reveal` — KometaReveal

A before and an after photo in one frame. A plain line crosses the photo; the control is a row of ticks beneath it, the ticks up to the line are cream and the one under it is tall. Drag along the ticks (or across the photo), or focus the ticks and use the arrow keys (Shift = 4 steps), Home and End. `position` is the share of the frame, 0 to 100, in steps of 5, that shows the before photo; it is a model. Spec: kometa-reveal.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-8.html (Ticks).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `before` | input | `string` | **required** |  |
| `after` | input | `string` | **required** |  |
| `beforeLabel` | input | `string` | `'Before'` |  |
| `afterLabel` | input | `string` | `'After'` |  |
| `ariaLabel` | input | `string` | `''` |  |
| `aspectRatio` | input | `string` | `'1'` | The frame's CSS aspect-ratio (`4 / 3`, `1`). |
| `showLabels` | input | `boolean` | `true` | The Before / After words under the ticks. |
| `position` | model (two-way `[( )]`) | `number` | `50` |  |

## `k-rules` — KometaRules

What a value still needs, as a row of words that strike through as each rule is met, with the same 1px line `k-check` draws through a done label. Put it under the field (`k-field type="password"`) and pass that field's value. A met rule also carries `doneLabel` for a screen reader. Tests in kometa-rules.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | input | `string` | `''` |  |
| `rules` | input | `KometaRule[]` | **required** |  |
| `doneLabel` | input | `string` | `'done'` | Read after a met rule. |
| `ariaLabel` | input | `string` | `''` |  |

## `k-rows` — KometaRows

The Blend glass panel that holds rows: a small muted caps `label` above it, a 1px hairline between the rows, inset 16px from the left. Rows are `k-row`. Semantics: a panel is `role="list"` and a row `role="listitem"`. A native `<dl>` cannot hold a custom element between itself and its `dt`/`dd`, so a fact row marks its label `term` and its value `definition` instead. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `label` | input | `string` | `''` | The tiny heading above the panel ("ACCOUNT"). |
| `ariaLabel` | input | `string` | `''` | The panel's name when it has no visible heading. |

## `k-row` — KometaRow

One row of a `k-rows` panel, in one of two modes. Fact: `label` plus the projected value, right-aligned and wrapping from the right edge. Setting: `title`, optional `meta` line, an optional leading tile (project `<… rowIcon>`; `tone` tints it), and the projected trailing content. A `link` (router commands), an `href` or `button` (with `(activated)`) makes the whole row one control, 56px tall, with a hover and pressed wash, a focus ring and a chevron (`[chevron]="false"` leaves it off). Without one the row is static and may hold its own controls (words, a switch). `tone="danger"` also reddens the title.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `label` | input | `string` | `''` | Fact mode: the caption on the left; the projected content is its value. |
| `title` | input | `string` | `''` | Setting mode: the bold title. |
| `meta` | input | `string` | `''` |  |
| `ariaLabel` | input | `string` | `''` | Overrides the accessible name of a row that is a link or a button. |
| `target` | input | `string` | `''` | Where an `href` row opens (`_blank` adds `rel=noopener`). |
| `tone` | input | `KometaRowTone` | `'neutral'` | Tints the leading tile; `red` is a red tile, `danger` a red tile and a red title. |
| `link` | input | `string \| readonly unknown[] \| null` | `null` | Router commands (or a path): the whole row becomes a `routerLink` anchor. |
| `href` | input | `string` | `''` | A plain URL: the whole row becomes an anchor (a static page, `mailto:`). |
| `button` | input | `boolean` | `false` | The whole row becomes a button that emits `activated`. |
| `disabled` | input | `boolean` | `false` |  |
| `chevron` | input | `boolean` | `true` |  |
| `activated` | output | `void` |  |  |

## `k-search` — KometaSearch

The search, as the lab's "search: whisper" draws it: the question is the type. No box, no ring, no fill, no magnifier. The placeholder is the question in Syne at 32% ink; under it a 1px hairline that grows into a 2px cream line on focus. A quiet "×" appears only once there is text. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4. It owns no handling of its own beyond `value`: the native `input`/`keydown`/`submit` events of the inner input bubble to the host, so a page's `(keydown.enter)` or an enclosing `<form>` works as it did on a bare `<input>`.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | model (two-way `[( )]`) | `string` | `''` |  |
| `placeholder` | input | `string` | `''` |  |
| `ariaLabel` | input | `string` | **required** |  |
| `clearLabel` | input | `string` | `''` | The "×" button's accessible name; without one the button is hidden from assistive tech (Escape clears natively). |
| `size` | input | `"md" \| "lg"` | `'md'` | `md` is a page toolbar (22px); `lg` is the lab's 42px hero. |
| `name` | input | `string` | `''` |  |
| `inputmode` | input | `string` | `''` |  |
| `maxlength` | input | `number \| null` | `null` |  |
| `disabled` | input | `boolean` | `false` |  |
| `readonly` | input | `boolean` | `false` |  |
| `clearable` | input | `boolean` | `true` | The "×" button once there is text. |
| `autofocus` | input | `boolean` | `false` | The page that IS a search (`/search`) opens with the cursor in the question. |

## `k-select` — KometaSelect

One choice from a list. The field is a line with the chosen word and a chevron; it opens a glass list in the browser's top layer (so a drawer or a card cannot clip it), flips above when there is no room below and is kept inside the viewport. The chosen row takes the 2px edge. Arrow keys, Home and End move, a letter jumps to the next row that starts with it, Enter or Space picks, Escape closes (and does not reach a drawer behind it), Tab, a click outside, resize and scroll elsewhere close it. `options` are objects read through `optionLabel` and `optionValue` (so a call site moves over as it is). With `group`, each option is a group read through `optionGroupLabel` and `optionGroupChildren`. `value` is matched with `===`; with no match the `placeholder` shows. `prefix` is a muted word before the choice ("Role: Owner"), and `pill` draws the field as a bordered pill for a toolbar instead of a form line. `inputId` lets a `<label for>` name the button; `ariaLabelledBy` names it by another element, and the choice is read after that name either way. Spec: kometa-select.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-9.html (Pane).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `options` | input | `readonly unknown[] \| null \| undefined` | `[]` |  |
| `optionLabel` | input | `string` | `'label'` |  |
| `optionValue` | input | `string` | `'value'` |  |
| `group` | input | `boolean` | `false` |  |
| `optionGroupLabel` | input | `string` | `'label'` |  |
| `optionGroupChildren` | input | `string` | `'items'` |  |
| `value` | model (two-way `[( )]`) | `any` | `null` |  |
| `placeholder` | input | `string` | `''` |  |
| `prefix` | input | `string` | `''` |  |
| `pill` | input | `boolean` | `false` |  |
| `ariaLabel` | input | `string` | `''` |  |
| `ariaLabelledBy` | input | `string` | `''` |  |
| `inputId` | input | `string` | `''` |  |
| `emptyLabel` | input | `string` | `''` | A muted line in the list when there are no options ("No results"). |
| `disabled` | input | `boolean` | `false` |  |

## `k-share` — KometaShare

One bar of how a whole divides, drawn as ticks: every slice is a run of ticks in its own colour, as `k-meter` draws its units. A legend under it lists every slice with its share and amount, so a slice too thin to see and a negative one the bar cannot draw are both still read. The legend is the truth, the colour is decoration. Hovering a legend row steps the other rows back. Read-only. `label` is the bar's accessible name. Spec: kometa-share.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-7.html (Ticks).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `segments` | input | `KometaShareSegment[]` | **required** |  |
| `label` | input | `string` | **required** |  |
| `legend` | input | `boolean` | `true` | The list of slices under the bar. |
| `percents` | input | `boolean` | `true` | The share ("42%") in each legend row. |
| `tickCount` | input | `number` | `TICKS` | How many ticks the bar is made of. |

## `k-skeleton` — KometaSkeleton

Loading placeholder with no blocks: a hairline disc and hairlines that draw themselves, row by row. `shape="line"` is one hairline with a bright stretch sliding along it, for a table cell: it takes the cell's width (or `width`), keeps no height of its own and says nothing to a screen reader (the table's wrapper does). Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md, "Skeleton: hair".

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `rows` | input | `number` | `3` | List rows to draw (shape `rows` only; a card is always one frame). |
| `avatar` | input | `boolean` | `true` | The leading disc of a row (shape `rows`). |
| `lines` | input | `number` | `2` | Hairlines per row (shape `rows`). |
| `shape` | input | `"rows" \| "card" \| "line"` | `'rows'` |  |
| `width` | input | `string` | `'100%'` | The hairline's width (shape `line` only), as a CSS length: a share of the cell, say `72%`. |
| `delay` | input | `number` | `0` | Milliseconds to wait before the glint starts, so a column of cells does not move as one. |
| `ariaLabel` | input | `string` | `''` | The caller's word for "loading" ("Yuklanmoqda"); the component holds no text. |

## `k-slider` — KometaSlider

A value chosen by dragging along a row of ticks: the ticks up to the value stand tall and cream, the rest lie short and dim, the way `k-meter` draws a count. A Syne figure "12 / 20 km" sits above. The tick row is the `role="slider"`: arrows step, PageUp/PageDown move a tenth, Home/End jump to the ends. Above 40 steps it draws 25 ticks and scales; the figure stays exact. A Signal Forms control (`value` model plus `disabled` input). Tests in kometa-slider.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | model (two-way `[( )]`) | `number` | `0` |  |
| `min` | input | `number` | `0` |  |
| `max` | input | `number` | `20` |  |
| `step` | input | `number` | `1` |  |
| `unit` | input | `string` | `''` | The unit after the figure, e.g. "km". |
| `disabled` | input | `boolean` | `false` |  |
| `showFigure` | input | `boolean` | `true` | False hides the figure and leaves the ticks (the value is still read aloud). |
| `ariaLabel` | input | `string` | `''` |  |
| `ariaLabelledBy` | input | `string` | `''` |  |

## `k-slots` — KometaSlots

Free times as glass chips; the chosen one gets an amber edge, never an amber fill. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md, "Time: slots".

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `slots` | input | `readonly KometaSlot[]` | **required** |  |
| `value` | model (two-way `[( )]`) | `string` | `''` |  |
| `ariaLabel` | input | `string` | `''` |  |
| `clearable` | input | `boolean` | `false` | A second tap on the chosen chip clears it (`value` becomes ''), for a grid that holds a time before it commits. |
| `disabled` | input | `boolean` | `false` | Disables every chip. |

## `k-sort` — KometaSort

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `options` | input | `readonly KometaSortOption[]` | **required** |  |
| `key` | input | `string` | `''` |  |
| `dir` | input | `"asc" \| "desc"` | `'asc'` |  |
| `ariaLabel` | input | `string` | `''` |  |
| `ascGlyph` | input | `string` | `'↑'` | The glyphs after the active word. |
| `descGlyph` | input | `string` | `'↓'` |  |
| `pick` | output | `string` |  |  |

## `th[kometaSortHeader]` — KometaSortHeader

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `kometaSortHeader` | input | `string` | **required** | This column's key. |
| `active` | input | `string` | `''` | The key the list is sorted by now. |
| `dir` | input | `"asc" \| "desc"` | `'asc'` |  |
| `ascGlyph` | input | `string` | `'↑'` |  |
| `descGlyph` | input | `string` | `'↓'` |  |
| `pick` | output | `string` |  |  |

## `k-split` — KometaSplit

Two Syne figures side by side. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `left` | input | `KometaSplitSide` | **required** |  |
| `right` | input | `KometaSplitSide` | **required** |  |
| `align` | input | `"start" \| "center"` | `'start'` |  |

## `k-stars` — KometaStars

Five inline stars. `value` (clamped 0–max) rounds to the nearest half: whole stars filled, a half star filled on its left, the rest outlines. `label` is the accessible name, so the dictionary owns the words. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | input | `number` | `0` |  |
| `label` | input | `string` | **required** |  |
| `max` | input | `number` | `5` | How many stars (default 5). |
| `size` | input | `number \| null` | `null` | Star size in pixels; null keeps the CSS (`--stars-size`, 16px). |

## `k-stepper` — KometaStepper

A number between two hairline circles (minus, plus). The figure rolls when it changes and a circle dims at its limit. Words (unit, button labels) come from the caller. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4; tests in kometa-stepper.spec.ts.

A Signal Forms control: bind it with `[formField]`.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | model (two-way `[( )]`) | `number` | `0` | The value is the only required property in this contract. A component that wants to integrate with the `Field` directive via this contract, *must* provide a `model()` that will be kept in sync with the value of the bound `FieldTree`. |
| `min` | input | `number \| undefined` | `0` | `undefined` (what `[formField]` binds with no validator) falls back to 0 and no upper limit. |
| `max` | input | `number \| undefined` | `undefined` | An input to receive the max value for the field. If implemented, the `Field` directive will automatically bind the max value from the bound field to this input. |
| `step` | input | `number` | `1` |  |
| `unit` | input | `string` | `''` | Muted word after the figure, e.g. "daq". |
| `ariaLabel` | input | `string` | `''` |  |
| `decrementLabel` | input | `string` | `''` |  |
| `incrementLabel` | input | `string` | `''` |  |
| `disabled` | input | `boolean` | `false` | An input to receive the disabled status for the field. If implemented, the `Field` directive will automatically bind the disabled status from the bound field to this input. |
| `readonly` | input | `boolean` | `false` | Keeps the figure focusable and announced but stops every change. |
| `decrementIcon` | input | `string` | `'−'` | The glyphs inside the two circles. |
| `incrementIcon` | input | `string` | `'+'` |  |
| `touched` | input | `boolean` | `false` | An input to receive the touched status for the field. If implemented, the `Field` directive will automatically bind the touched status from the bound field to this input. |
| `touch` | output | `void` |  | Emitted when focus leaves a circle or the figure, which is what marks a Signal Forms field touched. |

## `k-steps` — KometaSteps

A vertical rail of named steps with one cream bead that travels down to the current one. Read-only progress, not navigation: an `<ol>`, `aria-current="step"` on the current row. `current` is 1-based. The row height is `--steps-row` (default 30px); the bead's travel is that variable times the index, so the two cannot drift. A long label scrolls the box sideways instead of wrapping (a wrapped row would break the bead's arithmetic). Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md; tests in kometa-steps.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `steps` | input | `readonly string[]` | **required** | The step names, in order; the caller's words. |
| `current` | input | `number` | `1` | 1-based; clamped into the list. |
| `ariaLabel` | input | `string` | `''` |  |

## `k-suggest` — KometaSuggest

A text field that offers people while you type. The field is a plain `<input>` (the console's underlined field draws it), free text always: a word nobody has is simply what was typed. From `minLength` letters, after `delay` ms of quiet, `(query)` fires with the text and the page answers by setting `suggestions`; the list is a glass panel in the browser's top layer under the field (so a sheet cannot clip it), flips above when there is no room, and the field keeps focus (`aria-activedescendant`): Arrow keys move over the rows, Enter picks, Escape or a click outside closes. `(picked)` carries the chosen row; the field then holds its label. Spec: kometa-suggest.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | model (two-way `[( )]`) | `string` | `''` |  |
| `suggestions` | input | `KometaSuggestion<unknown>[]` | `[]` |  |
| `inputId` | input | `string` | `''` |  |
| `ariaLabel` | input | `string` | `''` |  |
| `placeholder` | input | `string` | `''` |  |
| `minLength` | input | `number` | `2` |  |
| `delay` | input | `number` | `300` | Milliseconds of quiet before `(query)` fires. |
| `disabled` | input | `boolean` | `false` |  |
| `readonly` | input | `boolean` | `false` |  |
| `optionTemplate` | input | `TemplateRef<{ $implicit: KometaSuggestion; }> \| null` | `null` | Draws a row itself; the context's `$implicit` is the suggestion. |
| `query` | output | `string` |  |  |
| `picked` | output | `KometaSuggestion<unknown>` |  |  |

## `k-swipe` — KometaSwipe

A row you swipe to act on. Swipe right and a row of ticks fills as you pull; let go with them all lit and `swipedRight` fires (marking a visit done, say). Swipe left and a ring grows under the row, turns red past halfway, and on release the row slides away and `swipedLeft` fires (cancel, delete): remove the item then, or the row slides back. Each side is on when it has a label. The row's content is projected. <k-swipe rightLabel="Done" leftLabel="Cancel visit" (swipedRight)="done(v)" (swipedLeft)="cancel(v)">…</k-swipe> Swiping is only a shortcut: each action is also a button under the row, reached with Tab (the row slides aside to show it) and read by a screen reader by its label. Vertical scrolling is left to the page. Tests in kometa-swipe.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `rightLabel` | input | `string` | `''` | The word for a swipe right, beside the ticks; empty turns that side off. |
| `leftLabel` | input | `string` | `''` | Names the swipe-left action for a screen reader; empty turns that side off. |
| `leftIcon` | input | `string` | `'✕'` | Drawn in the ring under a swipe left. |
| `ticks` | input | `number` | `12` | How many ticks fill on the way to a swipe right. |
| `swipedRight` | output | `void` |  |  |
| `swipedLeft` | output | `void` |  |  |

## `k-tabbar` — KometaTabbar

A floating glass capsule of icon tabs; the chosen one opens to show its word. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md, "Tab bar: glass".

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `tabs` | input | `readonly KometaTab[]` | **required** |  |
| `value` | model (two-way `[( )]`) | `string` | `''` | The chosen tab's `value`. A link bar is driven by the router: the caller sets this from the URL. |
| `ariaLabel` | input | `string` | `''` |  |
| `labels` | input | `"active" \| "all"` | `'active'` | `active` opens only the chosen tab's word; `all` keeps every word open. |
| `iconTemplate` | input | `TemplateRef<{ $implicit: KometaTab; }> \| null` | `null` | Draws a tab's icon (the customer's `app-icon`, say); the context's `$implicit` is the tab. |

## `k-table` — KometaTable

A plain `<table>` drawn with our classes, for the lists the consoles show: it keeps the part of its API the pages used, so a page changes its tag and keeps its templates. <k-table class="tbl" [value]="rows" dataKey="id"> <ng-template #header><tr><th>…</th></tr></ng-template> <ng-template #body let-row><tr><td>{{ row.name }}</td></tr></ng-template> <ng-template #emptymessage><tr><td colspan="3">Nothing yet</td></tr></ng-template> </k-table> The templates write their own `<tr>`s. `dataKey` (a dotted path) keys the rows; `groupRowsBy` draws a `#groupheader` row whenever that field changes; `tableStyleClass` and `tableStyle` land on the `<table>`; `scrollHeight` caps the height, scrolls inside it and pins the header. Sorting and paging stay the pages' own (`kometaSortHeader`, `k-pager`). Hairlines, the quiet header and the tabular figures are base rules at no specificity, so a page's own cell rules win. Spec: kometa-table.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | input | `any[]` | `[]` |  |
| `dataKey` | input | `string` | `''` |  |
| `groupRowsBy` | input | `string` | `''` |  |
| `tableStyleClass` | input | `string` | `''` |  |
| `tableStyle` | input | `Record<string, string> \| null` | `null` |  |
| `scrollHeight` | input | `string \| null` | `null` |  |
| `size` | input | `"md" \| "sm"` | `'md'` | `sm` tightens cell padding. |
| `striped` | input | `boolean` | `false` |  |
| `hoverable` | input | `boolean` | `false` | Tints the row under the pointer. |
| `ariaLabel` | input | `string` | `''` |  |

## `k-tally` — KometaTally

A figure that counts to its new value instead of jumping, in Syne, with a row of ticks underneath that fills to match when it has a `max`. Change `value` and it counts from where it was (ease-out, `duration` ms). A screen reader hears only the final value, not every step. Reduced motion jumps straight there. <k-tally [value]="visits()" [max]="60" unit="of 60 visits" /> Tests in kometa-tally.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `value` | input | `number` | `0` |  |
| `max` | input | `number \| null` | `null` | The value the ticks fill to; null draws no ticks. |
| `ticks` | input | `number` | `30` |  |
| `unit` | input | `string` | `''` | Words after the figure (`visits`, `of 60 visits`, `k so'm`). |
| `duration` | input | `number` | `900` | How long the count takes, in ms. |
| `locale` | input | `string \| undefined` | `undefined` | The locale for grouping digits (`ru-RU` writes 12 480); the browser's own when unset. |

## `k-tag` — KometaTag

A status mark: a state-coloured dot and a word, no container (round 14, S Dot and word: a column of them reads as words, not boxes). Not a button. `now` is amber (a dot, never a fill), `wait` blue, `book` muted, `done` green, `warn` and `error` red. The word is projected: `<k-tag tone="wait">Kutmoqda</k-tag>`. Spec: kometa-tag.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `tone` | input | `KometaTagTone` | `'book'` |  |
| `dot` | input | `boolean` | `true` | `false` leaves the word alone, coloured by its tone. |

## `k-tick` — KometaTick

A checkbox: a hairline ring that fills with ink while the tick draws itself in. A real `<button role="checkbox" aria-checked>`, so Space and Enter toggle natively. It has no label of its own: name it with `ariaLabel`, `ariaLabelledBy` or a `<label for>` and `inputId`. For a row whose words are the control, with no ring, see `k-check`. Spec: kometa-tick.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-9.html (Ring).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `checked` | model (two-way `[( )]`) | `boolean` | `false` |  |
| `ariaLabel` | input | `string` | `''` |  |
| `ariaLabelledBy` | input | `string` | `''` |  |
| `inputId` | input | `string` | `''` |  |
| `disabled` | input | `boolean` | `false` |  |
| `invalid` | input | `boolean` | `false` |  |
| `readonly` | input | `boolean` | `false` | Shows the state but ignores presses. |

## `k-time` — KometaTime

A time of day. The time is a figure with a hairline under it, like `k-date`; it opens a glass list of times in the browser's top layer (so a drawer cannot clip it), flips above when there is no room below and is kept in the viewport. `step` is the minutes between the times listed (15 unless set); a time already held that is off the grid (09:07) is listed too, so nothing is lost by opening it. Arrow keys move over the list, Enter picks, Tab moves to Clear (when there is one), and Escape, Tab out, a click outside, resize and scroll close it. With `clearable` a held time can be taken away again (the value is `null`). It holds a `Date` (only the hours and minutes matter, the date part is fixed by `dateAt`), so `[ngModel]`, `(ngModelChange)` and `[formControl]` replace it one for one. Spec: kometa-time.spec.ts.

Works with Angular forms (`formControl`, `formControlName`, `ngModel`).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `step` | input | `number` | `15` |  |
| `ariaLabel` | input | `string` | `''` |  |
| `inputId` | input | `string` | `''` |  |
| `placeholder` | input | `string` | `'—'` | Shown when there is no value. |
| `clearable` | input | `boolean` | `false` |  |
| `clearLabel` | input | `string` | `'Clear'` |  |
| `disabled` | input | `boolean` | `false` |  |

## `[kometaTip]` — KometaTip

A tooltip in place of the browser's slow, unstyled `title` box. Put it on the element that carries the meaning: <button [kometaTip]="S.delete" aria-label="…">…</button> <span [kometaTip]="shop.name" [kometaTipSub]="S.shopNameFull">…</span> It is the lab's Note: a small glass card beside the element, an ink rule on its edge, a name and an optional second line. A hover shows it after a short pause (none when you are moving between neighbours), keyboard focus shows it at once, and Escape, leaving, scrolling and pressing all hide it. The pointer can move onto the tip and it stays while hovered (WCAG 1.4.13). A null or empty `kometaTip` shows nothing, so `[kometaTip]="collapsed() ? name : null"` is a tooltip only while collapsed. The tip is described-by on the element while it is up, but it does not name it: an icon-only control still needs its own `aria-label`. A phone shows it on a tap of a plain element (a cell, a label); a button or link already does what it says, so a tap runs it and no tip appears. Spec: kometa-tip.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-10.html (Note).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `kometaTip` | input | `string \| null \| undefined` | `''` |  |
| `kometaTipSub` | input | `string \| null \| undefined` | `''` |  |
| `kometaTipDelay` | input | `number` | `380` | Milliseconds of hover before the tip shows (none when moving between neighbours). |
| `kometaTipAnimation` | input | `"" \| KometaAnimation` | `''` | The motion it appears with: a preset from KOMETA_ANIMATIONS or your own keyframes name. |

## `k-toast` — KometaToast

The short word that confirms a save or reports a failure. A thread of glass pills stacks up from the foot of the page, in the browser's top layer so no drawer covers it; a hairline under each drains with the time it has left, and a toast under the pointer waits. The caller owns the list: it passes `items` and removes an item on `(dismiss)`, which fires when the time is up (after the leave), the pill is pressed or its close button is used. The text of an error is `role="alert"`, the rest `status`; the timer also waits while focus is inside the pill, so a keyboard user can reach the close button (named by `closeLabel`). The thread is a region named `label`; Alt plus the `hotkey` letter (Alt+T unless set, `''` turns it off) jumps to the newest toast's close button, and Escape there goes back to where focus was. When a focused toast leaves, focus moves to the next toast, or back to where it came from. A page with a bottom bar of its own sets `--kometa-toast-lift` to the bar's height so the thread rides above it. Spec: kometa-toast.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-8.html (Thread).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `items` | input | `KometaToastItem[]` | **required** |  |
| `dismiss` | output | `number` |  |  |
| `position` | input | `"bottom" \| "top"` | `'bottom'` | Which edge the thread stacks from. |
| `closeLabel` | input | `string` | `'Dismiss'` | Accessible name of each toast's close button. |
| `label` | input | `string` | `'Notifications'` | Name of the region the toasts sit in. |
| `hotkey` | input | `string` | `'t'` | Alt plus this letter focuses the newest toast; `''` turns it off. |

## `k-toggle` — KometaToggle

An on/off switch whose state is a word in Syne: the on word goes cream and a 1px cream line draws under it. The caller supplies both words. A Signal Forms boolean control (`checked` model plus `disabled` input), so `[formField]` binds it like a checkbox. Spec: kometa-toggle.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `checked` | model (two-way `[( )]`) | `boolean` | `false` |  |
| `onLabel` | input | `string` | `''` |  |
| `offLabel` | input | `string` | `''` |  |
| `disabled` | input | `boolean` | `false` |  |
| `ariaLabel` | input | `string` | `''` | Names the switch for a screen reader; the visible word is only its state. |
| `ariaDescribedBy` | input | `string` | `''` | The id of the element that explains the switch. |
| `ariaLabelledBy` | input | `string` | `''` | The id of the element that names the switch. |

## `k-trail` — KometaTrail

A list of things in the order they happened, one `k-step` each. The time is a large figure; the content is whatever the page projects; and the wait to the next step is written on the dashed line that joins them (`gap`, e.g. "32 min"): the wait is the story. The steps rise in one after another when the trail appears. Spec: kometa-trail.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-8.html (Gaps).

## `k-step` — KometaStep

One step of a `k-trail`. Content is projected after the time; `gap` is drawn under the step.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `time` | input | `string` | **required** |  |
| `gap` | input | `string \| null` | `null` | The wait before the next step, already in words ("32 min"); nothing when there is none to say. |

## `k-tree` — KometaTree

A tree drawn as columns: pick a word and its children slide in as the next column, each behind a hairline. The chosen word in every column goes cream. `path` holds the chosen index per column. Keys: Up/Down move in a column, Right opens a branch and steps into it, Left steps back. Tests in kometa-tree.spec.ts.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `nodes` | input | `KometaTreeNode[]` | **required** |  |
| `path` | model (two-way `[( )]`) | `number[]` | `[]` | The chosen index in each column, outermost first. |
| `ariaLabel` | input | `string` | `''` |  |
| `picked` | output | `KometaTreeNode` |  | A word was picked, branch or leaf. |

## `k-tray` — KometaTray

The page's one confirm question, drawn as the lab's Tray: two wide answers rise from the bottom of the screen on a phone and sit as a centred card on a desktop. It listens to `KometaConfirmationService`, so every `confirm({ header, message, acceptLabel, rejectLabel, acceptButtonProps, accept, reject })` call in the app is unchanged. A `danger` accept is red and goes first; the other answer is quiet under it. It is a native modal `<dialog>`: the browser makes the rest of the page inert, traps Tab, closes on Escape and draws the top layer, and the exit is a CSS transition (an engine without `allow-discrete` simply closes at once). Escape, a click on the dark area and the quiet answer all call `reject`. Focus goes to the heading, not to either answer. A request carrying a `key` belongs to some other dialog and is ignored. Spec: kometa-tray.spec.ts. Lab: docs/superpowers/labs/2026-10-13-blend-ui-lab-round-10.html (Tray).

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `backdropClose` | input | `boolean` | `true` | `false` keeps the question open when the dark area is clicked (Escape and the quiet answer still reject). |

## `k-upload` — KometaUpload

The upload zone, as round 10's "Fill" draws it: a dashed box that fills from the bottom (`scaleY(progress)`) behind the file's name and size, a Syne 44px tabular percentage, then the status line and one quiet text button. It is a display. The page runs the real upload and feeds `progress` and `state`; the button only says `(action)` (cancel while running, retry once failed: the page decides which). Spec: kometa-upload.spec.ts, design in docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `name` | input | `string` | **required** | The file's name, shown bold. |
| `sizeLabel` | input | `string` | `''` | Already formatted by the page ("1.8 MB"); the piece never formats a size. |
| `progress` | input | `number` | `0` | 0 to 1. A `done` upload always draws full. |
| `state` | input | `"done" \| "idle" \| "running" \| "failed"` | `'idle'` |  |
| `statusLabel` | input | `string` | `''` | The muted line ("Yuklandi"); in the error colour when `state` is `failed`. |
| `actionLabel` | input | `string` | `''` | The quiet text button ("Bekor qilish", "Qayta urinish"). Empty means no button. |
| `ariaLabel` | input | `string` | `''` | The progressbar's accessible name; the file name when empty. |
| `showPercent` | input | `boolean` | `true` | `false` hides the big percentage (the fill and the progressbar remain). |
| `action` | output | `void` |  | The button was pressed. Cancel or retry is the page's decision. |

## `k-wait` — KometaWait

Loading state: the label stays, and a short line travels under it. Spec: docs/superpowers/specs/2026-10-12-blend-shared-ui-design.md §4.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `label` | input | `string` | **required** |  |

## `k-provider-logo` — ProviderLogo

Click's or Payme's own mark, verbatim from the vendor's brand kit — never redrawn or recoloured. Always on a small white plate: Payme's "me" block is black and vanishes on a dark surface, and either mark vanishes on its own brand-filled button (`a.primary.click`, the console's `.brand` chips). The art may not change, so the surface under it does; both get it so the pair matches. `aria-hidden` because every caller keeps the text label that already names the provider. Sized in `em`, so it follows the label it sits beside. `provider` takes the wire's `'Click' | 'Payme'` as well as the vendor console's lower-case ids. Telegram, Google and Instagram are gradient art (several kB each), so they are NOT inlined: the app ships them as static files, `brand/*.svg` (not part of this kit), loaded by a relative `<img>` that honours the app's `<base href>`. Inlining them would put their bytes in every chunk that imports this component.

| Name | Binding | Type | Default | Notes |
|---|---|---|---|---|
| `provider` | input | `string` | **required** |  |

