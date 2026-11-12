# Contributing

Bug reports, fixes and new components are welcome.

- **Found a bug?** Open an [issue](https://github.com/InomjonIsmaylov/kometa-ui-kit/issues) with the component,
  what you did, what you expected, and the browser.
- **Looking for something to work on?** Issues labelled
  [`good first issue`](https://github.com/InomjonIsmaylov/kometa-ui-kit/labels/good%20first%20issue) are small and
  self-contained. The known gaps in [ACCESSIBILITY.md](ACCESSIBILITY.md) are another good place to start.
- **Planning a new component or a breaking change?** Open an issue first so we can agree on the API.

## Set up

```bash
npm install
npm start          # docs site at http://localhost:4200, using the library source
npm test           # library specs
npm run build      # the package into dist/kometa-ui
```

[AGENTS.md](AGENTS.md) describes the layout of the repo, how to add a component or a docs page, and the
conventions the kit follows. It is written for AI agents and reads fine for people too.

## Pull requests

- Keep one change per pull request, with a spec for new behaviour.
- `npm test -- --watch=false` and `npm run build` must pass.
- If you change an input or a doc comment, run `npm run api` and commit `projects/kometa-ui/ai/components.md`.
- Keyboard and screen-reader support are part of a component, not extras: say in the PR what keys it handles.

By contributing you agree that your contribution is licensed under the [MIT License](LICENSE).
