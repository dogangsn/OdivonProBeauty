import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LEGAL_ENTITY } from '../../core/seo/site';
import { LegalLayout } from './legal-layout';

@Component({
  selector: 'app-privacy',
  imports: [LegalLayout, RouterLink],
  template: `
    <app-legal-layout heading="Gizlilik Politikası ve KVKK Aydınlatma Metni">
      <p>
        Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") madde 10 ve Aydınlatma
        Yükümlülüğünün Yerine Getirilmesinde Uyulacak Usul ve Esaslar Hakkında Tebliğ uyarınca,
        OdivonPro Beauty ("Hizmet") kapsamında kişisel verilerinizin nasıl işlendiğini açıklar.
      </p>

      <h2 id="veri-sorumlusu">1. Veri sorumlusu</h2>
      <p>
        Hizmet'in kullanıcısı olan işletmelerin hesap, abonelik ve fatura verileri ile web sitesi
        ziyaret verileri bakımından veri sorumlusu {{ e.name }}'dur ({{ e.address }}). İletişim:
        <a [href]="'mailto:' + e.email">{{ e.email }}</a
        >.
      </p>
      <p>
        <strong>İşletmelerin müşterileri için önemli not:</strong> Bir güzellik merkezinin müşterisi
        olarak randevu, seans, ödeme veya sağlık bilgileriniz o merkez tarafından kaydediliyorsa, bu
        veriler bakımından veri sorumlusu ilgili <strong>işletmedir</strong>; Odivon yalnızca
        işletme adına ve talimatıyla veriyi işleyen (veri işleyen) konumundadır. Haklarınızı
        kullanmak için öncelikle ilgili işletmeye başvurmanız gerekir; talebinizi bize iletirseniz
        işletmeye yönlendiririz.
      </p>

      <h2 id="veriler">2. İşlenen kişisel veriler</h2>
      <ul>
        <li><strong>Kimlik ve iletişim:</strong> ad soyad, e-posta, telefon, işletme adı.</li>
        <li>
          <strong>Hesap ve güvenlik:</strong> kullanıcı kimliği, rol ve yetkiler, oturum kayıtları,
          işlem (log) kayıtları, IP adresi.
        </li>
        <li>
          <strong>Abonelik ve finans:</strong> plan bilgisi, fatura bilgileri, ödeme işlem sonucu
          (kart numarası Odivon'da tutulmaz).
        </li>
        <li>
          <strong>Kullanım verileri:</strong> yalnızca analitik çerezlere izin verdiyseniz
          anonimleştirilmiş sayfa görüntüleme ve cihaz/tarayıcı bilgileri.
        </li>
        <li>
          <strong>Müşteri portalı:</strong> telefon numarası ve doğrulama bilgisi, randevu ve paket
          bilgileri.
        </li>
      </ul>

      <h2 id="amaclar">3. İşleme amaçları ve hukuki sebepler</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Amaç</th>
              <th>Hukuki sebep (KVKK md. 5/2)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Hesap oluşturma, Hizmet'in sunulması, abonelik yönetimi</td>
              <td>Sözleşmenin kurulması ve ifası (c)</td>
            </tr>
            <tr>
              <td>Faturalama, muhasebe ve yasal saklama yükümlülükleri</td>
              <td>Kanunlarda açıkça öngörülme (a), hukuki yükümlülük (ç)</td>
            </tr>
            <tr>
              <td>Bilgi güvenliği, kötüye kullanımın önlenmesi, işlem kayıtları</td>
              <td>Hukuki yükümlülük (ç), meşru menfaat (f)</td>
            </tr>
            <tr>
              <td>Destek talepleri ve hizmetle ilgili bildirimler</td>
              <td>Sözleşmenin ifası (c), meşru menfaat (f)</td>
            </tr>
            <tr>
              <td>Anonim kullanım istatistikleri (Google Analytics)</td>
              <td>Açık rıza (md. 5/1) — çerez tercihinizle verilir ve geri alınabilir</td>
            </tr>
            <tr>
              <td>Kampanya ve tanıtım iletileri</td>
              <td>Açık rıza ve 6563 sayılı Kanun kapsamında ticari ileti onayı</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="ozel-nitelikli">4. Özel nitelikli kişisel veriler</h2>
      <p>
        İşletmeler, müşteri sağlık formu ve onam kayıtları gibi özel nitelikli kişisel verileri
        Hizmet'e girebilir. Bu verilerin işlenmesi için KVKK madde 6 uyarınca gerekli açık rızayı
        almak ve ek güvenlik önlemlerine uymak ilgili işletmenin sorumluluğundadır. Odivon bu
        verileri yalnızca işletme adına saklar; başka bir amaçla kullanmaz.
      </p>

      <h2 id="aktarim">5. Kişisel verilerin aktarılması</h2>
      <p>
        Verileriniz yalnızca yukarıdaki amaçlarla ve gerekli olduğu ölçüde şu alıcılara
        aktarılabilir:
      </p>
      <ul>
        <li>Barındırma ve kimlik doğrulama: Google Cloud / Firebase, Cloudflare;</li>
        <li>Ödeme: lisanslı ödeme ve elektronik para kuruluşları;</li>
        <li>SMS ve e-posta gönderimi: işletmenin seçtiği ileti hizmet sağlayıcıları;</li>
        <li>Analitik (yalnızca izin verdiyseniz): Google Analytics;</li>
        <li>Talep halinde yetkili kamu kurum ve kuruluşları.</li>
      </ul>
      <p>
        Bu hizmet sağlayıcıların bir kısmının sunucuları yurt dışında bulunduğundan, aktarım KVKK
        madde 9'da öngörülen uygun güvenceler (standart sözleşme vb.) veya açık rızanız çerçevesinde
        gerçekleştirilir.
      </p>

      <h2 id="yontem">6. Toplama yöntemi</h2>
      <p>
        Kişisel veriler; kayıt ve giriş formları, uygulama ekranları, müşteri portalı, ödeme
        sayfaları ve çerezler aracılığıyla elektronik ortamda, otomatik veya kısmen otomatik
        yollarla toplanır.
      </p>

      <h2 id="saklama">7. Saklama süresi</h2>
      <p>
        Veriler, işleme amacının gerektirdiği süre boyunca ve ilgili mevzuattaki zamanaşımı ile
        saklama süreleri (örneğin vergi mevzuatı kapsamında 10 yıl) kadar saklanır; süre dolduğunda
        silinir, yok edilir veya anonim hale getirilir. Abonelik sona erdiğinde işletme verileri
        <a routerLink="/terms" fragment="veriler">Kullanım Şartları</a>'nda belirtilen süre sonunda
        silinir.
      </p>

      <h2 id="haklar">8. KVKK madde 11 kapsamındaki haklarınız</h2>
      <ul>
        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme ve işlenmişse bilgi talep etme;</li>
        <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme;</li>
        <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme;</li>
        <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme;</li>
        <li>KVKK madde 7'deki şartlar çerçevesinde silinmesini veya yok edilmesini isteme;</li>
        <li>Düzeltme ve silme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme;</li>
        <li>
          Münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonuç çıkmasına
          itiraz etme;
        </li>
        <li>
          Kanuna aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme.
        </li>
      </ul>

      <h2 id="basvuru">9. Başvuru</h2>
      <p>
        Haklarınızı kullanmak için talebinizi, kimliğinizi doğrulayan bilgilerle birlikte
        <a [href]="'mailto:' + e.email">{{ e.email }}</a> adresine iletebilirsiniz. Başvurular, Veri
        Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ uyarınca en geç 30 gün içinde ücretsiz
        olarak sonuçlandırılır.
      </p>

      <h2 id="guvenlik">10. Güvenlik</h2>
      <p>
        Veriler şifreli bağlantı (HTTPS) üzerinden iletilir; erişim rol tabanlı yetkilendirme ve
        işlem kayıtlarıyla sınırlandırılır. Çerez kullanımına ilişkin ayrıntılar için
        <a routerLink="/cookies">Çerez Politikası</a>'na bakabilirsiniz.
      </p>
    </app-legal-layout>
  `,
})
export class Privacy {
  protected readonly e = LEGAL_ENTITY;
}
