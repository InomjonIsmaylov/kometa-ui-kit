import { bootstrapApplication } from '@angular/platform-browser';
import { provideKometaUi } from 'kometa-ui/provide-kometa-ui';
import { App } from './app/app';

bootstrapApplication(App, { providers: [provideKometaUi()] }).catch((err) => console.error(err));
