import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Animated brand showcase and aurora backdrop shown beside the login form. */
@Component({
  imports: [RouterLink],
  selector: 'app-login-showcase',
  styleUrl: './login-showcase.css',
  templateUrl: './login-showcase.html',
})
export class LoginShowcase {
  protected readonly stars = Array.from({ length: 18 }, (_, index) => ({
    top: (index * 37) % 100,
    left: (index * 53 + 7) % 100,
    delay: index * -0.45,
  }));
}
