import { Component, inject, resource, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../../core/api-client';
import { BeautyRecord } from '../../../core/beauty.model';
import { StatusBadge } from '../../../shared/status-badge/status-badge';

interface RecommendationResponse {
  status: string;
  provider: string | null;
  requiresSpecialistApproval: boolean;
  draft?: { title?: string; steps?: string[]; warnings?: string[] };
}

@Component({
  imports: [FormField, StatusBadge],
  selector: 'app-recommendations',
  styleUrl: './recommendations.css',
  templateUrl: './recommendations.html',
})
export class Recommendations {
  private readonly api = inject(ApiClient);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly result = signal<RecommendationResponse | null>(null);
  protected readonly customers = resource({
    loader: async () =>
      (await firstValueFrom(this.api.list<BeautyRecord>('customers', { limit: 100 }))).data,
  });
  protected readonly model = signal({
    customerId: '',
    goal: '',
    skinType: 'combination',
    notes: '',
  });
  protected readonly recommendationForm = form(this.model, (path) => {
    required(path.customerId, { message: 'Müşteri seçilmelidir.' });
    required(path.goal, { message: 'Bakım hedefi zorunludur.' });
  });
  protected preview(): void {
    submit(this.recommendationForm, async () => {
      this.loading.set(true);
      this.error.set('');
      this.result.set(null);
      try {
        this.result.set(
          (
            await firstValueFrom(
              this.api.request<RecommendationResponse>(
                'POST',
                'beauty/recommendations/preview',
                this.model(),
              ),
            )
          ).data,
        );
      } catch (error) {
        this.error.set(error instanceof Error ? error.message : 'Öneri servisine ulaşılamadı.');
      } finally {
        this.loading.set(false);
      }
    });
  }
  protected customerName(item: BeautyRecord): string {
    const value = item['name'] ?? item['fullName'];
    return typeof value === 'string' ? value : item.id;
  }
}
