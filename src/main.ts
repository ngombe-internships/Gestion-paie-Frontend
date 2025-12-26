import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';



if (environment.production) {
  // Sauvegarder les méthodes originales pour les erreurs critiques
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Désactiver tous les logs sauf error et warn
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  
  // Garder error et warn pour le debugging en prod
  console.error = originalError;
  console.warn = originalWarn;
}


bootstrapApplication(AppComponent, appConfig).catch(err => console.error(err));
