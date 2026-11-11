# kometa-ui

Kometa's Angular component library, extracted from `mening/web/projects/shared/ui`.

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

Peers: Angular 22. No PrimeNG. Build `npm run build`, test `npm test`.
