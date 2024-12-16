import { ApplicationConfig, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from "@angular/common/http";
import {provideAnimationsAsync} from "@angular/platform-browser/animations/async";
import { routes } from './app.routes';
import { DecimalPipe } from '@angular/common';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@jsverse/transloco';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),provideHttpClient(), provideAnimationsAsync(), DecimalPipe, provideHttpClient(), provideTransloco({
        config: { 
          availableLangs: ['en', 'es', 'de', 'fr', 'spooky'],
          defaultLang: 'en',
          fallbackLang: 'en',
          // Remove this option if your application doesn't support changing language in runtime.
          reRenderOnLangChange: true,
          prodMode: !isDevMode(),
        },
        loader: TranslocoHttpLoader
      })]
};
