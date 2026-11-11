import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

/** The one layer order. Shipped as `styles/layers.scss`, which each app's styles.scss `@use`s first. */
export const KOMETA_LAYER_ORDER = 'theme, base, legacy, components, utilities';

/**
 * Kept so app configs need no change. Nothing to configure any more: every component styles itself
 * from tokens.scss, and KometaConfirmationService is providedIn root.
 */
export function provideKometaUi(): EnvironmentProviders {
  return makeEnvironmentProviders([]);
}
