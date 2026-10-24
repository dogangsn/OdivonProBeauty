import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateBanner } from './shared/components/update-banner/update-banner';
import { CookieConsentBanner } from './shared/components/cookie-consent/cookie-consent';

@Component({
  imports: [RouterOutlet, UpdateBanner, CookieConsentBanner],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
