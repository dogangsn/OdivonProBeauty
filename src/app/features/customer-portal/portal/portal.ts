import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-portal',
  styleUrl: './portal.css',
  templateUrl: './portal.html',
})
export class Portal {
  protected readonly otpSent = signal(false);
}
