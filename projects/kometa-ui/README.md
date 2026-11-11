# kometa-ui

Kometa's Angular 22 component library: standalone, OnPush components themed by CSS custom properties.
Docs and live examples: https://inomjonismaylov.github.io/kometa-ui-kit/

```bash
npm install kometa-ui
```

```ts
// app.config.ts
import { provideKometaUi } from 'kometa-ui';
providers: [provideKometaUi()]
```

```scss
// styles.scss: layers first (KOMETA_LAYER_ORDER); base brings tokens with it
@use 'kometa-ui/styles/layers';
@use 'kometa-ui/styles/base';
```

Tailwind v4 users can map the tokens with `@import 'kometa-ui/styles/kometa-theme.css';`.

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

Peers: Angular 22, RxJS 7. MIT licensed; the bundled fonts are under the SIL OFL 1.1 (`styles/fonts/OFL.txt`).
