import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    // Habilita a ferramenta de fazer pedidos para o servidor (HttpClient)
    provideHttpClient()
  ]
};