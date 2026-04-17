import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
// Apontando para o arquivo e classe corretos que acabamos de arrumar!
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));