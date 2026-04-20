import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LiveRegionComponent } from './shared/live-region/live-region.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LiveRegionComponent],
  template: '<router-outlet /><app-live-region />',
  styles: [':host { display: block; }'],
})
export class AppComponent {}
