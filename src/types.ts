/**
 * PayTR Node.js SDK - Type Definitions
 */

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * PayTR merchant configuration
 */
export interface PayTRConfig {
  /** Mağaza numarası (Merchant ID) */
  merchantId: string;
  /** Mağaza API anahtarı (Merchant Key) */
  merchantKey: string;
  /** Mağaza API salt değeri (Merchant Salt) */
  merchantSalt: string;
  /** Test modu aktif mi? (varsayılan: false) */
  testMode?: boolean;
  /** Ödeme sayfası dili (varsayılan: 'tr') */
  language?: 'tr' | 'en';
  /** Debug modu aktif mi? (varsayılan: false) */
  debugMode?: boolean;
}

// ============================================================================
// Payment Types
// ============================================================================

/**
 * Sepet ürünü
 */
export interface BasketItem {
  /** Ürün adı */
  name: string;
  /** Birim fiyat (TL/USD/EUR) */
  price: number | string;
  /** Adet */
  quantity: number;
}

/**
 * Müşteri bilgileri
 */
export interface UserInfo {
  /** Ad Soyad */
  name: string;
  /** Adres */
  address: string;
  /** Telefon numarası */
  phone: string;
}

/**
 * Kart markası
 */
export type CardType = 
  | 'advantage' 
  | 'axess' 
  | 'combo' 
  | 'bonus' 
  | 'cardfinans' 
  | 'maximum' 
  | 'paraf' 
  | 'world'
  | '';

/**
 * Para birimi
 */
export type Currency = 'TL' | 'USD' | 'EUR';

/**
 * Direkt ödeme parametreleri
 */
export interface PaymentOptions {
  /** Benzersiz sipariş numarası */
  merchantOid: string;
  /** Müşteri e-posta adresi */
  email: string;
  /** Ödeme tutarı (örn: 100.99) */
  paymentAmount: number;
  /** Para birimi */
  currency: Currency;
  /** Sepet içeriği */
  basketItems: BasketItem[];
  /** Müşteri bilgileri */
  user: UserInfo;
  /** Başarılı ödeme yönlendirme URL'i */
  merchantOkUrl: string;
  /** Başarısız ödeme yönlendirme URL'i */
  merchantFailUrl: string;
  /** Müşteri IP adresi (isteğe bağlı) */
  userIp?: string;
  /** Taksit sayısı (0 = peşin, varsayılan: 0) */
  installmentCount?: number;
  /** 3D'siz işlem (varsayılan: false) */
  non3d?: boolean;
  /** Kart markası (isteğe bağlı) */
  cardType?: CardType;
  /** Non-3D test başarısız senaryosu (sadece test modu) */
  non3dTestFailed?: boolean;
}

/**
 * Kart saklayarak ödeme parametreleri
 */
export interface SaveCardPaymentOptions extends PaymentOptions {
  /** Kartı sakla */
  storeCard: true;
  /** Mevcut kullanıcı token'ı (varsa) */
  utoken?: string;
}

/**
 * Kayıtlı kart ile ödeme parametreleri
 */
export interface StoredCardPaymentOptions extends Omit<PaymentOptions, 'cardType'> {
  /** Kullanıcı token'ı */
  utoken: string;
  /** Kart token'ı */
  ctoken: string;
  /** CVV gerekli mi? (CAPI listeden dönen değer) */
  requireCvv?: boolean;
}

/**
 * Tekrarlı ödeme parametreleri
 */
export interface RecurringPaymentOptions extends PaymentOptions {
  /** Kullanıcı token'ı */
  utoken: string;
  /** Kart token'ı */
  ctoken: string;
}

/**
 * Hazırlanmış ödeme formu verileri
 */
export interface PreparedPayment {
  /** Form action URL'i */
  formAction: string;
  /** Form verileri (hidden input'lar için) */
  formData: Record<string, string>;
  /** PayTR token */
  token: string;
}

// ============================================================================
// Callback Types
// ============================================================================

/**
 * PayTR ödeme bildirimi (callback)
 */
export interface PaymentCallback {
  /** Sipariş numarası */
  merchant_oid: string;
  /** İşlem durumu */
  status: 'success' | 'failed';
  /** Toplam tutar (kuruş cinsinden) */
  total_amount: string;
  /** Doğrulama hash'i */
  hash: string;
  /** Başarısızlık kodu */
  failed_reason_code?: string;
  /** Başarısızlık mesajı */
  failed_reason_msg?: string;
  /** Test işlemi mi? */
  test_mode?: string;
  /** Ödeme tipi */
  payment_type?: string;
  /** Para birimi */
  currency?: string;
  /** Ödeme tutarı */
  payment_amount?: string;
  /** Kullanıcı token'ı (kart saklama işlemlerinde) */
  utoken?: string;
}

// ============================================================================
// BIN Query Types
// ============================================================================

/**
 * BIN sorgu sonucu
 */
export interface BINQueryResult {
  /** İşlem durumu */
  status: 'success' | 'error';
  /** Kart ailesi (Bonus, Maximum, vb.) */
  card_family?: string;
  /** Kart tipi (credit, debit) */
  card_type?: string;
  /** Bankası */
  issuer_name?: string;
  /** BIN numarası */
  bin?: string;
  /** Ülke */
  country?: string;
  /** Hata mesajı */
  err_msg?: string;
}

// ============================================================================
// Refund Types
// ============================================================================

/**
 * İade sonucu
 */
export interface RefundResult {
  /** İşlem durumu */
  status: 'success' | 'error';
  /** Test işlemi mi? */
  is_test?: number;
  /** Sipariş numarası */
  merchant_oid?: string;
  /** İade tutarı */
  return_amount?: string;
  /** Hata numarası */
  err_no?: string;
  /** Hata mesajı */
  err_msg?: string;
}

// ============================================================================
// Transaction Log Types
// ============================================================================

/**
 * İşlem kaydı
 */
export interface Transaction {
  /** Sipariş numarası */
  merchant_oid: string;
  /** İşlem durumu */
  status: string;
  /** Tutar */
  amount: string;
  /** Para birimi */
  currency: string;
  /** İşlem tarihi */
  date: string;
  /** İşlem tipi */
  type: string;
}

/**
 * İşlem dökümü sonucu
 */
export interface TransactionLogResult {
  /** İşlem durumu */
  status: 'success' | 'error';
  /** İşlemler listesi */
  transactions?: Transaction[];
  /** Hata mesajı */
  err_msg?: string;
}

// ============================================================================
// Card Storage Types
// ============================================================================

/**
 * Kayıtlı kart bilgisi
 */
export interface StoredCard {
  /** Kart token'ı */
  ctoken: string;
  /** Son 4 hane */
  c_last_four: string;
  /** İlk 6 hane (BIN) */
  c_first_six: string;
  /** Kart ailesi */
  card_family: string;
  /** Banka adı */
  bank_name: string;
  /** CVV gerekli mi? */
  require_cvv: '0' | '1';
}

/**
 * Kart listesi sonucu
 */
export interface CardListResult {
  /** İşlem durumu */
  status: 'success' | 'error';
  /** Kartlar listesi */
  cards?: StoredCard[];
  /** Hata mesajı */
  err_msg?: string;
}

/**
 * Kart silme sonucu
 */
export interface DeleteCardResult {
  /** İşlem durumu */
  status: 'success' | 'error';
  /** Hata mesajı */
  err_msg?: string;
}

// ============================================================================
// Order Status Types
// ============================================================================

/**
 * Sipariş durumu sonucu
 */
export interface OrderStatusResult {
  /** İşlem durumu */
  status: 'success' | 'error';
  /** Sipariş numarası */
  merchant_oid?: string;
  /** Ödeme durumu */
  payment_status?: 'waiting' | 'success' | 'failed';
  /** Ödeme tutarı */
  payment_amount?: string;
  /** Para birimi */
  currency?: string;
  /** Ödeme tipi */
  payment_type?: string;
  /** Test işlemi mi? */
  test_mode?: string;
  /** Hata mesajı */
  err_msg?: string;
}

// ============================================================================
// Installment Types
// ============================================================================

/**
 * Taksit oranı
 */
export interface InstallmentRate {
  /** Taksit sayısı */
  installment_count: number;
  /** Komisyon oranı (%) */
  commission_rate: number;
}

/**
 * Banka taksit bilgisi
 */
export interface BankInstallment {
  /** Banka/Kart ailesi adı */
  bank_name: string;
  /** Taksit oranları */
  rates: InstallmentRate[];
}

/**
 * Taksit oranları sonucu
 */
export interface InstallmentRatesResult {
  /** İşlem durumu */
  status: 'success' | 'error';
  /** Banka bazlı taksit oranları */
  installments?: BankInstallment[];
  /** Ham API yanıtı */
  raw?: Record<string, unknown>;
  /** Hata mesajı */
  err_msg?: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * PayTR API hatası
 */
export class PayTRError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PayTRError';
  }
}
