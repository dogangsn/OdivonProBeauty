import { Component, inject } from '@angular/core';
import { VersionService } from '../../../core/version/version.service';

@Component({
  selector: 'app-update-banner',
  template: `
    @if (version.modalVisible()) {
      <div
        class="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-title"
        (click)="onBackdropClick($event)"
      >
        <div
          class="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-indigo-500/10 dark:shadow-black/70 border border-slate-200/90 dark:border-slate-800 overflow-hidden relative transition-all"
          (click)="$event.stopPropagation()"
        >
          <!-- Ambient Glowing Gradient Bar at Top -->
          <div
            class="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400"
          ></div>

          <!-- Header Section -->
          <div class="p-6 pb-4 sm:p-7 sm:pb-4 relative">
            <!-- Close Button (Only if update is not mandatory) -->
            @if (!version.updateRequired()) {
              <button
                type="button"
                (click)="version.closeModal()"
                class="absolute top-6 right-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer border border-slate-200/50 dark:border-slate-700/60"
                aria-label="Kapat"
                title="Kapat"
              >
                <span class="material-symbols-outlined icon-size-4">close</span>
              </button>
            }

            <div class="flex items-start gap-4">
              <!-- Animated Glowing Icon Container -->
              <div
                class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg relative"
                [class.bg-gradient-to-br]="true"
                [class.from-indigo-600]="version.updateRequired()"
                [class.via-purple-600]="version.updateRequired()"
                [class.to-pink-500]="version.updateRequired()"
                [class.text-white]="true"
                [class.shadow-indigo-500/30]="version.updateRequired()"
                [class.from-emerald-500]="!version.updateRequired()"
                [class.to-teal-600]="!version.updateRequired()"
                [class.shadow-emerald-500/25]="!version.updateRequired()"
              >
                <span class="material-symbols-outlined icon-size-7 text-white">
                  {{ version.updateRequired() ? 'rocket_launch' : 'verified' }}
                </span>
                @if (version.updateRequired()) {
                  <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span
                      class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"
                    ></span>
                    <span
                      class="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500 border-2 border-white dark:border-slate-900"
                    ></span>
                  </span>
                }
              </div>

              <!-- Title & Version Subtitle -->
              <div class="flex-1 pr-6">
                <div class="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border"
                    [class.bg-rose-50]="version.updateRequired()"
                    [class.text-rose-700]="version.updateRequired()"
                    [class.border-rose-200]="version.updateRequired()"
                    [class.dark:bg-rose-950/60]="version.updateRequired()"
                    [class.dark:text-rose-300]="version.updateRequired()"
                    [class.dark:border-rose-900/60]="version.updateRequired()"
                    [class.animate-pulse]="version.updateRequired()"
                    [class.bg-emerald-50]="!version.updateRequired()"
                    [class.text-emerald-700]="!version.updateRequired()"
                    [class.border-emerald-200]="!version.updateRequired()"
                    [class.dark:bg-emerald-950/60]="!version.updateRequired()"
                    [class.dark:text-emerald-300]="!version.updateRequired()"
                    [class.dark:border-emerald-900/60]="!version.updateRequired()"
                  >
                    {{
                      version.updateRequired()
                        ? 'YENİ SÜRÜM YAYINLANDI'
                        : 'SİSTEM EN GÜNCEL SÜRÜMDE'
                    }}
                  </span>
                  @if (version.critical()) {
                    <span
                      class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-xs"
                    >
                      KRİTİK GÜNCELLEME
                    </span>
                  }
                </div>

                <h3
                  id="update-title"
                  class="text-xl font-black text-slate-900 dark:text-white m-0 tracking-tight"
                >
                  {{
                    version.updateRequired()
                      ? 'OdivonPro Beauty Yeni Sürüm Hazır'
                      : 'OdivonPro Beauty Sürüm Bilgisi'
                  }}
                </h3>

                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0 leading-relaxed">
                  {{
                    version.updateRequired()
                      ? 'Sistemin kararlı, hızlı ve güvenli çalışması için yeni sürüme geçiş yapılması gerekmektedir.'
                      : 'Bulut altyapınız en son güvenlik yamaları ve performans geliştirmeleri ile senkronize çalışıyor.'
                  }}
                </p>
              </div>
            </div>
          </div>

          <!-- Version Details & Transition Card -->
          <div class="px-6 sm:px-7 space-y-4">
            <!-- Version Comparison Box -->
            <div
              class="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
            >
              <!-- Current Version -->
              <div class="flex items-center gap-2.5">
                <div
                  class="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-700 dark:text-slate-200 font-black text-xs shadow-2xs"
                >
                  v
                </div>
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block"
                    >Şu Anki Sürüm</span
                  >
                  <div class="flex items-center gap-1.5">
                    <span class="text-sm font-black text-slate-900 dark:text-white"
                      >v{{ version.current.version }}</span
                    >
                    <span
                      class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    >
                      #{{ version.current.commit }}
                    </span>
                  </div>
                </div>
              </div>

              @if (version.updateRequired()) {
                <!-- Transition Arrow -->
                <div class="flex flex-col items-center">
                  <div
                    class="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs"
                  >
                    <span class="material-symbols-outlined icon-size-4">trending_flat</span>
                  </div>
                </div>

                <!-- New Available Version -->
                <div class="flex items-center gap-2.5 text-right">
                  <div>
                    <span
                      class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block"
                      >Yeni Sürüm</span
                    >
                    <div class="flex items-center justify-end gap-1.5">
                      <span class="text-sm font-black text-indigo-600 dark:text-indigo-400">
                        v{{ version.available()?.version || version.current.version }}
                      </span>
                      @if (version.available()?.commit) {
                        <span
                          class="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                        >
                          #{{ version.available()?.commit }}
                        </span>
                      }
                    </div>
                  </div>
                  <div
                    class="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-xs"
                  >
                    ✦
                  </div>
                </div>
              } @else {
                <!-- Stable Badge -->
                <div
                  class="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60"
                >
                  <span class="material-symbols-outlined icon-size-4 text-emerald-500"
                    >check_circle</span
                  >
                  <span>Kararlı & Güncel</span>
                </div>
              }
            </div>

            <!-- Release Notes & What's New Box -->
            <div
              class="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/40"
            >
              <div class="flex items-center justify-between mb-2">
                <span
                  class="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
                >
                  <span
                    class="material-symbols-outlined icon-size-4 text-purple-600 dark:text-purple-400"
                    >auto_awesome</span
                  >
                  {{ version.updateRequired() ? 'Yeni Sürüm Yenilikleri' : 'Sürüm Notları' }}
                </span>
                <span class="text-[10px] font-semibold text-slate-400">
                  {{ formatBuildDate(version.available()?.builtAt || version.current.builtAt) }}
                </span>
              </div>

              <p class="m-0 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                {{ getReleaseNotes() }}
              </p>
            </div>

            <!-- Security & Cache Clean Notice -->
            <div
              class="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400"
            >
              <span class="material-symbols-outlined icon-size-4 text-indigo-500 shrink-0 mt-0.5"
                >verified_user</span
              >
              <span>
                {{
                  version.updateRequired()
                    ? 'Güncelleme uygulandığında tarayıcı önbelleği güvenle yenilenecek, oturumunuz taze bir şekilde yeniden başlatılacaktır.'
                    : 'Sistem her 5 dakikada bir ve sayfa odağı yenilendiğinde arka planda otomatik güncelleme denetimi gerçekleştirir.'
                }}
              </span>
            </div>
          </div>

          <!-- Modal Action Footer -->
          <div
            class="p-6 sm:p-7 pt-5 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80 mt-4 bg-slate-50/50 dark:bg-slate-900/50"
          >
            @if (version.updateRequired()) {
              <button
                type="button"
                class="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:via-purple-500 hover:to-indigo-600 text-white font-black text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                [disabled]="version.applying()"
                (click)="version.applyUpdate()"
              >
                @if (version.applying()) {
                  <span class="material-symbols-outlined icon-size-4.5 animate-spin">refresh</span>
                  <span>Güncelleme Uygulanıyor...</span>
                } @else {
                  <span class="material-symbols-outlined icon-size-4.5">system_update_alt</span>
                  <span>Şimdi Güncelle ve Yeniden Başlat</span>
                }
              </button>
            } @else {
              <!-- Manual View Controls -->
              <button
                type="button"
                class="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                [disabled]="version.isChecking()"
                (click)="version.checkNow()"
              >
                <span
                  class="material-symbols-outlined icon-size-4"
                  [class.animate-spin]="version.isChecking()"
                  >refresh</span
                >
                <span>{{
                  version.isChecking() ? 'Kontrol Ediliyor...' : 'Güncellemeleri Denetle'
                }}</span>
              </button>

              <button
                type="button"
                class="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-black transition-all cursor-pointer shadow-xs"
                (click)="version.closeModal()"
              >
                Tamam
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class UpdateBanner {
  protected readonly version = inject(VersionService);

  protected onBackdropClick(event: MouseEvent): void {
    if (!this.version.updateRequired()) {
      this.version.closeModal();
    }
  }

  protected getReleaseNotes(): string {
    const available = this.version.available();
    if (available?.notes) return available.notes;
    if (this.version.current.notes) return this.version.current.notes;
    return 'Performans iyileştirmeleri, güvenlik yamaları ve arayüz optimizasyonları uygulandı.';
  }

  protected formatBuildDate(isoString?: string): string {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  }
}
