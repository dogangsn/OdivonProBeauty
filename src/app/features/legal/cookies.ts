import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CookieConsentService } from '../../core/consent/cookie-consent.service';
import { LegalLayout } from './legal-layout';

@Component({
  selector: 'app-cookies',
  imports: [LegalLayout, RouterLink],
  template: `
    <app-legal-layout heading="Çerez Politikası">
      <p>
        OdivonPro Beauty, hizmetin çalışması için zorunlu olan çerezleri ve benzeri tarayıcı
        depolama alanlarını (localStorage, IndexedDB) kullanır. Analitik çerezler yalnızca açık
        rızanızla etkinleştirilir. Kişisel verilerin işlenmesine ilişkin genel bilgi için
        <a routerLink="/privacy">Gizlilik Politikası</a>'na bakabilirsiniz.
      </p>

      <h2 id="kullanilanlar">Kullandığımız çerezler ve depolama alanları</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ad</th>
              <th>Tür</th>
              <th>Amaç</th>
              <th>Süre</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>firebase:authUser, firebaseLocalStorageDb</td>
              <td>Zorunlu</td>
              <td>Güvenli oturum açma ve oturumu sürdürme (Firebase Authentication)</td>
              <td>Çıkış yapılana kadar</td>
            </tr>
            <tr>
              <td>odivon:cookie_consent</td>
              <td>Zorunlu</td>
              <td>Çerez tercihinizi hatırlama</td>
              <td>Siz değiştirene kadar</td>
            </tr>
            <tr>
              <td>odivon:preferred_lang, odivon:theme</td>
              <td>Zorunlu</td>
              <td>Dil ve tema tercihi</td>
              <td>Siz değiştirene kadar</td>
            </tr>
            <tr>
              <td>Uygulama sürümü ve önbellek (service worker)</td>
              <td>Zorunlu</td>
              <td>Uygulamanın hızlı açılması ve güncellenmesi</td>
              <td>Yeni sürüme kadar</td>
            </tr>
            <tr>
              <td>_ga, _ga_*</td>
              <td>Analitik (izne bağlı)</td>
              <td>Google Analytics ile anonim ziyaret ve kullanım istatistikleri</td>
              <td>En fazla 2 yıl</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="yonetim">Tercihlerinizi yönetme</h2>
      <p>
        İzninizi istediğiniz zaman geri alabilir veya yeniden verebilirsiniz. Analitik izni geri
        alındığında ölçüm durdurulur ve Google Analytics çerezleri silinir. Tarayıcı ayarlarınızdan
        da çerezleri silebilir veya engelleyebilirsiniz; zorunlu çerezlerin engellenmesi oturum
        açmayı engelleyebilir.
      </p>
      <p>
        Mevcut tercihiniz:
        <strong>{{
          consent.analyticsAllowed()
            ? 'Analitik çerezlere izin verildi'
            : consent.decided()
              ? 'Yalnızca zorunlu çerezler'
              : 'Henüz seçim yapılmadı'
        }}</strong
        >.
      </p>
      <p>
        <button type="button" class="manage" (click)="consent.openSettings()">
          Çerez tercihlerini değiştir
        </button>
      </p>
    </app-legal-layout>
  `,
  styles: `
    .manage {
      min-height: 2.75rem;
      padding: 0 1.1rem;
      border: 0;
      border-radius: 0.75rem;
      background: #4f46e5;
      color: #fff;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
  `,
})
export class Cookies {
  protected readonly consent = inject(CookieConsentService);
}
