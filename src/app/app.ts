import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateBanner } from './shared/components/update-banner/update-banner';
import { CookieConsentBanner } from './shared/components/cookie-consent/cookie-consent';
import { TopLoader } from './shared/loader/top-loader';

@Component({
  imports: [RouterOutlet, UpdateBanner, CookieConsentBanner, TopLoader],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
