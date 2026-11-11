// Each screen's own files as text, for its code tabs: what you read is what runs.
import type { DocFiles } from '../docs';
// @ts-ignore: the build reads it as text; TypeScript would resolve it as the module itself.
import bookingTs from './booking/booking.ts' with { loader: 'text' };
import bookingHtml from './booking/booking.html' with { loader: 'text' };
import bookingScss from './booking/booking.scss' with { loader: 'text' };
// @ts-ignore: as above.
import dashboardTs from './dashboard/dashboard.ts' with { loader: 'text' };
import dashboardHtml from './dashboard/dashboard.html' with { loader: 'text' };
import dashboardScss from './dashboard/dashboard.scss' with { loader: 'text' };
// @ts-ignore: as above.
import clientsTs from './clients/clients.ts' with { loader: 'text' };
import clientsHtml from './clients/clients.html' with { loader: 'text' };
import clientsScss from './clients/clients.scss' with { loader: 'text' };
// @ts-ignore: as above.
import settingsTs from './settings/settings.ts' with { loader: 'text' };
import settingsHtml from './settings/settings.html' with { loader: 'text' };
import settingsScss from './settings/settings.scss' with { loader: 'text' };

const files = (html: string, ts: unknown, scss: string): DocFiles => ({ html, ts: ts as string, scss });

export const SCREEN_FILES: Record<string, DocFiles> = {
  booking: files(bookingHtml, bookingTs, bookingScss),
  dashboard: files(dashboardHtml, dashboardTs, dashboardScss),
  clients: files(clientsHtml, clientsTs, clientsScss),
  settings: files(settingsHtml, settingsTs, settingsScss),
};
