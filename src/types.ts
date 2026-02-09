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
 * Direct API kart bilgileri
 * 
 * @description Server-side ödeme için kart bilgileri.
 * ⚠️ DİKKAT: PCI-DSS uyumluluğu gerektirir!
 */
export interface CardInfo {
  /** Kart sahibinin adı soyadı */
  ccOwner: string;
  /** Kart numarası (13-19 hane) */
  cardNumber: string;
  /** Son kullanma ay (01-12) */
  expiryMonth: string;
  /** Son kullanma yıl (2 hane, örn: 25) */
  expiryYear: string;
  /** CVV/CVC güvenlik kodu (3-4 hane) */
  cvv: string;
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
  /**
   * Sync mode (senkron yanıt modu)
   * 
   * @description true olarak ayarlandığında, PayTR HTTP redirect yerine
   * JSON yanıt döndürür. Bu mod Non-3D yetkisi gerektirir.
   * 
   * Yanıt status değerleri:
   * - "success": Ödeme başarılı
   * - "failed": Ödeme başarısız
   * - "wait_callback": İşlem kontrol ediliyor, Callback beklenmeli
   * 
   * @default false
   */
  syncMode?: boolean;
  /** 
   * Direct API kart bilgileri (isteğe bağlı)
   * 
   * @description Server-side ödeme için kart bilgilerini doğrudan gönderir.
   * Eğer verilmezse, form frontend'de doldurulmalıdır.
   * ⚠️ DİKKAT: PCI-DSS uyumluluğu gerektirir!
   */
  cardInfo?: CardInfo;
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

/**
 * Direct API ödeme sonucu
 * 
 * @description Server-side ödeme işlemi sonucu.
 * 3D Secure gerektiren işlemlerde redirectUrl döner.
 */
export interface DirectPaymentResult {
  /** İşlem durumu */
  status: 'success' | 'error' | 'redirect' | 'wait_callback';
  /** 3D Secure yönlendirme URL'i (3D gerektiren işlemlerde) */
  redirectUrl?: string;
  /** 3D Secure HTML içeriği (bazı durumlarda) */
  redirectHtml?: string;
  /** Doğrudan ödeme başarılı mı? (non-3D işlemlerde) */
  paymentCompleted?: boolean;
  /** Hata mesajı */
  errMsg?: string;
  /** Ham API yanıtı */
  rawResponse?: string;
}

/**
 * Sync mode yanıt tipi
 * 
 * @description sync_mode=1 gönderildiğinde PayTR JSON yanıt döndürür.
 * Bu mod Non-3D yetkisi gerektirir.
 */
export interface SyncModeResponse {
  /** 
   * İşlem durumu
   * - "success": Ödeme başarılı
   * - "failed": Ödeme başarısız
   * - "wait_callback": İşlem kontrol ediliyor, Callback beklenmeli
   */
  status: 'success' | 'failed' | 'wait_callback';
  /** Hata mesajı (başarısız durumda) */
  err_msg?: string;
  /** Hata kodu */
  err_no?: string;
  /** Sipariş numarası */
  merchant_oid?: string;
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

// ============================================================================
// Error Codes Reference
// ============================================================================

/**
 * Ödeme Callback Hata Kodları (failed_reason_code)
 * 
 * PayTR'dan bildirim URL'ine dönen hata kodları
 */
export const CALLBACK_ERROR_CODES = {
  /** Değişken - Açıklamayı okuyun (örn: Kart limiti/bakiyesi yetersiz) */
  '0': 'Değişken hata - Açıklamayı okuyun',
  /** Kimlik doğrulama yapılmadı */
  '1': 'Kimlik Doğrulama yapılmadı. Lütfen tekrar deneyin ve işlemi tamamlayın.',
  /** Kimlik doğrulama başarısız */
  '2': 'Kimlik Doğrulama başarısız. Lütfen tekrar deneyin ve şifreyi doğru girin.',
  /** Güvenlik kontrolü onay verilmedi */
  '3': 'Güvenlik kontrolü sonrası onay verilmedi veya kontrol yapılamadı.',
  /** Müşteri ödeme sayfasından ayrıldı */
  '6': 'Müşteri ödeme yapmaktan vazgeçti ve ödeme sayfasından ayrıldı.',
  /** Taksit yapılamaz */
  '8': 'Bu karta taksit yapılamamaktadır.',
  /** İşlem yetkisi yok */
  '9': 'Bu kart ile işlem yetkisi bulunmamaktadır.',
  /** 3D Secure zorunlu */
  '10': 'Bu işlemde 3D Secure kullanılmalıdır.',
  /** Fraud uyarısı */
  '11': 'Güvenlik uyarısı. İşlem yapan müşterinizi kontrol edin.',
  /** Teknik entegrasyon hatası */
  '99': 'İşlem başarısız: Teknik entegrasyon hatası.',
} as const;

/**
 * Transfer API Hata Kodları
 * 
 * Pazaryeri transfer işlemlerinde dönen hata kodları
 */
export const TRANSFER_ERROR_CODES = {
  '001': 'Geçersiz istek veya mağaza aktif değil',
  '002': 'Bu servis için yetkiniz yok (pazaryeri değil)',
  '003': 'Geçersiz trans_id',
  '004': 'paytr_token gönderilmedi veya geçersiz',
  '005': 'Geçersiz merchant_oid',
  '006': 'merchant_oid ile başarılı ödeme bulunamadı',
  '007': 'merchant_oid bulundu ancak ödeme henüz siteye bildirilmemiş',
  '008': 'Valör tarihi geçmeden transfer yapılamaz',
  '009': 'trans_id benzersiz olmalıdır, bu trans_id daha önce kullanılmış',
  '010': 'Toplam transfer tutarı kalan tutardan fazla olamaz',
  '012': 'Platform komisyonu sıfırdan az olamaz',
  '091': 'transfer_iban değeri IBAN doğrulamasından geçemedi',
  '092': 'transfer_iban TR ile başlamalı, boşluk veya - içermemeli ve 26 hane olmalı',
  '095': 'submerchant_amount sıfırdan küçük olamaz',
  '096': 'trans_id alfanumerik olmalıdır, özel karakter içeremez',
  '097': 'transfer_iban zorunludur',
  '098': 'transfer_name zorunludur',
  '099': 'total_amount sıfırdan büyük ve sayısal olmalıdır',
  '100': 'transfer_name içerisinde ad ve soyad arasında boşluk olmalıdır',
  '101': 'transfer_name içerisinde ad ve soyad en az 2 karakter olmalıdır',
  '201': 'paytr_token gönderilmedi veya geçersiz',
  '202': 'trans_id alfanumerik olmalıdır, özel karakter içeremez',
  '203': 'trans_id benzersiz olmalıdır, bu trans_id daha önce kullanılmış',
  '204': 'trans_info izin verilenden uzun, daha az kayıt ile tekrar deneyin',
  '205': 'trans_info en az 2 işlem en fazla 2000 işlem içermelidir',
  '206': 'trans_info geçerli bir JSON string değil',
  '301': 'paytr_token gönderilmedi veya geçersiz',
  '302': 'trans_id alfanumerik olmalıdır, özel karakter içeremez',
  '303': 'trans_id benzersiz olmalıdır, bu trans_id daha önce kullanılmış',
  '305': 'merchant_oids en az X işlem, en fazla Y işlem içermelidir',
  '306': 'merchant_oids geçerli bir JSON string değil',
  'BLK': 'İşlemde bloke mevcut, detaylı bilgi için PayTR ile iletişime geçin',
} as const;

/**
 * İade API Hata Kodları
 */
export const REFUND_ERROR_CODES = {
  '000': 'İade yapılamıyor, daha sonra tekrar deneyin (servis kilitlenmesi)',
  '001': 'Geçersiz istek veya mağaza aktif değil',
  '002': 'Geçersiz merchant_oid',
  '003': 'Geçersiz return_amount',
  '004': 'paytr_token gönderilmedi veya geçersiz',
  '005': 'merchant_oid ile başarılı ödeme bulunamadı',
  '007': 'merchant_oid bulundu ancak ödeme henüz siteye bildirilmemiş',
  '008': 'Bu ödeme tipi ile iade işlemi yapılmamaktadır',
  '009': 'Toplam iade tutarı ödeme tutarından fazla olamaz',
  '010': 'Net bakiyeniz yetersiz',
  '011': 'Bir yıldan eski işlemler için iade işlemi yapılamaz',
} as const;

/**
 * Durum Sorgu API Hata Kodları
 */
export const ORDER_STATUS_ERROR_CODES = {
  '001': 'Geçersiz istek veya mağaza aktif değil',
  '002': 'Geçersiz merchant_oid',
  '003': 'paytr_token gönderilmedi veya geçersiz',
  '004': 'merchant_oid ile işlem bulunamadı',
} as const;

/**
 * Tüm hata kodu tipleri
 */
export type CallbackErrorCode = keyof typeof CALLBACK_ERROR_CODES;
export type TransferErrorCode = keyof typeof TRANSFER_ERROR_CODES;
export type RefundErrorCode = keyof typeof REFUND_ERROR_CODES;
export type OrderStatusErrorCode = keyof typeof ORDER_STATUS_ERROR_CODES;

/**
 * Hata kodu açıklamasını al
 */
export function getErrorDescription(
  errorCode: string,
  errorType: 'callback' | 'transfer' | 'refund' | 'order_status' = 'callback'
): string {
  const errorMaps = {
    callback: CALLBACK_ERROR_CODES,
    transfer: TRANSFER_ERROR_CODES,
    refund: REFUND_ERROR_CODES,
    order_status: ORDER_STATUS_ERROR_CODES,
  };
  
  const map = errorMaps[errorType];
  return (map as Record<string, string>)[errorCode] ?? `Bilinmeyen hata kodu: ${errorCode}`;
}

// ============================================================================
// Platform Transfer Types (Marketplace)
// ============================================================================

/**
 * Platform transfer parametreleri
 * 
 * @description Marketplace modelinde alt mağazalara ödeme transferi
 */
export interface PlatformTransferParams {
  /** Sipariş numarası */
  merchantOid: string;
  /** İşlem ID */
  transId: string;
  /** Alt mağaza tutarı (kuruş cinsinden) */
  submerchantAmount: number;
  /** Toplam tutar (kuruş cinsinden) */
  totalAmount: number;
  /** Transfer alıcı adı */
  transferName: string;
  /** Transfer IBAN */
  transferIban: string;
}

/**
 * Platform transfer sonucu
 */
export interface PlatformTransferResult {
  status: 'success' | 'failed';
  err_msg?: string;
  err_no?: string;
}

/**
 * Geri dönen ödeme transfer bilgisi
 */
export interface ReturnedPaymentTransfer {
  /** Transfer ID */
  trans_id: string;
  /** Alt mağaza tutarı */
  submerchant_amount: number;
  /** Transfer adı */
  transfer_name: string;
  /** Transfer IBAN */
  transfer_iban: string;
}

/**
 * Geri dönen ödemeler listesi sonucu
 */
export interface ReturnedPaymentsResult {
  status: 'success' | 'failed';
  err_msg?: string;
  /** Geri dönen ödemeler listesi */
  data?: Array<{
    trans_id: string;
    merchant_oid: string;
    amount: number;
    return_date: string;
    return_reason: string;
  }>;
}

/**
 * Platform transfer callback parametreleri
 */
export interface PlatformTransferCallback {
  /** Transfer modü */
  mode?: 'cashout' | 'transfer';
  /** Transfer ID */
  trans_id?: string;
  /** İşlem sonucu */
  processed_result?: string;
  /** Transfer ID listesi */
  trans_ids?: string[];
  /** Doğrulama hash'i */
  hash: string;
}

// ============================================================================
// Payment Report Types
// ============================================================================

/**
 * Ödeme rapor özeti sonucu
 */
export interface PaymentSummaryResult {
  status: 'success' | 'failed';
  err_msg?: string;
  /** Toplam ödeme adedi */
  total_count?: number;
  /** Toplam başarılı ödeme adedi */
  success_count?: number;
  /** Toplam başarısız ödeme adedi */
  failed_count?: number;
  /** Toplam tutar (kuruş) */
  total_amount?: number;
  /** Ham veri */
  data?: unknown;
}

/**
 * Ödeme detayı sonucu
 */
export interface PaymentDetailResult {
  status: 'success' | 'failed';
  err_msg?: string;
  /** Ödeme detayları listesi */
  data?: Array<{
    merchant_oid: string;
    payment_amount: number;
    payment_status: string;
    payment_date: string;
    payment_type: string;
    installment_count: number;
    currency: string;
  }>;
}

