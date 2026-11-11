# kometa-ui

Kometa's Angular 22 component library: standalone, OnPush components themed by CSS custom properties.
Docs and live examples: https://inomjonismaylov.github.io/kometa-ui-kit/

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

Peers: Angular 22. MIT licensed; the bundled fonts are under the SIL OFL 1.1 (`styles/fonts/OFL.txt`).
