import { Component } from '@angular/core';

/** Decorative animated aurora backdrop shared by the auth screens. */
@Component({
  selector: 'app-auth-backdrop',
  styleUrl: './auth-backdrop.css',
  templateUrl: './auth-backdrop.html',
})
export class AuthBackdrop {
  protected readonly stars = Array.from({ length: 18 }, (_, index) => ({
    top: (index * 37) % 100,
    left: (index * 53 + 7) % 100,
    delay: index * -0.45,
  }));
}
