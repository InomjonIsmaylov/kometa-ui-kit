# Kometa UI

A dense, warm UI kit for Angular 22: standalone, OnPush components, light and dark from one set of
CSS custom properties, no third-party UI dependency.

**[Live demo and docs](https://inomjonismaylov.github.io/kometa-ui-kit/)**

## Use it

```ts
// app.config.ts
import { provideKometaUi } from 'kometa-ui';

export const appConfig = { providers: [provideKometaUi()] };
```

```scss
// styles.scss: the layer order must come first
@use 'kometa-ui/styles/layers';
@use 'kometa-ui/styles/base';
```

```html
<k-button label="Save" (clicked)="save()" />
```

Components use the `k-` prefix (`<k-button>`, `<k-drawer>`, `button[k-halo]`) and read their colours
from tokens such as `--amber`, `--bg` and `--text`, so overriding a token on any element restyles
everything inside it.

## Using it with AI agents

The package ships a guide written for coding agents, `ai/usage.md`, and a generated reference of every
component's selector, inputs, outputs and defaults, `ai/components.md`. Point your agent at them by adding
a line to your project's `AGENTS.md` (or `CLAUDE.md`):

```md
UI components come from kometa-ui: read node_modules/kometa-ui/ai/usage.md before writing UI code,
and node_modules/kometa-ui/ai/components.md for a component's inputs and outputs.
```

Claude Code can pull the guide straight in with `@node_modules/kometa-ui/ai/usage.md`. Tools that read the
web can use [llms.txt](https://inomjonismaylov.github.io/kometa-ui-kit/llms.txt) and
[llms-full.txt](https://inomjonismaylov.github.io/kometa-ui-kit/llms-full.txt).

## Develop

```bash
npm install
npm start          # demo at http://localhost:4200
npm test           # library specs (vitest)
npm run build      # library into dist/kometa-ui
```

The repo holds two projects: `projects/kometa-ui` (the library) and `projects/demo` (the docs site,
which imports the library from source). Every push to `main` deploys the demo to GitHub Pages.

## License

[MIT](LICENSE). The bundled Manrope and Syne fonts are under the
[SIL Open Font License 1.1](projects/kometa-ui/styles/fonts/OFL.txt).
