# Changelog

Each release has full notes, with migration steps when needed, on
[GitHub Releases](https://github.com/InomjonIsmaylov/kometa-ui-kit/releases).

## Unreleased

- `ng add kometa-ui` sets up the layer order and base styles (at the top of the global `.scss` stylesheet, or first
  in `angular.json` `styles` for a CSS-only app) and adds `provideKometaUi()`. Running it again changes nothing.
- A StackBlitz starter in `examples/starter`.
- `ai/components.md` now tells agents to import from entry points (`kometa-ui/button`), as `ai/usage.md` already did.

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
