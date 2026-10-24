import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LEGAL_ENTITY } from '../../core/seo/site';
import { LegalLayout } from './legal-layout';

@Component({
  selector: 'app-terms',
  imports: [LegalLayout, RouterLink],
  template: `
    <app-legal-layout heading="Kullanım Şartları">
      <p>
        Bu Kullanım Şartları ("Şartlar"), {{ e.name }} ("Odivon", "biz") tarafından sunulan
        OdivonPro Beauty bulut yazılımının ("Hizmet") kullanımına ilişkin koşulları düzenler. Hesap
        oluşturarak veya Hizmet'i kullanarak bu Şartları kabul etmiş olursunuz.
      </p>

      <h2 id="tanimlar">1. Taraflar ve tanımlar</h2>
      <p>
        <strong>İşletme:</strong> Hizmet'e abone olan güzellik, spa veya wellness merkezi ve onun
        adına hesabı kullanan yetkili personel. <strong>Müşteri:</strong> İşletme'nin hizmet verdiği
        ve müşteri portalını veya ödeme bağlantılarını kullanan kişi.
      </p>

      <h2 id="hizmet">2. Hizmetin kapsamı</h2>
      <p>
        Hizmet; randevu planlama, müşteri kayıtları (CRM), paket ve seans takibi, personel, kasa,
        stok, kampanya, raporlama ve müşteri portalı özelliklerini internet üzerinden sunar.
        Özellikler abonelik planına göre değişebilir. Hizmet'i geliştirmek için özellikleri
        güncelleyebilir, ekleyebilir veya kaldırabiliriz; esaslı değişiklikleri önceden duyururuz.
      </p>

      <h2 id="hesap">3. Hesap ve güvenlik</h2>
      <ul>
        <li>Kayıt sırasında doğru ve güncel bilgi vermeniz gerekir.</li>
        <li>
          Hesap şifrenizin ve personel yetkilendirmelerinin gizliliğinden İşletme sorumludur.
          Yetkisiz kullanımı fark ettiğinizde bize hemen bildirin.
        </li>
        <li>Hesaplar 18 yaşından büyük ve İşletme adına yetkili kişilerce açılabilir.</li>
      </ul>

      <h2 id="abonelik">4. Deneme süresi, abonelik ve ödeme</h2>
      <ul>
        <li>
          Yeni hesaplar 14 gün ücretsiz deneme süresiyle başlar. Deneme için kart bilgisi istenmez.
        </li>
        <li>
          Deneme sonunda Hizmet'i kullanmaya devam etmek için ücretli bir plan seçmeniz gerekir.
          Plan ücretleri ve kapsamı abonelik sayfasında gösterilir.
        </li>
        <li>
          Ödemeler, 3D Secure destekli lisanslı ödeme kuruluşları aracılığıyla alınır; kart
          bilgileriniz Odivon sunucularında saklanmaz.
        </li>
        <li>
          Aboneliğinizi dilediğiniz zaman iptal edebilirsiniz; iptal, içinde bulunulan dönemin
          sonunda geçerli olur. Kanunen zorunlu haller dışında kullanılmış döneme ait ücret iadesi
          yapılmaz.
        </li>
      </ul>

      <h2 id="kullanim">5. Kabul edilebilir kullanım</h2>
      <p>Hizmet'i kullanırken şunları yapmamayı kabul edersiniz:</p>
      <ul>
        <li>
          Hukuka aykırı, yanıltıcı veya üçüncü kişilerin haklarını ihlal eden içerik yüklemek;
        </li>
        <li>
          Müşterilerinize, 6563 sayılı Kanun kapsamındaki onayları olmadan ticari elektronik ileti
          (SMS, e-posta vb.) göndermek;
        </li>
        <li>
          Sisteme yetkisiz erişim denemek, güvenlik önlemlerini aşmaya çalışmak veya aşırı yük
          bindirmek;
        </li>
        <li>Hizmet'i tersine mühendislik ile çözmek, kopyalamak veya yeniden satmak.</li>
      </ul>

      <h2 id="veriler">6. Verileriniz ve kişisel veriler</h2>
      <p>
        İşletme'nin Hizmet'e girdiği müşteri, personel ve işlem verileri İşletme'ye aittir. Bu
        veriler bakımından İşletme 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") anlamında
        <strong>veri sorumlusu</strong>, Odivon ise İşletme'nin talimatıyla veriyi işleyen
        <strong>veri işleyen</strong> konumundadır. İşletme; müşterilerini aydınlatmak, gerekli açık
        rızaları (özellikle sağlık verileri ve ticari ileti onayları) almak ve bunları kayıt altında
        tutmakla yükümlüdür. Odivon'un kendi adına işlediği veriler için
        <a routerLink="/privacy">Gizlilik Politikası</a> geçerlidir.
      </p>
      <p>
        Aboneliğin sona ermesi halinde İşletme, sona erme tarihinden itibaren 30 gün içinde
        verilerinin dışa aktarılmasını talep edebilir. Bu sürenin sonunda veriler, kanuni saklama
        yükümlülükleri saklı kalmak kaydıyla silinir veya anonim hale getirilir.
      </p>

      <h2 id="odeme-baglantilari">7. Ödeme bağlantıları ve müşteri işlemleri</h2>
      <p>
        İşletme'nin müşterilerine ödeme bağlantısı veya müşteri portalı üzerinden sunduğu hizmet ve
        satışlarda satıcı İşletme'dir. Mesafeli satış sözleşmesi, ön bilgilendirme formu, cayma ve
        iade koşulları İşletme ile müşterisi arasındadır ve 6502 sayılı Tüketicinin Korunması
        Hakkında Kanun'a uygun şekilde İşletme tarafından sağlanır. Odivon bu işlemlerde yalnızca
        teknik altyapı sağlar.
      </p>

      <h2 id="fikri-mulkiyet">8. Fikri mülkiyet</h2>
      <p>
        Hizmet'in yazılımı, tasarımı, markaları ve dokümantasyonu Odivon'a aittir. Abonelik
        süresince size Hizmet'i bu Şartlara uygun kullanmanız için devredilemez, münhasır olmayan
        bir kullanım hakkı tanınır.
      </p>

      <h2 id="erisilebilirlik">9. Hizmet sürekliliği ve sorumluluk</h2>
      <p>
        Hizmet'i kesintisiz ve güvenli sunmak için makul çabayı gösteririz; ancak planlı bakım,
        üçüncü taraf altyapı arızaları veya mücbir sebepler nedeniyle kesintiler olabilir. Kanunun
        izin verdiği ölçüde, dolaylı zararlar, kâr kaybı veya veri kaybından doğan zararlardan
        sorumlu değiliz ve toplam sorumluluğumuz, zarara yol açan olaydan önceki 12 ayda ödediğiniz
        abonelik bedeliyle sınırlıdır. Kast ve ağır kusur halleri saklıdır.
      </p>

      <h2 id="fesih">10. Askıya alma ve fesih</h2>
      <p>
        Bu Şartların ağır ihlali, ödeme yapılmaması veya Hizmet'in güvenliğini tehdit eden kullanım
        halinde hesabı askıya alabilir veya sözleşmeyi feshedebiliriz. Mümkün olduğunda önceden
        bildirim yaparız.
      </p>

      <h2 id="degisiklik">11. Değişiklikler</h2>
      <p>
        Bu Şartları güncelleyebiliriz. Esaslı değişiklikleri yürürlükten en az 15 gün önce e-posta
        veya uygulama içi bildirimle duyururuz. Değişiklikten sonra Hizmet'i kullanmaya devam
        etmeniz güncel Şartları kabul ettiğiniz anlamına gelir.
      </p>

      <h2 id="hukuk">12. Uygulanacak hukuk ve iletişim</h2>
      <p>
        Bu Şartlar Türkiye Cumhuriyeti kanunlarına tabidir. Uyuşmazlıklarda, tüketici sıfatına sahip
        kişilerin kanuni hakları saklı kalmak kaydıyla, Odivon'un yerleşim yerindeki mahkemeler ve
        icra daireleri yetkilidir. Sorularınız için:
        <a [href]="'mailto:' + e.email">{{ e.email }}</a
        >.
      </p>
    </app-legal-layout>
  `,
})
export class Terms {
  protected readonly e = LEGAL_ENTITY;
}
