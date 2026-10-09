import { Component, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { StatusBadge } from '../../../shared/status-badge/status-badge';

@Component({
  imports: [FormField, StatusBadge],
  selector: 'app-recommendations',
  styleUrl: './recommendations.css',
  templateUrl: './recommendations.html',
})
export class Recommendations {
  protected readonly generated = signal(false);
  protected readonly model = signal({ customerId: '', goal: '', skinType: 'combination', notes: '' });
  protected readonly recommendationForm = form(this.model, (path) => {
    required(path.customerId, { message: 'Musteri secilmelidir.' });
    required(path.goal, { message: 'Bakim hedefi zorunludur.' });
  });
  protected preview(): void { submit(this.recommendationForm, async () => this.generated.set(true)); }
}
