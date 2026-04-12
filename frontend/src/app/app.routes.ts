import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '**',
    loadComponent: () =>
      import('./features/document-shell/document-shell.component').then(m => m.DocumentShellComponent),
  },
];
