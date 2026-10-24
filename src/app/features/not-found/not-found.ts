import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../core/auth';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <main class="nf" aria-labelledby="nf-title">
      <p class="nf__code" aria-hidden="true">404</p>
      <h1 id="nf-title">Aradığınız sayfa bulunamadı</h1>
      <p class="nf__lead">
        <code>{{ path }}</code> adresi taşınmış, silinmiş ya da hiç var olmamış olabilir.
      </p>
      <div class="nf__actions">
        @if (auth.authenticated()) {
          <a class="btn btn--primary" routerLink="/dashboard">Panele dön</a>
        } @else {
          <a class="btn btn--primary" routerLink="/login">Giriş sayfasına git</a>
          <a class="btn btn--ghost" routerLink="/register">14 gün ücretsiz deneyin</a>
        }
        <a class="btn btn--ghost" routerLink="/portal">Müşteri portalı</a>
      </div>
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background: radial-gradient(circle at 30% 20%, #2e1065 0%, #0c0a1d 60%);
      color: #fff;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    }
    .nf {
      display: grid;
      place-content: center;
      justify-items: center;
      gap: 0.75rem;
      min-height: 100vh;
      padding: 2rem 1rem;
      text-align: center;
    }
    .nf__code {
      margin: 0;
      font-size: clamp(5rem, 22vw, 9rem);
      font-weight: 900;
      line-height: 1;
      background: linear-gradient(135deg, #7dd3fc, #917aff 55%, #d946ef);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    h1 {
      margin: 0;
      font-size: clamp(1.4rem, 5vw, 2rem);
    }
    .nf__lead {
      max-width: 32rem;
      margin: 0;
      color: #c4bfdb;
      overflow-wrap: anywhere;
    }
    code {
      color: #e9d5ff;
    }
    .nf__actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.6rem;
      margin-top: 1rem;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      min-height: 2.9rem;
      padding: 0 1.25rem;
      border-radius: 0.8rem;
      font-weight: 700;
      text-decoration: none;
    }
    .btn--primary {
      background: #7c3aed;
      color: #fff;
    }
    .btn--ghost {
      border: 1px solid rgb(255 255 255 / 0.3);
      color: #fff;
    }
    .btn:focus-visible {
      outline: 3px solid #c4b5fd;
      outline-offset: 3px;
    }
  `,
})
export class NotFound {
  protected readonly auth = inject(Auth);
  protected readonly path = inject(Router).url;
}
