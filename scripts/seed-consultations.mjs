const apiKey = 'AIzaSyAu1u-wKeR9RQBhp6lqUvo64ZbQ5fNDIGg';

async function main() {
  console.log('Authenticating as odivonbeauty@odivon.com for consultations...');
  const authRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'odivonbeauty@odivon.com',
        password: '123654Dg',
        returnSecureToken: true,
      }),
    }
  );

  const authData = await authRes.json();
  if (!authData.idToken) {
    console.error('Auth failed:', authData);
    process.exit(1);
  }

  const token = authData.idToken;

  // Fetch branch
  const branchRes = await fetch('https://mainapi.odivon.com/api/v1/beauty/branches', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const branchData = await branchRes.json();
  const branchId = branchData.data?.[0]?.id;

  const consultations = [
    {
      customerName: 'Zeynep Kaya',
      phone: '+90 532 411 20 30',
      email: 'zeynep.kaya@example.com',
      serviceCategory: 'Medikal Cilt Bakımı',
      inquiredSession: 'Karbon Peeling & Q-Switch Leke Seansı (5 Seans)',
      targetSessionsCount: 5,
      quotedPrice: 4500,
      consultantStaffName: 'Uzm. Est. Ayşe Yılmaz',
      consultationDate: '2026-10-18',
      nextFollowUpDate: '2026-10-25',
      interestLevel: 'high',
      channel: 'Yüz Yüze',
      status: 'inquiry',
      notes: 'Yaz sonrası yanak bölgesindeki güneş lekelerinden şikayetçi. Deneme atışı yapıldı, tolere etti.',
    },
    {
      customerName: 'Elif Demir',
      phone: '+90 533 555 44 22',
      email: 'elif.demir@example.com',
      serviceCategory: 'Bölgesel İncelme',
      inquiredSession: 'G5 Bölgesel Selülit & Lenf Drenaj (10 Seans)',
      targetSessionsCount: 10,
      quotedPrice: 8500,
      consultantStaffName: 'Eda Koç',
      consultationDate: '2026-10-15',
      nextFollowUpDate: '2026-10-22',
      interestLevel: 'high',
      channel: 'Telefon',
      status: 'scheduled',
      notes: 'Bacak ödemi ve selülit için 10 seanslık kombine paket önerildi, ilk seans randevusu planlandı.',
    },
    {
      customerName: 'Ceren Aydın (Aday Müşteri)',
      phone: '+90 541 333 88 11',
      email: 'ceren.aydin@example.com',
      serviceCategory: 'Lazer Epilasyon',
      inquiredSession: 'Buz Lazer Tüm Vücut Epilasyon (8 Seans)',
      targetSessionsCount: 8,
      quotedPrice: 9500,
      consultantStaffName: 'Uzm. Est. Ayşe Yılmaz',
      consultationDate: '2026-10-19',
      nextFollowUpDate: '2026-10-26',
      interestLevel: 'high',
      channel: 'Yüz Yüze',
      status: 'inquiry',
      notes: 'Aday müşteri; acı eşiğinden korktuğunu belirtti, buz başlık konforunu anlattık. Maaş gününde başlayacak.',
    },
    {
      customerName: 'Hakan Yıldırım (Aday Müşteri)',
      phone: '+90 535 777 66 55',
      serviceCategory: 'Lazer Epilasyon',
      inquiredSession: 'Erkek Sırt, Omuz & Ense Lazer (6 Seans)',
      targetSessionsCount: 6,
      quotedPrice: 6000,
      consultantStaffName: 'Kemal Uzun',
      consultationDate: '2026-10-17',
      nextFollowUpDate: '2026-10-24',
      interestLevel: 'medium',
      channel: 'WhatsApp',
      status: 'inquiry',
      notes: 'Sporcu; kıl yoğunluğu fazla. WhatsApp üzerinden broşür ve fiyat teklifi iletildi.',
    },
    {
      customerName: 'Sinem Polat',
      phone: '+90 532 999 11 22',
      email: 'sinem.polat@example.com',
      serviceCategory: 'Medikal Cilt Bakımı',
      inquiredSession: 'Hydrafacial Medikal Cilt Bakımı (4 Seans)',
      targetSessionsCount: 4,
      quotedPrice: 3600,
      consultantStaffName: 'Eda Koç',
      consultationDate: '2026-10-14',
      nextFollowUpDate: '2026-10-21',
      interestLevel: 'high',
      channel: 'Instagram',
      status: 'converted',
      notes: 'Instagram story kampanyamızı görüp sordu. 4 seanslık paketi satın alarak ilk bakımını yaptırdı.',
    },
    {
      customerName: 'Büşra Aydın',
      phone: '+90 534 666 55 44',
      email: 'busra.aydin@example.com',
      serviceCategory: 'Kalıcı Makyaj',
      inquiredSession: 'Kaş Laminasyonu & Keratin Kirpik Lifting (3 Seans)',
      targetSessionsCount: 3,
      quotedPrice: 2200,
      consultantStaffName: 'Eda Koç',
      consultationDate: '2026-10-12',
      nextFollowUpDate: '2026-10-19',
      interestLevel: 'high',
      channel: 'Yüz Yüze',
      status: 'scheduled',
      notes: 'Özel bir davet öncesi kaş ve kirpik lifting yaptırmak istiyor, randevu oluşturuldu.',
    },
    {
      customerName: 'Burak Öztürk',
      phone: '+90 542 333 44 55',
      email: 'burak.ozturk@example.com',
      serviceCategory: 'Lazer Epilasyon',
      inquiredSession: 'Erkek Sakal Üstü & Boyun Çizgisi Lazer (6 Seans)',
      targetSessionsCount: 6,
      quotedPrice: 2400,
      consultantStaffName: 'Kemal Uzun',
      consultationDate: '2026-10-16',
      nextFollowUpDate: '2026-10-23',
      interestLevel: 'medium',
      channel: 'Telefon',
      status: 'inquiry',
      notes: 'Tıraş sonrası batık ve sivilcelenme için 6 seanslık Diyot lazer protokolü önerildi.',
    },
    {
      customerName: 'Gamze Arslan',
      phone: '+90 532 876 54 32',
      email: 'gamze.arslan@example.com',
      serviceCategory: 'Medikal Cilt Bakımı',
      inquiredSession: 'Altın İğne & Fraksiyonel RF Seansı (6 Seans)',
      targetSessionsCount: 6,
      quotedPrice: 16800,
      consultantStaffName: 'Dr. Zerrin Tekin',
      consultationDate: '2026-10-10',
      nextFollowUpDate: '2026-10-17',
      interestLevel: 'high',
      channel: 'Yüz Yüze',
      status: 'converted',
      notes: 'Göz ve boyun çizgileri için danışmanlık aldı. Taksitli paket satışı yapıldı.',
    },
    {
      customerName: 'Derya Koç',
      phone: '+90 536 777 88 99',
      email: 'derya.koc@example.com',
      serviceCategory: 'Bölgesel İncelme',
      inquiredSession: 'Pasif Jimnastik & Kavitasyon Seansı (8 Seans)',
      targetSessionsCount: 8,
      quotedPrice: 7200,
      consultantStaffName: 'Seda Akman',
      consultationDate: '2026-10-11',
      nextFollowUpDate: '2026-10-25',
      interestLevel: 'low',
      channel: 'Web',
      status: 'inquiry',
      notes: 'Web formundan bilgi talep etti. Fiyat araştırması yapıyor.',
    },
    {
      customerName: 'Merve Yıldız',
      phone: '+90 554 812 34 56',
      email: 'merve.yildiz@example.com',
      serviceCategory: 'Medikal Cilt Bakımı',
      inquiredSession: 'Mavi Işık LED Terapi & Medikal Hassas Bakım (4 Seans)',
      targetSessionsCount: 4,
      quotedPrice: 2800,
      consultantStaffName: 'Uzm. Est. Ayşe Yılmaz',
      consultationDate: '2026-10-13',
      nextFollowUpDate: '2026-10-20',
      interestLevel: 'high',
      channel: 'Yüz Yüze',
      status: 'scheduled',
      notes: 'Lazer sordu fakat Roaccutane tedavisi nedeniyle kontrendike olduğu açıklandı. Yatıştırıcı LED bakım önerildi, randevusu verildi.',
    },
  ];

  let count = 0;
  for (const c of consultations) {
    console.log(`Seeding consultation for ${c.customerName}...`);
    const res = await fetch('https://mainapi.odivon.com/api/v1/beauty/consultations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        branchId,
        data: c,
      }),
    });
    const result = await res.json();
    if (result.success) {
      console.log(` Created consultation with ID: ${result.data.id}`);
      count++;
    } else {
      console.error(` Failed:`, result);
    }
  }

  console.log(`\n Successfully seeded ${count} consultation records!`);
}

main().catch(console.error);
