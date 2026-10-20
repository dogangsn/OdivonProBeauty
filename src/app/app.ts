import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UpdateBanner } from './shared/components/update-banner/update-banner';

@Component({
  imports: [RouterOutlet, UpdateBanner],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
