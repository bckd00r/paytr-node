/**
 * PayTR API Endpoints and Default Values
 */

/** PayTR API base URL */
export const PAYTR_BASE_URL = 'https://www.paytr.com';

/** PayTR API Endpoints */
export const ENDPOINTS = {
  /** Ödeme formu gönderim URL'i */
  PAYMENT_FORM: `${PAYTR_BASE_URL}/odeme`,
  
  /** BIN sorgulama */
  BIN_QUERY: `${PAYTR_BASE_URL}/odeme/api/bin-detail`,
  
  /** İade işlemi */
  REFUND: `${PAYTR_BASE_URL}/odeme/iade`,
  
  /** İşlem dökümü */
  TRANSACTION_LOG: `${PAYTR_BASE_URL}/rapor/islem-dokumu`,
  
  /** Kayıtlı kart listesi */
  CARD_LIST: `${PAYTR_BASE_URL}/odeme/capi/list`,
  
  /** Kart silme */
  CARD_DELETE: `${PAYTR_BASE_URL}/odeme/capi/delete`,
  
  /** Sipariş durumu */
  ORDER_STATUS: `${PAYTR_BASE_URL}/odeme/durum-sorgu`,
  
  /** Taksit oranları */
  INSTALLMENT_RATES: `${PAYTR_BASE_URL}/odeme/taksit-oranlari`,
  
  // Platform Transfer (Marketplace)
  /** Platform transfer */
  PLATFORM_TRANSFER: `${PAYTR_BASE_URL}/odeme/platform/transfer`,
  /** Geri dönen ödemeler listesi */
  RETURNED_PAYMENTS: `${PAYTR_BASE_URL}/odeme/geri-donen-transfer`,
  /** Hesaptan gönder */
  SEND_FROM_ACCOUNT: `${PAYTR_BASE_URL}/odeme/hesaptan-gonder`,
  
  // Payment Reports
  /** Ödeme dökümü */
  PAYMENT_SUMMARY: `${PAYTR_BASE_URL}/rapor/odeme-dokumu`,
  /** Ödeme detayı */
  PAYMENT_DETAIL: `${PAYTR_BASE_URL}/rapor/odeme-detayi`,
} as const;

/** Varsayılan değerler */
export const DEFAULTS = {
  /** Varsayılan dil */
  LANGUAGE: 'tr' as const,
  
  /** Varsayılan para birimi */
  CURRENCY: 'TL' as const,
  
  /** Varsayılan ödeme tipi */
  PAYMENT_TYPE: 'card' as const,
  
  /** Varsayılan taksit sayısı (peşin) */
  INSTALLMENT_COUNT: 0,
  
  /** Debug modu kapalı */
  DEBUG_MODE: false,
  
  /** Test modu kapalı */
  TEST_MODE: false,
  
  /** 3D güvenlik aktif */
  NON_3D: false,
} as const;

/** HTTP Headers */
export const HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
} as const;
