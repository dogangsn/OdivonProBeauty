export type NailShape =
  | 'almond'
  | 'coffin'
  | 'square'
  | 'squoval'
  | 'oval'
  | 'stiletto'
  | 'russian-almond';

export type NailLength = 'natural' | 'short' | 'medium' | 'long' | 'extra-long';

export type NailFinish =
  | 'glossy'
  | 'matte'
  | 'chrome'
  | 'pearl'
  | 'glitter'
  | 'cat-eye'
  | 'thermal';

export type NailArtTier = 'tier-0' | 'tier-1' | 'tier-2' | 'tier-3';

export type FingerKey =
  | 'right-thumb'
  | 'right-index'
  | 'right-middle'
  | 'right-ring'
  | 'right-pinky'
  | 'left-thumb'
  | 'left-index'
  | 'left-middle'
  | 'left-ring'
  | 'left-pinky';

export interface NailShapeMeta {
  key: NailShape;
  name: string;
  nameTr: string;
  description: string;
  idealFor: string;
  icon: string;
}

export interface NailLengthMeta {
  key: NailLength;
  label: string;
  extensionMm: string;
  surcharge: number;
  extraMinutes: number;
}

export interface NailTechnique {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  basePrice: number;
  category: 'extension' | 'strengthening' | 'manicure' | 'pedicure' | 'removal';
  popular?: boolean;
}

export interface NailArtTierMeta {
  tier: NailArtTier;
  label: string;
  subtitle: string;
  examples: string;
  extraMinutes: number;
  surcharge: number;
  badgeTone: 'emerald' | 'blue' | 'purple' | 'amber';
}

export interface NailSwatch {
  id: string;
  code: string;
  brand: string;
  name: string;
  hex: string;
  category: 'nude' | 'red' | 'pastel' | 'dark' | 'glitter' | 'cat-eye' | 'neon';
  finish: NailFinish;
  inStock: boolean;
  popular?: boolean;
}

export interface NailWarrantyRecord {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  branchId?: string;
  appliedDate: string;
  warrantyExpireDate: string; // Typically +7 days from application
  technicianStaffName: string;
  technique: string;
  nailShape: NailShape;
  swatchCode: string;
  status: 'active' | 'claimed' | 'expired';
  claimedAt?: string;
  damagedFinger?: FingerKey;
  repairNotes?: string;
  repairCompletedDate?: string;
}

export interface NailSterilizationRecord {
  id: string;
  cycleNumber: string;
  autoclaveDeviceName: string;
  sterilizedAt: string;
  sterilizedByStaffName: string;
  temperatureCelsius: number;
  pressureBar: number;
  holdTimeMinutes: number;
  indicatorStripPassed: boolean;
  batchPouchBarcode: string;
  instrumentCount: number;
  assignedCustomerName?: string;
  notes?: string;
}

export interface NailHealthAssessment {
  customerId: string;
  customerName: string;
  assessedAt: string;
  assessedByStaffName: string;
  nailPlateThickness: 'normal' | 'thin' | 'very-thin' | 'damaged';
  hasOnycholysis: boolean; // Tırnak boşalması
  hasFungalSuspicion: boolean; // Mantar şüphesi
  hasIngrownNail: boolean; // Tırnak batması
  hasHemaAllergy: boolean; // HEMA / Jel alerjisi
  hasMonomerSensitivity: boolean; // Akrilik monomer kokusu hassasiyeti
  hasRemovalDamage: boolean; // Kendi kendine koparma / aşırı freze hasarı
  recommendedTechnique: string;
  contraindications: string[];
  carePlanNotes: string;
}

export interface NailDesignConfig {
  shape: NailShape;
  length: NailLength;
  finish: NailFinish;
  techniqueId: string;
  swatchId: string;
  artTier: NailArtTier;
  needsRemoval: boolean;
  selectedFingerForAccent?: FingerKey;
}

export const NAIL_SHAPES: readonly NailShapeMeta[] = [
  {
    key: 'almond',
    name: 'Almond',
    nameTr: 'Badem',
    description: 'Kenarları zarifçe incelen, ucu yuvarlatılmış estetik ve dayanıklı form.',
    idealFor: 'Parmakları uzun ve ince gösterir, en popüler salon tercihidir.',
    icon: 'flare',
  },
  {
    key: 'coffin',
    name: 'Coffin / Ballerina',
    nameTr: 'Balerin / Coffin',
    description: 'Kenarları içe doğru daralan, ucu düz kesimli trend lüks form.',
    idealFor: 'Orta ve uzun tırnaklarda gösterişli nail art için idealdir.',
    icon: 'crop_square',
  },
  {
    key: 'square',
    name: 'Square',
    nameTr: 'Kare',
    description: 'Düz kenarlar ve 90 derece keskin köşeli klasik güçlü form.',
    idealFor: 'Geniş tırnak yatağında klasik Fransız (French) manikürü için mükemmel.',
    icon: 'check_box_outline_blank',
  },
  {
    key: 'squoval',
    name: 'Squoval',
    nameTr: 'Yumuşak Kare (Squoval)',
    description: 'Kare formun köşelerinin hafif yuvarlatıldığı kırılmaya en dirençli form.',
    idealFor: 'Günlük hayat ve ofis kullanımı için en pratik ve konforlu form.',
    icon: 'crop_portrait',
  },
  {
    key: 'oval',
    name: 'Oval',
    nameTr: 'Oval',
    description: 'Doğal tırnak kavisini takip eden pürüzsüz yuvarlak hatlar.',
    idealFor: 'Kısa ve orta boy tırnaklarda doğal ve temiz bir görünüm sağlar.',
    icon: 'circle',
  },
  {
    key: 'stiletto',
    name: 'Stiletto',
    nameTr: 'Stiletto',
    description: 'Merkeze doğru son derece sivrilen dramatik ve cesur tırnak formu.',
    idealFor: 'Özel davetler, sahne ve iddialı tırnak sanatı tutkunları için.',
    icon: 'navigation',
  },
  {
    key: 'russian-almond',
    name: 'Russian Almond',
    nameTr: 'Rus Bademi',
    description: 'Yüksek yan kenarlar ve belirgin üst apex mimarisine sahip üst düzey protez formu.',
    idealFor: 'İleri düzey şablonlu jel mimarisi ve yarışma stili tırnaklar.',
    icon: 'diamond',
  },
];

export const NAIL_LENGTHS: readonly NailLengthMeta[] = [
  { key: 'natural', label: 'Doğal Boy (Sıfır Uzatma)', extensionMm: '0 mm', surcharge: 0, extraMinutes: 0 },
  { key: 'short', label: 'Kısa (Zarif & Pratik)', extensionMm: '2 - 4 mm', surcharge: 0, extraMinutes: 0 },
  { key: 'medium', label: 'Orta (Klasik Şıklık)', extensionMm: '5 - 8 mm', surcharge: 100, extraMinutes: 10 },
  { key: 'long', label: 'Uzun (Belirgin İhtişam)', extensionMm: '9 - 14 mm', surcharge: 250, extraMinutes: 20 },
  { key: 'extra-long', label: 'XL (Maksimum Sahne Boyu)', extensionMm: '15+ mm', surcharge: 450, extraMinutes: 30 },
];

export const NAIL_ART_TIERS: readonly NailArtTierMeta[] = [
  {
    tier: 'tier-0',
    label: 'Düz Renk / Minimal',
    subtitle: 'Tek Ton Kalıcı Oje',
    examples: 'Tüm tırnaklarda homojen tek renk kalıcı oje veya nude baz.',
    extraMinutes: 0,
    surcharge: 0,
    badgeTone: 'emerald',
  },
  {
    tier: 'tier-1',
    label: 'Seviye 1: Minimalist Sanat',
    subtitle: 'French / Baby Boomer / Çizgi',
    examples: 'Klasik Beyaz/Renkli French, Baby Boomer gradyan, ince geometrik çizgiler, nokta sanatı.',
    extraMinutes: 15,
    surcharge: 150,
    badgeTone: 'blue',
  },
  {
    tier: 'tier-2',
    label: 'Seviye 2: Trend & Efekt Tasarım',
    subtitle: 'Krom Tozu / Mermer / Cat-Eye / Ombre',
    examples: 'Glazed Donut ayna krom, manyetik kedi gözü, mermer damar dokusu, 2-3 renkli soyut desen.',
    extraMinutes: 30,
    surcharge: 350,
    badgeTone: 'purple',
  },
  {
    tier: 'tier-3',
    label: 'Seviye 3: 3D Sanat & Mücevher',
    subtitle: 'Kristal Taş / 3D Jel / Kabartma / Piercing',
    examples: 'Swarovski kristal dizimi, 3D jel çiçek ve figürler, tırnak piercingi, el çizimi karakter sanatı.',
    extraMinutes: 45,
    surcharge: 600,
    badgeTone: 'amber',
  },
];

export const FINGER_LABELS: Record<FingerKey, string> = {
  'right-thumb': 'Sağ El - Başparmak',
  'right-index': 'Sağ El - İşaret Parmağı',
  'right-middle': 'Sağ El - Orta Parmak',
  'right-ring': 'Sağ El - Yüzük Parmağı',
  'right-pinky': 'Sağ El - Serçe Parmak',
  'left-thumb': 'Sol El - Başparmak',
  'left-index': 'Sol El - İşaret Parmağı',
  'left-middle': 'Sol El - Orta Parmak',
  'left-ring': 'Sol El - Yüzük Parmağı',
  'left-pinky': 'Sol El - Serçe Parmak',
};
