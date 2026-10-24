import { Component, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CookieConsentService } from '../../core/consent/cookie-consent.service';
import { LEGAL_ENTITY } from '../../core/seo/site';

/** Shared frame for the public legal pages (terms, privacy, cookies). */
@Component({
  selector: 'app-legal-layout',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="legal-shell">
      <header class="legal-header">
        <a class="brand" routerLink="/login" aria-label="OdivonPro Beauty giriş sayfası">
          <span class="brand__mark" aria-hidden="true">O</span>
          <span><strong>OdivonPro</strong><small>Beauty Center</small></span>
        </a>
        <a class="cta" routerLink="/register">14 gün ücretsiz deneyin</a>
      </header>

      <nav class="legal-nav" aria-label="Yasal metinler">
        <a routerLink="/terms" routerLinkActive="active" ariaCurrentWhenActive="page"
          >Kullanım Şartları</a
        >
        <a routerLink="/privacy" routerLinkActive="active" ariaCurrentWhenActive="page"
          >Gizlilik Politikası</a
        >
        <a routerLink="/cookies" routerLinkActive="active" ariaCurrentWhenActive="page"
          >Çerez Politikası</a
        >
      </nav>

      <main class="legal-doc">
        <h1>{{ heading() }}</h1>
        <p class="meta">Son güncelleme: {{ entity.updatedAt }}</p>
        <ng-content />
      </main>

      <footer class="legal-footer">
        <span>© {{ entity.name }}</span>
        <a routerLink="/login">Giriş yap</a>
        <a routerLink="/portal">Müşteri portalı</a>
        <button type="button" (click)="consent.openSettings()">Çerez tercihlerini değiştir</button>
      </footer>
    </div>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background: var(--canvas, #f8fafc);
      color: var(--text, #0f172a);
    }
    .legal-shell {
      max-width: 52rem;
      margin: 0 auto;
      padding: 1.25rem 1rem 6rem;
    }
    .legal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 0.65rem;
      color: inherit;
      text-decoration: none;
    }
    .brand strong,
    .brand small {
      display: block;
    }
    .brand strong {
      font-weight: 800;
    }
    .brand small {
      color: var(--muted, #64748b);
      font-size: 0.7rem;
      font-weight: 700;
    }
    .brand__mark {
      display: grid;
      place-items: center;
      width: 2.4rem;
      height: 2.4rem;
      border-radius: 0.8rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6 50%, #d946ef);
      color: #fff;
      font-weight: 900;
    }
    .cta {
      display: inline-flex;
      align-items: center;
      min-height: 2.75rem;
      padding: 0 1.1rem;
      border-radius: 0.75rem;
      background: #4f46e5;
      color: #fff;
      font-weight: 700;
      font-size: 0.88rem;
      text-decoration: none;
    }
    .legal-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin: 1.5rem 0 1rem;
    }
    .legal-nav a {
      padding: 0.55rem 0.9rem;
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 999px;
      color: var(--text, #0f172a);
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
    }
    .legal-nav a.active {
      border-color: #4f46e5;
      background: #eef2ff;
      color: #3730a3;
    }
    .legal-doc {
      padding: clamp(1.25rem, 4vw, 2.5rem);
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 1.25rem;
      background: var(--surface, #fff);
      line-height: 1.7;
      font-size: 0.95rem;
      overflow-wrap: anywhere;
    }
    .legal-doc h1 {
      margin: 0;
      font-size: clamp(1.5rem, 4vw, 2.2rem);
      font-weight: 800;
      line-height: 1.2;
    }
    .meta {
      margin: 0.4rem 0 1.5rem;
      color: var(--muted, #64748b);
      font-size: 0.85rem;
    }
    :host ::ng-deep .legal-doc h2 {
      margin: 2rem 0 0.5rem;
      font-size: 1.15rem;
    }
    :host ::ng-deep .legal-doc table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    :host ::ng-deep .legal-doc th,
    :host ::ng-deep .legal-doc td {
      padding: 0.5rem;
      border: 1px solid var(--border, #e2e8f0);
      text-align: left;
      vertical-align: top;
    }
    :host ::ng-deep .legal-doc .table-wrap {
      overflow-x: auto;
    }
    :host ::ng-deep .legal-doc a {
      color: #4f46e5;
      font-weight: 600;
    }
    .legal-footer {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem 1.25rem;
      margin-top: 1.5rem;
      color: var(--muted, #64748b);
      font-size: 0.85rem;
    }
    .legal-footer a,
    .legal-footer button {
      color: inherit;
      font: inherit;
      font-weight: 600;
    }
    .legal-footer button {
      padding: 0;
      border: 0;
      background: none;
      text-decoration: underline;
      cursor: pointer;
    }
    a:focus-visible,
    button:focus-visible {
      outline: 3px solid #7c3aed;
      outline-offset: 2px;
    }
  `,
})
export class LegalLayout {
  readonly heading = input.required<string>();
  protected readonly entity = LEGAL_ENTITY;
  protected readonly consent = inject(CookieConsentService);
}
