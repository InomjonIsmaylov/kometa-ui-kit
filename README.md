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
