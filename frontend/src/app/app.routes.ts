import { CanDeactivateFn, Routes } from '@angular/router';
import type { DocumentShellComponent } from './features/document-shell/document-shell.component';

/**
 * Functional canDeactivate guard that delegates to the shell so the component owns
 * the prompt-before-discard logic and the active editor reference.
 */
const shellCanDeactivate: CanDeactivateFn<DocumentShellComponent> = (component) =>
  component.canDeactivate();

export const routes: Routes = [
  {
    path: '**',
    loadComponent: () =>
      import('./features/document-shell/document-shell.component').then((m) => m.DocumentShellComponent),
    canDeactivate: [shellCanDeactivate],
  },
];
