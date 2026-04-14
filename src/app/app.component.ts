import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'myPaisaa Bus Booking';

  constructor(private readonly router: Router) {}

  isActive(path: string): boolean {
    return this.router.url.includes(path);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
