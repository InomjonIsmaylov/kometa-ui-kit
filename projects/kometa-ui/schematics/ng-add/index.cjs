// Plain CommonJS so it ships as an asset with no build step; the Angular CLI provides both modules at `ng add` time.
const { SchematicsException, chain } = require('@angular-devkit/schematics');
const { addRootProvider, updateWorkspace } = require('@schematics/angular/utility');

const USES = "@use 'kometa-ui/styles/layers';\n@use 'kometa-ui/styles/base';\n";
const FILES = ['node_modules/kometa-ui/styles/layers.scss', 'node_modules/kometa-ui/styles/base.scss'];

function ngAdd(options) {
  return (tree) => {
    const projects = JSON.parse(tree.readText('angular.json')).projects;
    const name = options.project || Object.keys(projects).find((p) => projects[p].projectType === 'application');
    if (!projects[name]) throw new SchematicsException(`No application "${name || ''}" in angular.json.`);

    const root = projects[name].sourceRoot ?? `${projects[name].root || ''}/src`.replace(/^\//, '');
    const config = [`${root}/app/app.config.ts`, `${root}/main.ts`].find((f) => tree.exists(f));
    const hasProvider = config && tree.readText(config).includes('provideKometaUi(');
    const provider = hasProvider ? () => {} : addRootProvider(name, ({ code, external }) =>
      code`${external('provideKometaUi', 'kometa-ui/provide-kometa-ui')}()`);
    return chain([styles(tree, name, projects[name]), provider]);
  };
}

// layers must come before any other style, or component styles lose to the app's (see ai/usage.md).
function styles(tree, name, project) {
  const list = (project.architect?.build?.options?.styles ?? []).map((s) => (typeof s === 'string' ? s : s.input));
  if (list.some((p) => p.includes('kometa-ui/styles'))) return () => {};

  const scss = list.find((p) => p.endsWith('.scss') && tree.exists(p));
  if (scss) {
    const text = tree.readText(scss);
    if (!text.includes('kometa-ui/styles/layers')) tree.overwrite(scss, USES + text);
    return () => {};
  }
  // A CSS-only app cannot @use, so the two Sass files go first in the styles array instead.
  return updateWorkspace((workspace) => {
    const options = workspace.projects.get(name).targets.get('build').options;
    options.styles = [...FILES, ...(options.styles ?? [])];
  });
}

module.exports = { ngAdd };
