# AGENTS.md

Guidance for AI coding agents (Claude Code, Codex, Cursor, Copilot...) working on this repository.
`CLAUDE.md` only imports this file. Agents *using* the published package read `projects/kometa-ui/ai/` instead.

## What this is

Kometa's Angular 22 UI kit (no PrimeNG dependency), extracted from an app that still keeps its own copy;
**nothing here is linked back to it**, so a fix in one does not reach the other.
Git repo on `main`, pushed to the GitHub repo `InomjonIsmaylov/kometa-ui-kit`. MIT licensed; the fonts in
`styles/fonts` are OFL 1.1 (`OFL.txt` beside them). Every push to `main` runs `.github/workflows/pages.yml`:
the specs, then the demo built with `--base-href /<repo>/` and deployed to GitHub Pages.

## Commands

```bash
npm run build                     # ng build -> builds kometa-ui (ng-packagr) into dist/kometa-ui
npm start                         # ng serve demo, port 4200 (also .claude/launch.json "demo")
npm test                          # ng test (vitest + jsdom); library only, the demo has no specs
npx ng test kometa-ui --watch=false --include='**/kometa-button.spec.ts'   # one spec file
npx ng build demo                 # production build of the demo
npm run pack:lib                  # build the library and pack dist/kometa-ui into a .tgz to inspect
```

Pin `jsdom@^28` and `vitest@^4`. Newer majors (jsdom 30, vitest 5) fail 8 specs, e.g. `k-time.spec.ts` focus behaviour.

## Architecture

- **Two projects** in one workspace: `projects/kometa-ui` (the library) and `projects/demo` (showcase app).
- The demo imports the library **from source**: `tsconfig.json` maps `kometa-ui` to `projects/kometa-ui/src/public-api.ts`, so no library rebuild is needed while developing. Its `styles.scss` `@use`s the library styles by relative path.
- **One secondary entry point per source file** (since 0.2.0): `projects/kometa-ui/<entry>/` holds `kometa-<entry>.ts`, its spec, an `index.ts` (`export *` of the file) and an `ng-package.json` (`entryFile: index.ts`); it publishes as `kometa-ui/<entry>` (`kometa-ui/button`, `kometa-ui/paging`, `kometa-ui/provide-kometa-ui`). One entry imports another **by package path, never relatively** (`from 'kometa-ui/motion'`; ng-packagr refuses a relative import across entry points). `tsconfig.json` maps `kometa-ui/*` to `projects/kometa-ui/*/index.ts`; the test `include` in `angular.json` adds `../*/*.spec.ts`. `src/public-api.ts`, the primary entry, re-exports every entry, so `from 'kometa-ui'` still works, **but an app should import entries**: a bundler places one module's code in one chunk, so through the single barrel every kit component a lazy route uses lands in the app's initial chunk (Kometa admin: initial chunk 514.83 kB, 436.93 kB with entry imports). `src/lib/` keeps only `test-setup.ts` and the two cross-component specs. To add a component: the folder with those four files, plus an `export *` line in `src/public-api.ts`.
- Element selectors use the `k-` prefix (`<k-button>`, `button[k-halo]`); files, classes and CSS vars keep `kometa-`/`Kometa`. Components are standalone and OnPush, mostly with default (emulated) encapsulation (button, drawer, rows and table use `ViewEncapsulation.None`), with styles written inline using `:where()` so consumer CSS wins without specificity fights. They read CSS custom properties from `projects/kometa-ui/styles/tokens.scss` (`--amber`, `--bg`, `--text`...), including light/dark schemes.
- No PrimeNG (removed 2026-11-11). `provideKometaUi()` (`lib/provide-kometa-ui.ts`) is empty, kept so app configs need no change. `k-tray` listens to `KometaConfirmationService` (`confirm({ header, message, acceptLabel, rejectLabel, acceptButtonProps, accept, reject })`). Outputs: `k-button` `(clicked)`, `k-drawer` `(opened)` / `(closing)` / `(kometaSheetClosed)`.
- **SCSS everywhere.** Styles files are `.scss` and `inlineStyleLanguage` is `scss`; the one exception is `styles/kometa-theme.css`, a Tailwind v4 `@theme` file that Tailwind must read as plain CSS. Tests compile inline styles through Sass too, which drops quotes in attribute selectors (`[data-surface=glass]`), so specs that regex-match component CSS must accept both forms. Specs read a component's CSS from `ɵcmp.styles` with `%NS%` stripped (`var(--%NS%x)` → `var(--x)`), never from the page's `<style>` tags: the test document is shared across spec files, so those tags come and go with other fixtures and made specs flaky.
- **CSS layer order is a contract:** the consuming app's stylesheet must `@use 'kometa-ui/styles/layers'` first (`@layer theme, base, legacy, components, utilities;`, matching `KOMETA_LAYER_ORDER`). Sass forbids a bare `@layer` statement before `@use`, hence the file. The demo's `styles.scss` does this.
- Styles and fonts ship as library assets (`ng-package.json` `assets: ["styles/**/*"]`) and are used by consumers as `@use 'kometa-ui/styles/<name>'`. The package `exports` map `./styles/*` (a `sass` condition adds `.scss`), so `@use` without an extension and `kometa-theme.css` both resolve; checked with a throwaway app built against the packed tarball.
- **Publishing**: npm package `kometa-ui`, published from `dist/kometa-ui` by `.github/workflows/publish.yml` when a `v<version>` tag matching `projects/kometa-ui/package.json` is pushed (npm trusted publishing, provenance). Bump that version, never the root `package.json` (private). See "Releasing" below.
- **Agent docs for consumers**: `projects/kometa-ui/ai/usage.md` is hand-written; `ai/components.md` is generated by `npm run api`
  from the class and input JSDoc, so a component's doc comment is what agents read. Both ship in the package (`ng-package.json`
  assets). The same script writes the docs site's `llms.txt` / `llms-full.txt` into `projects/demo/public` (gitignored).
  Update `usage.md` when setup, conventions or a cross-cutting API changes; commit `components.md` after rerunning `npm run api`.
- **`ng add`**: `projects/kometa-ui/schematics/` is plain CommonJS (`.cjs`, since the built package is `"type": "module"`), shipped as an asset with no build step; the CLI supplies `@angular-devkit/schematics` and `@schematics/angular`. It puts the two `@use` lines atop the global `.scss` (or the two files first in `angular.json` `styles` for a CSS app) and adds `provideKometaUi()`; a rerun changes nothing. No spec: test it with `npm run pack:lib` and `ng add <tgz>` in a fresh `ng new` app outside this workspace.
- **`compose/`**: a separate Gradle project, the Compose Multiplatform port (`uz.kometa:kometa-ui`, package `uz.kometa.ui`): the tokens as `KometaTheme` plus 23 components (list in `compose/README.md`), foundation-only. Not linked to the Angular kit: a token or look changed in `tokens.scss` must be copied into `KometaTheme.kt` by hand. `./gradlew :kometa-ui:desktopTest` renders `build/gallery*.png`; copy them to `compose/docs/` when the look changes. It needs a JDK 17+ (`JAVA_HOME`); on this machine Gradle also needs `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=<a short writable dir>` or it fails with "Unable to establish loopback connection".
- **`examples/starter`**: a standalone app on `kometa-ui` from npm, opened by the README's StackBlitz link. It is not part of the workspace; bump its `kometa-ui` range after a minor release.
- `lib/test-setup.ts` stubs `matchMedia` and `ResizeObserver` for jsdom; it is wired in `angular.json` as the test `setupFiles`.

## Releasing

1. Pick the version: patch for fixes and docs, minor for new components, inputs or entry points (still 0.x, so a
   breaking change is minor too and its release notes say so). Set it in `projects/kometa-ui/package.json` only.
2. If an input or a doc comment changed, `npm run api` and commit `ai/components.md` with it.
3. `npm test -- --watch=false` and `npm run build` must pass; check `dist/kometa-ui/package.json` has the new version.
4. Commit as `Release kometa-ui <version>` on `main` and push `main` first.
5. Tag that commit `v<version>` (lightweight, like the others) and push the tag. That starts `publish.yml`:
   the tag must equal `v` + the package version or the job fails; specs, build, then `npm publish --provenance`.
   `gh run watch` it. A `403 OIDC permission denied` means npmjs.com's trusted publisher settings for the package
   no longer match: owner `InomjonIsmaylov`, repo `kometa-ui-kit`, workflow `publish.yml`, no environment.
6. npm then holds the version in "Validating" (its automated review) for minutes to hours; `npm view kometa-ui@<version>`
   404s and `latest` does not move until it clears. Nothing to fix or re-run meanwhile.
7. `gh release create v<version> --verify-tag` with notes written for app developers: what changed and why, any
   migration, the install line, and a `compare/v<previous>...v<version>` link. Only the newest version gets `--latest`.

Tagging an old commit (back-filling a release) also starts `publish.yml`; it stops early with a notice when that
version is already on npm, but only for tags on commits from `7019ba6` on, since a tag run uses the workflow file
of its own commit. On an older commit, `gh run cancel` the run it starts.

## Known gaps

- The demo is a docs site with three layouts, picked by `layout()` in `app.ts`: `home` (the welcome page, `app/home/`, full width with no sidebar; the default for an empty hash), `wide` (the Screens and the Playground) and `docs` (one page per component plus the guides, 72 pages in all; there is no sidebar: the constellation map `app/cosmos/` (key `m`, the topbar Map button, or the bottom dock with prev/next) is the page index (`#button`, sections deep-link as `#button/severity`), an "On this page" list with scroll-spy, prev/next). Ctrl+K or `/` opens a command palette (`<dialog>` in `app.html`); `log.set()` writes to the event ticker at the bottom left. The page list is `nav` in `app.ts`; `apis` there maps each page to its classes for the Import line and the API table, which is read from Angular's `ɵcmp`/`ɵdir` metadata (names and kinds) plus `app/api.json` (type, default, required), generated from the library source by `npm run api` (`scripts/gen-api.mjs`, run by `npm start` and the Pages workflow; rerun and commit it after changing an input). Each example is an `<app-doc id heading about>` (`app/docs.ts`) with a preview toolbar (canvas: plain/grid/dots; width: full/tablet/phone) and code tabs. The HTML tab is cut from `app.html` itself, imported as text, so snippets cannot drift; the TypeScript and SCSS tabs are `// #region page/id` … `// #endregion` blocks in `app.ts` / `app.scss` (also imported as text: a `.ts` file needs `// @ts-ignore` on the `with { loader: 'text' }` import). `ng serve` does not refresh text imports when the file changes, so a code tab can lag its live demo until the dev server restarts; `ng build` is always current. A self-closing `<app-doc />` must pass `[code]`. **Screens** (`app/screens/<name>/`, one standalone component each, mock data in its `.ts`) are whole pages built from many components; `screens/sources.ts` reads their three files as text for `[files]`, and each exports `USES` (docs page ids) for its "Built with" list. To add a screen: the folder, a `sources.ts` entry, a `nav` entry under Screens, `screenUses` and a `@case` in `app.html`. `k-tabbar` with `link` and `k-row` with `link` need a router, which the demo does not provide, so they are shown without links. `k-suggest` draws a bare `<input>` that the host styles; the demo wraps it in `.field`. To add a page: a `@case ('id')` block in `app.html` (`<app-doc>` ids unique within it), a `nav` entry and an `apis` entry in `app.ts`. Most pages carry a `basic` example, one per option added after the first version, and a "Customizing" example that sets the component's CSS custom properties inline; Theming lists the pattern. `k-tray` has no options example because the app-wide `<k-tray>` at the bottom of `app.html` would clash with a second one.
- **Motion** (`lib/kometa-motion.ts`): overlays take `animation` (a preset from `KOMETA_ANIMATIONS`, `'none'`, or custom keyframe names `"in out"`) through the `KometaMotion` host directive, which binds `--k-anim` / `--k-anim-out` / `--k-anim-dir` on the moving element; `--k-motion-dur` / `--k-motion-ease` / `--k-motion-distance` tune it. Preset keyframes are injected once into a global `<style id="kometa-motion">` because emulated encapsulation renames local `@keyframes`; for the same reason custom keyframes must live in global CSS. Each preset has a `-out` twin (played reversed) since a browser will not restart an animation whose name did not change. `[kAnimate]` animates any element on enter or when scrolled into view.
- **Playground** (`app/play/`): `playground.ts` is an HTML/TS/CSS editor compiled in the browser by `runtime.ts` (JIT `@angular/compiler` + `sucrase` type stripping, lazy chunk; all kometa-ui exports and the signal/DI functions are in scope without imports). `props.ts` holds `PLAY`, the pages that get a "Try it" props panel; controls are generated from `ɵcmp` inputs and default values, `choices` covers union inputs. Code regions accept several keys (`// #region a/x b/y`), and `docs.ts` also reads regions from `styles.scss`.
- `kometa-theme.css` (the Tailwind v4 `@theme inline` mapping) is shipped but not imported by the demo.
