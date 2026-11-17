# Changelog

Each release has full notes, with migration steps when needed, on
[GitHub Releases](https://github.com/InomjonIsmaylov/kometa-ui-kit/releases).

## Compose 0.4.0 (2026-11-17)

**Breaking for the dependency line only.** The Compose port moves from GitHub Packages (`uz.kometa:kometa-ui`) to
Maven Central as `io.github.inomjonismaylov:kometa-ui`, so no token or extra repository is needed. The Kotlin
package stays `uz.kometa.ui`.

- Built with Kotlin 2.3.21 and Compose Multiplatform 1.11.1 (was 2.1.0 / 1.7.3). Apps need Kotlin 2.2+, Compose
  1.11+, AGP 8.6+ and compileSdk 35+; the desktop jar targets Java 17. The `iosX64` target (Intel-Mac simulators)
  is dropped.
- `KometaStrings`: every word the kit says on its own, set once with `KometaTheme(strings = ...)`; a label passed
  to a component still wins.
- Explicit-API mode and a recorded public API (`kometa-ui/api/`), checked on every push.
- The published POM names the MIT license, source repository and developer; artifacts are signed and ship with
  sources and a Dokka javadoc jar.

## Unreleased

- `[kometaTip]`: its global `<style>` tag takes Angular's `CSP_NONCE`, so tooltips stay styled under a strict
  Content-Security-Policy (the motion keyframes already did).
- `SECURITY.md`: how to report a vulnerability, and which versions get fixes.

## 0.4.0 (2026-11-17)

**Breaking.** `k-button` is an attribute on a native `<button>` or `<a>` instead of a wrapper element:
`<button k-button (click)="save()">Save</button>`, `<a k-button href="/book">Book</a>`.

- Every native attribute, event and focus works with no extra input (`type`, `disabled`, `aria-*`, `form`, `class`).
  A `<button k-button>` with no `type` is still `type="button"`.
- `loading` no longer disables the button: it sets `aria-busy` / `aria-disabled` and swallows the click (and a link's
  navigation), so focus stays where it was.
- Migration: `<k-button label="Save" (clicked)="save()" />` → `<button k-button (click)="save()">Save</button>`
  (`ariaLabel` → `aria-label`, `styleClass` → `class`). For one minor release the old element still works if you import
  `KometaButtonElement` instead of `KometaButton`. CSS that targeted the `k-button` element should target `.kbtn`.

## 0.3.0 (2026-11-12)

- `ng add kometa-ui` sets up the layer order and base styles (at the top of the global `.scss` stylesheet, or first
  in `angular.json` `styles` for a CSS-only app) and adds `provideKometaUi()`. Running it again changes nothing.
- A StackBlitz starter in `examples/starter`.
- `ai/components.md` now tells agents to import from entry points (`kometa-ui/button`), as `ai/usage.md` already did.
- Accessibility fixes (see `ACCESSIBILITY.md`):
  - `k-toast`: each toast has a close button (`closeLabel`, default "Dismiss"), and its timer waits while focus is
    inside it as well as under the pointer. The role now sits on the toast's text, and the thread is no longer an
    `aria-live` region as well, so a toast is not announced twice. The thread is a region named `label`
    ("Notifications"); Alt+T (`hotkey`, `''` turns it off) jumps to the newest toast and Escape goes back. When a
    focused toast leaves, focus moves to the next toast or back to where it came from, not to the page body.
  - `k-time`: Tab moves from the times to Clear and Shift+Tab back, so Clear is reachable by keyboard.
  - `k-banner`: `dismissible` without `closeLabel` draws × named "Dismiss" instead of an empty, unnamed button.
  - `k-confirm`: when focus was inside as the panes swap, it moves to the first focusable element of the pane shown.
  - `[kometaTip]`: the pointer can move onto the tip and it stays while hovered; Escape hides it wherever focus is
    (WCAG 1.4.13).
  - `k-photos`: a thumbnail of a photo without `alt` is named "Photo {n}" (`thumbLabel`).
  - `k-code`: `cellLabel` defaults to "Digit", so cells are named "Digit 1"… (was unnamed).
  - `k-link`: "copied" is also said through a polite live region.
  - `k-notes`: the count is announced as it crosses 30, 20, 10 and 5 left and at the limit, not on every key.

## 0.2.0 (2026-11-11)

- One entry point per component, `kometa-ui/<name>` (85 in all). Through the single `kometa-ui` barrel every kit
  component a lazy route used landed in the app's initial chunk; Kometa's admin app went from 514.83 kB to
  436.93 kB. No breaking change: `kometa-ui` still re-exports everything.

## 0.1.1 (2026-11-11)

- Docs for AI coding agents ship in the package: `ai/usage.md` and the generated `ai/components.md`.
- `k-toggle` without on/off labels draws a track and knob; it used to render nothing visible.
- Inputs no longer render `id="null"` when no id is given (date, multi, notes, number, suggest, tick, time).
- `k-split` panes wrap onto a new row when there is no room.

## 0.1.0

- First tagged release: 89 standalone, OnPush components and directives with the `k-` prefix, light and dark
  themes from CSS custom properties, motion presets, and the Manrope and Syne fonts (SIL OFL 1.1).
