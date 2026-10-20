import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthBackdrop } from '../auth-backdrop/auth-backdrop';

/** Animated brand showcase and aurora backdrop shown beside the login form. */
@Component({
  imports: [AuthBackdrop, RouterLink],
  selector: 'app-login-showcase',
  styleUrl: './login-showcase.css',
  templateUrl: './login-showcase.html',
})
export class LoginShowcase {}
