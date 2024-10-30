import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from "@angular/common/http";
import {provideAnimationsAsync} from "@angular/platform-browser/animations/async";
import { routes } from './app.routes';
import { DecimalPipe } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),provideHttpClient(), provideAnimationsAsync(), DecimalPipe]
};
