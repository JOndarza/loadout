import {
  ApplicationConfig,
  CSP_NONCE,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAnimations(),
    {
      provide: CSP_NONCE,
      useFactory: () =>
        document.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')?.content ?? null,
    },
  ],
};
