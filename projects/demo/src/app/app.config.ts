import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideKometaUi } from 'kometa-ui';

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideKometaUi()],
};
