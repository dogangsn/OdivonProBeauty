import { Component, inject, linkedSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CookieConsentService } from '../../../core/consent/cookie-consent.service';

@Component({
  selector: 'app-cookie-consent',
  imports: [RouterLink],
  template: `
    @if (consent.visible()) {
      <section
        class="cc"
        role="dialog"
        aria-modal="false"
        aria-labelledby="cc-title"
        aria-describedby="cc-text"
      >
        <div class="cc__body">
          <h2 id="cc-title">Çerez tercihleriniz</h2>
          <p id="cc-text">
            Oturumunuzu güvenle açık tutmak için zorunlu çerezleri kullanıyoruz. İzin verirseniz
            hizmeti geliştirmek için anonim kullanım istatistikleri (Google Analytics) de toplarız.
            Ayrıntılar için <a routerLink="/cookies">Çerez Politikası</a> ve
            <a routerLink="/privacy">Gizlilik Politikası</a>.
          </p>
          @if (showDetails()) {
            <ul class="cc__options">
              <li>
                <label>
                  <input type="checkbox" checked disabled />
                  <span
                    ><strong>Zorunlu</strong> Oturum, güvenlik, dil ve tema tercihi.
                    Kapatılamaz.</span
                  >
                </label>
              </li>
              <li>
                <label>
                  <input
                    type="checkbox"
                    [checked]="analytics()"
                    (change)="analytics.set($any($event.target).checked)"
                  />
                  <span
                    ><strong>Analitik</strong> Anonim sayfa görüntüleme ve kullanım ölçümü.</span
                  >
                </label>
              </li>
            </ul>
          }
        </div>
        <div class="cc__actions">
          @if (showDetails()) {
            <button
              type="button"
              class="cc__btn cc__btn--ghost"
              (click)="consent.save(analytics())"
            >
              Seçimimi kaydet
            </button>
          } @else {
            <button type="button" class="cc__btn cc__btn--ghost" (click)="showDetails.set(true)">
              Tercihler
            </button>
          }
          <button type="button" class="cc__btn cc__btn--ghost" (click)="consent.rejectAll()">
            Reddet
          </button>
          <button type="button" class="cc__btn cc__btn--primary" (click)="consent.acceptAll()">
            Tümünü kabul et
          </button>
        </div>
      </section>
    }
  `,
  styles: `
    .cc {
      position: fixed;
      z-index: 1000;
      left: 1rem;
      right: 1rem;
      bottom: 1rem;
      margin: 0 auto;
      max-width: 56rem;
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 1rem 1.5rem;
      padding: 1.1rem 1.25rem;
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 1rem;
      background: var(--surface, #fff);
      color: var(--text, #0f172a);
      box-shadow: 0 20px 50px rgb(15 23 42 / 0.18);
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    }
    .cc__body {
      flex: 1 1 22rem;
      min-width: 0;
    }
    h2 {
      margin: 0 0 0.35rem;
      font-size: 0.95rem;
      font-weight: 800;
    }
    p {
      margin: 0;
      color: var(--muted, #475569);
      font-size: 0.82rem;
      line-height: 1.55;
    }
    a {
      color: var(--primary, #4f46e5);
      font-weight: 700;
    }
    .cc__options {
      display: grid;
      gap: 0.5rem;
      margin: 0.75rem 0 0;
      padding: 0;
      list-style: none;
      font-size: 0.8rem;
    }
    .cc__options label {
      display: flex;
      align-items: flex-start;
      gap: 0.55rem;
    }
    .cc__options strong {
      margin-right: 0.35rem;
    }
    .cc__options input {
      width: 1.05rem;
      height: 1.05rem;
      margin-top: 0.1rem;
      accent-color: #4f46e5;
    }
    .cc__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .cc__btn {
      min-height: 2.75rem;
      padding: 0 1.1rem;
      border-radius: 0.7rem;
      font: inherit;
      font-size: 0.84rem;
      font-weight: 700;
      cursor: pointer;
    }
    .cc__btn--ghost {
      border: 1px solid var(--border, #cbd5e1);
      background: transparent;
      color: var(--text, #0f172a);
    }
    .cc__btn--primary {
      border: 0;
      background: #4f46e5;
      color: #fff;
    }
    .cc__btn:focus-visible,
    a:focus-visible {
      outline: 3px solid #7c3aed;
      outline-offset: 2px;
    }
    @media (max-width: 560px) {
      .cc {
        left: 0.5rem;
        right: 0.5rem;
        bottom: 0.5rem;
        padding: 1rem;
      }
      p {
        font-size: 0.78rem;
      }
      .cc__actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        width: 100%;
      }
      .cc__btn--primary {
        order: -1;
        grid-column: 1 / -1;
      }
    }
  `,
})
export class CookieConsentBanner {
  protected readonly consent = inject(CookieConsentService);
  protected readonly showDetails = linkedSignal(
    () => this.consent.visible() && this.consent.decided(),
  );
  protected readonly analytics = linkedSignal(() => this.consent.analyticsAllowed());
}
