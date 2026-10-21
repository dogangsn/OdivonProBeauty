import {
  NailHealthAssessment,
  NailSterilizationRecord,
  NailSwatch,
  NailTechnique,
  NailWarrantyRecord,
} from './nail-studio.model';

export const NAIL_TECHNIQUES: readonly NailTechnique[] = [
  {
    id: 'tech-rubber-base',
    name: 'Rubber Base ile Jel Güçlendirme (Apex)',
    description: 'Doğal tırnak yapısını kalınlaştıran, kırılmayı önleyen esnek ve son derece dayanıklı kauçuk jel mimarisi.',
    durationMin: 60,
    basePrice: 750,
    category: 'strengthening',
    popular: true,
  },
  {
    id: 'tech-hard-gel-extension',
    name: 'Şablonlu Hard Gel Protez Tırnak (Yeni Set)',
    description: 'Kağıt şablon üzerinde tırnak yatağına özel sıfırdan inşa edilen ultra dayanıklı ve doğal hissettiren jel mimarisi.',
    durationMin: 100,
    basePrice: 1250,
    category: 'extension',
    popular: true,
  },
  {
    id: 'tech-polygel-dual-form',
    name: 'Dual Form ile Akrigel / Poligel Uzatma',
    description: 'Akrilik dayanıklılığı ile jelin esnekliğini birleştiren kokusuz, pürüzsüz ve hafif hibrit protez sistemi.',
    durationMin: 90,
    basePrice: 1150,
    category: 'extension',
  },
  {
    id: 'tech-russian-manicure',
    name: 'Kuru Kombine Manikür (Rus Manikürü)',
    description: 'Özel elmas freze uçlarıyla kütiküllerin pürüzsüzce temizlendiği, ojeyi kütikül altına kadar uygulayan kusursuz teknik.',
    durationMin: 40,
    basePrice: 450,
    category: 'manicure',
    popular: true,
  },
  {
    id: 'tech-gel-polish-set',
    name: 'Kalıcı Oje & Mikro Manikür (El)',
    description: '3-4 hafta boyunca parlaklığını ve pürüzsüzlüğünü koruyan profesyonel kalıcı oje uygulaması.',
    durationMin: 50,
    basePrice: 600,
    category: 'manicure',
  },
  {
    id: 'tech-medical-pedicure',
    name: 'Medikal Ayak Bakımı & Cihazlı Pedikür',
    description: 'Nasır, çatlak topuk, kalınlaşmış tırnak plağı ve batık tırnakların hijyenik freze uçlarıyla medikal bakımı.',
    durationMin: 60,
    basePrice: 900,
    category: 'pedicure',
  },
  {
    id: 'tech-refill-maintenance',
    name: 'Protez Tırnak Dip Dolgusu & Bakım (3. Hafta)',
    description: 'Uzayan tırnak dibinin doldurulması, apex dengesinin yeniden kurulması, boy kısaltma ve yeni renk uygulaması.',
    durationMin: 75,
    basePrice: 850,
    category: 'strengthening',
    popular: true,
  },
  {
    id: 'tech-safe-removal',
    name: 'Freze ile Güvenli Jel / Akrilik Sökümü',
    description: 'Doğal tırnak plağına zarar vermeden seramik karbür uçla jelin inceltilerek çıkarılması ve keratin besleme.',
    durationMin: 30,
    basePrice: 250,
    category: 'removal',
  },
  {
    id: 'tech-single-repair',
    name: 'Tek Tırnak Onarımı / Kırık Tamiri',
    description: 'Çatlayan, kırılan veya hava alan tek tırnağın ipek şerit veya jel ile 15 dakikada hızlıca yenilenmesi.',
    durationMin: 15,
    basePrice: 150,
    category: 'strengthening',
  },
];

export const NAIL_SWATCHES: readonly NailSwatch[] = [
  // Nude & Doğal Tonlar
  { id: 'sw-1', code: 'KD-01', brand: 'Kodi Professional', name: 'Milky Nude Cream', hex: '#f6ede4', category: 'nude', finish: 'glossy', inStock: true, popular: true },
  { id: 'sw-2', code: 'KD-04', brand: 'Kodi Professional', name: 'Ballerina Soft Pink', hex: '#f0d7d7', category: 'nude', finish: 'glossy', inStock: true, popular: true },
  { id: 'sw-3', code: 'CND-Romantique', brand: 'CND Shellac', name: 'Romantique Sheer', hex: '#fae3dc', category: 'nude', finish: 'pearl', inStock: true },
  { id: 'sw-4', code: 'OPI-BubbleBath', brand: 'OPI GelColor', name: 'Bubble Bath Iconic', hex: '#f9e0db', category: 'nude', finish: 'glossy', inStock: true, popular: true },
  { id: 'sw-5', code: 'OPI-FunnyBunny', brand: 'OPI GelColor', name: 'Funny Bunny Milky White', hex: '#f7f6f2', category: 'nude', finish: 'glossy', inStock: true, popular: true },
  { id: 'sw-6', code: 'LX-Cashmere', brand: 'Luxio Gel', name: 'Pure Cashmere Warm', hex: '#d6c1b4', category: 'nude', finish: 'matte', inStock: true },

  // Klasik Kırmızı & Bordo
  { id: 'sw-7', code: 'OPI-BigApple', brand: 'OPI GelColor', name: 'Big Apple Scarlet Red', hex: '#ba0c2f', category: 'red', finish: 'glossy', inStock: true, popular: true },
  { id: 'sw-8', code: 'CND-Oxblood', brand: 'CND Shellac', name: 'Deep Crimson Wine', hex: '#630b19', category: 'red', finish: 'glossy', inStock: true, popular: true },
  { id: 'sw-9', code: 'KD-RedVelvet', brand: 'Kodi Professional', name: 'Velvet Cherry Red', hex: '#871328', category: 'red', finish: 'matte', inStock: true },
  { id: 'sw-10', code: 'ES-Wicked', brand: 'Essie Gel', name: 'Wicked Dark Burgundy', hex: '#42060f', category: 'red', finish: 'glossy', inStock: true },
  { id: 'sw-11', code: 'LX-Rouge', brand: 'Luxio Gel', name: 'Royal Classic Rouge', hex: '#9e1b2f', category: 'red', finish: 'glossy', inStock: true },

  // Pastel & Bahar
  { id: 'sw-12', code: 'KD-Lavender', brand: 'Kodi Professional', name: 'Lilac Mist Pastel', hex: '#cfc4dc', category: 'pastel', finish: 'glossy', inStock: true },
  { id: 'sw-13', code: 'ES-MintCandy', brand: 'Essie Gel', name: 'Mint Candy Apple', hex: '#bce4d8', category: 'pastel', finish: 'glossy', inStock: true },
  { id: 'sw-14', code: 'CND-Sage', brand: 'CND Shellac', name: 'Wild Moss Sage', hex: '#9bb09e', category: 'pastel', finish: 'matte', inStock: true },
  { id: 'sw-15', code: 'KD-BabyBlue', brand: 'Kodi Professional', name: 'Serenity Baby Blue', hex: '#b8d5e5', category: 'pastel', finish: 'glossy', inStock: true },
  { id: 'sw-16', code: 'LX-Butter', brand: 'Luxio Gel', name: 'Buttercup Pastel Yellow', hex: '#fef1b8', category: 'pastel', finish: 'glossy', inStock: false },

  // Gece & Koyu Tonlar
  { id: 'sw-17', code: 'KD-Midnight', brand: 'Kodi Professional', name: 'Pure Obsidian Black', hex: '#121214', category: 'dark', finish: 'glossy', inStock: true, popular: true },
  { id: 'sw-18', code: 'OPI-LincolnPark', brand: 'OPI GelColor', name: 'Lincoln Park Midnight', hex: '#241a24', category: 'dark', finish: 'glossy', inStock: true },
  { id: 'sw-19', code: 'CND-Emerald', brand: 'CND Shellac', name: 'Imperial Emerald Green', hex: '#0a3d2e', category: 'dark', finish: 'glossy', inStock: true },
  { id: 'sw-20', code: 'LX-Navy', brand: 'Luxio Gel', name: 'Deep Royal Navy Blue', hex: '#10223b', category: 'dark', finish: 'matte', inStock: true },
  { id: 'sw-21', code: 'KD-Choco', brand: 'Kodi Professional', name: 'Rich Espresso Truffle', hex: '#341f1a', category: 'dark', finish: 'glossy', inStock: true },

  // Simli & Efekt (Glitter / Chrome)
  { id: 'sw-22', code: 'OPI-GlazedDonut', brand: 'OPI Chrome Effects', name: 'Hailey Glazed Donut Chrome', hex: '#ede6dd', category: 'glitter', finish: 'chrome', inStock: true, popular: true },
  { id: 'sw-23', code: 'KD-RoseGold', brand: 'Kodi Professional', name: 'Champagne Rose Shimmer', hex: '#d9a08e', category: 'glitter', finish: 'glitter', inStock: true, popular: true },
  { id: 'sw-24', code: 'CND-Platinum', brand: 'CND Shellac', name: 'Liquid Platinum Silver', hex: '#d5d7dc', category: 'glitter', finish: 'chrome', inStock: true },
  { id: 'sw-25', code: 'LX-Gilded', brand: 'Luxio Gel', name: '24K Pure Gold Dust', hex: '#d4af37', category: 'glitter', finish: 'glitter', inStock: true },

  // Manyetik Kedi Gözü (Cat-Eye 9D)
  { id: 'sw-26', code: 'KD-CatEye-Emerald', brand: 'Kodi 9D Magnetic', name: 'Mystic Jade Cat-Eye', hex: '#1a533c', category: 'cat-eye', finish: 'cat-eye', inStock: true, popular: true },
  { id: 'sw-27', code: 'KD-CatEye-Galaxy', brand: 'Kodi 9D Magnetic', name: 'Cosmic Violet Cat-Eye', hex: '#482860', category: 'cat-eye', finish: 'cat-eye', inStock: true, popular: true },
  { id: 'sw-28', code: 'KD-CatEye-Amber', brand: 'Kodi 9D Magnetic', name: 'Molten Amber Cat-Eye', hex: '#874118', category: 'cat-eye', finish: 'cat-eye', inStock: true },

  // Neon & Canlı
  { id: 'sw-29', code: 'ES-NeonCoral', brand: 'Essie Gel', name: 'Electric Sunset Coral', hex: '#ff5c58', category: 'neon', finish: 'glossy', inStock: true },
  { id: 'sw-30', code: 'KD-BarbiePink', brand: 'Kodi Professional', name: 'Hot Magenta Barbie', hex: '#e81775', category: 'neon', finish: 'glossy', inStock: true },
];

export const DEMO_NAIL_WARRANTIES: NailWarrantyRecord[] = [
  {
    id: 'war-101',
    customerId: 'cust-demo-1',
    customerName: 'Selin Yılmaz',
    phone: '+90 532 111 22 33',
    appliedDate: '2026-10-18',
    warrantyExpireDate: '2026-10-25', // 4 days remaining
    technicianStaffName: 'Elena Petrova (Tırnak Uzmanı)',
    technique: 'Şablonlu Hard Gel Protez Tırnak (Yeni Set)',
    nailShape: 'almond',
    swatchCode: 'KD-04 (Ballerina Soft Pink)',
    status: 'active',
  },
  {
    id: 'war-102',
    customerId: 'cust-demo-2',
    customerName: 'Melis Doğan',
    phone: '+90 533 222 33 44',
    appliedDate: '2026-10-19',
    warrantyExpireDate: '2026-10-26', // 5 days remaining
    technicianStaffName: 'Anna Ivanova (Master Nail Artist)',
    technique: 'Rubber Base ile Jel Güçlendirme (Apex)',
    nailShape: 'square',
    swatchCode: 'OPI-BubbleBath',
    status: 'active',
  },
  {
    id: 'war-103',
    customerId: 'cust-demo-3',
    customerName: 'Büşra Çelik',
    phone: '+90 535 444 55 66',
    appliedDate: '2026-10-15',
    warrantyExpireDate: '2026-10-22', // 1 day remaining - urgent
    technicianStaffName: 'Elena Petrova (Tırnak Uzmanı)',
    technique: 'Dual Form ile Akrigel Uzatma',
    nailShape: 'coffin',
    swatchCode: 'OPI-BigApple',
    status: 'claimed',
    claimedAt: '2026-10-20',
    damagedFinger: 'right-middle',
    repairNotes: 'Orta parmak kenardan darbe almış, apex korundu, serbest kenar yeniden şablonla tamamlandı.',
    repairCompletedDate: '2026-10-20',
  },
  {
    id: 'war-104',
    customerId: 'cust-demo-4',
    customerName: 'Gamze Kaya',
    phone: '+90 536 777 88 99',
    appliedDate: '2026-10-12',
    warrantyExpireDate: '2026-10-19',
    technicianStaffName: 'Merve Arslan (Estetisyen)',
    technique: 'Kalıcı Oje & Mikro Manikür (El)',
    nailShape: 'squoval',
    swatchCode: 'CND-Oxblood',
    status: 'expired',
  },
];

export const DEMO_STERILIZATIONS: NailSterilizationRecord[] = [
  {
    id: 'st-501',
    cycleNumber: 'CYC-20261021-01',
    autoclaveDeviceName: 'Melag Vacuklav 23B+ (B-Class Medikal Otoklav)',
    sterilizedAt: '2026-10-21 08:30',
    sterilizedByStaffName: 'Başhemşire / Hijyen Sorumlusu',
    temperatureCelsius: 134,
    pressureBar: 2.15,
    holdTimeMinutes: 18,
    indicatorStripPassed: true,
    batchPouchBarcode: 'POUCH-883921-A',
    instrumentCount: 16,
    assignedCustomerName: 'Selin Yılmaz',
    notes: 'B-Class vakumlu döngü başarıyla tamamlandı, kimyasal indikatör rengi kahverengiye döndü.',
  },
  {
    id: 'st-502',
    cycleNumber: 'CYC-20261021-02',
    autoclaveDeviceName: 'Melag Vacuklav 23B+ (B-Class Medikal Otoklav)',
    sterilizedAt: '2026-10-21 11:00',
    sterilizedByStaffName: 'Elena Petrova (Tırnak Uzmanı)',
    temperatureCelsius: 134,
    pressureBar: 2.12,
    holdTimeMinutes: 18,
    indicatorStripPassed: true,
    batchPouchBarcode: 'POUCH-883922-B',
    instrumentCount: 12,
    assignedCustomerName: 'Melis Doğan',
    notes: 'Kuru freze uçları ve pensler tekli steril torbalarında mühürlendi.',
  },
];

export const DEMO_NAIL_HEALTH: NailHealthAssessment[] = [
  {
    customerId: 'cust-demo-1',
    customerName: 'Selin Yılmaz',
    assessedAt: '2026-10-18',
    assessedByStaffName: 'Elena Petrova (Tırnak Uzmanı)',
    nailPlateThickness: 'thin',
    hasOnycholysis: false,
    hasFungalSuspicion: false,
    hasIngrownNail: false,
    hasHemaAllergy: false,
    hasMonomerSensitivity: false,
    hasRemovalDamage: true,
    recommendedTechnique: 'Rubber Base ile Nazik Jel Güçlendirme & IBX Bakım Kürü',
    contraindications: ['Aseton ile eritme yapılmamalı (freze ile nazik inceltme şart)', 'Primer asitsiz olmalı'],
    carePlanNotes: 'Daha önce tırnağını kendisi kopardığı için tırnak plağı incelmiş. 2 seans IBX keratin kürü uygulandı, Rubber Base ile koruma altına alındı.',
  },
];
