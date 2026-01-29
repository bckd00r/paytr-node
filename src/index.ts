/**
 * PayTR Node.js SDK
 * 
 * PayTR ödeme geçidi için modüler Node.js/TypeScript SDK.
 * React, Nuxt, Next.js ve Vue backend'lerinde kullanılabilir.
 * 
 * @example
 * ```typescript
 * import { PayTR } from 'paytr-node';
 * 
 * const paytr = new PayTR({
 *   merchantId: 'YOUR_MERCHANT_ID',
 *   merchantKey: 'YOUR_MERCHANT_KEY',
 *   merchantSalt: 'YOUR_MERCHANT_SALT'
 * });
 * 
 * // Ödeme formu hazırla
 * const payment = paytr.preparePayment({
 *   merchantOid: 'ORDER-123',
 *   email: 'customer@example.com',
 *   paymentAmount: 100.99,
 *   currency: 'TL',
 *   basketItems: [{ name: 'Ürün', price: 100.99, quantity: 1 }],
 *   user: { name: 'Müşteri Adı', address: 'Adres', phone: '05551234567' },
 *   merchantOkUrl: 'https://site.com/basarili',
 *   merchantFailUrl: 'https://site.com/hata'
 * });
 * ```
 */

import { ENDPOINTS, DEFAULTS } from './constants';
import {
  generateToken,
  apiRequest,
  formatAmount,
  formatBasket,
  formatDate,
  boolToString,
  generateRequestId,
} from './utils';
import type {
  PayTRConfig,
  PaymentOptions,
  SaveCardPaymentOptions,
  StoredCardPaymentOptions,
  RecurringPaymentOptions,
  PreparedPayment,
  PaymentCallback,
  BINQueryResult,
  RefundResult,
  TransactionLogResult,
  CardListResult,
  DeleteCardResult,
  OrderStatusResult,
  InstallmentRatesResult,
} from './types';
import { PayTRError } from './types';

/**
 * PayTR SDK ana sınıfı
 */
export class PayTR {
  private readonly config: Required<PayTRConfig>;

  /**
   * PayTR SDK'yı başlatır
   * @param config - Mağaza yapılandırması
   */
  constructor(config: PayTRConfig) {
    this.config = {
      merchantId: config.merchantId,
      merchantKey: config.merchantKey,
      merchantSalt: config.merchantSalt,
      testMode: config.testMode ?? DEFAULTS.TEST_MODE,
      language: config.language ?? DEFAULTS.LANGUAGE,
      debugMode: config.debugMode ?? DEFAULTS.DEBUG_MODE,
    };
  }

  // ============================================================================
  // PAYMENT FORM PREPARATION
  // ============================================================================

  /**
   * Direkt ödeme için form verilerini hazırlar
   * 
   * @param options - Ödeme parametreleri
   * @returns Form verileri ve token
   * 
   * @example
   * ```typescript
   * const payment = paytr.preparePayment({
   *   merchantOid: 'ORDER-123',
   *   email: 'customer@example.com',
   *   paymentAmount: 100.99,
   *   currency: 'TL',
   *   basketItems: [{ name: 'Ürün', price: 100.99, quantity: 1 }],
   *   user: { name: 'Ad Soyad', address: 'Adres', phone: '05551234567' },
   *   merchantOkUrl: 'https://site.com/basarili',
   *   merchantFailUrl: 'https://site.com/hata'
   * });
   * 
   * // Frontend'de form oluştur ve gönder
   * ```
   */
  preparePayment(options: PaymentOptions): PreparedPayment {
    const userIp = options.userIp ?? '';
    const installmentCount = options.installmentCount ?? DEFAULTS.INSTALLMENT_COUNT;
    const non3d = options.non3d ?? DEFAULTS.NON_3D;
    const paymentType = DEFAULTS.PAYMENT_TYPE;
    const testMode = this.config.testMode;
    const paymentAmount = formatAmount(options.paymentAmount);

    // Token hash string
    const hashStr = [
      this.config.merchantId,
      userIp,
      options.merchantOid,
      options.email,
      paymentAmount,
      paymentType,
      installmentCount.toString(),
      options.currency,
      boolToString(testMode),
      boolToString(non3d),
    ].join('');

    const tokenData = hashStr + this.config.merchantSalt;
    const token = generateToken(this.config.merchantKey, tokenData);

    const formData: Record<string, string> = {
      merchant_id: this.config.merchantId,
      user_ip: userIp,
      merchant_oid: options.merchantOid,
      email: options.email,
      payment_type: paymentType,
      payment_amount: paymentAmount,
      currency: options.currency,
      test_mode: boolToString(testMode),
      non_3d: boolToString(non3d),
      merchant_ok_url: options.merchantOkUrl,
      merchant_fail_url: options.merchantFailUrl,
      user_name: options.user.name,
      user_address: options.user.address,
      user_phone: options.user.phone,
      user_basket: formatBasket(options.basketItems),
      debug_on: boolToString(this.config.debugMode),
      client_lang: this.config.language,
      paytr_token: token,
      installment_count: installmentCount.toString(),
      card_type: options.cardType ?? '',
      non3d_test_failed: boolToString(options.non3dTestFailed ?? false),
    };

    return {
      formAction: ENDPOINTS.PAYMENT_FORM,
      formData,
      token,
    };
  }

  /**
   * Kart saklayarak ödeme için form verilerini hazırlar
   * 
   * @param options - Ödeme parametreleri (storeCard: true olmalı)
   * @returns Form verileri ve token
   */
  prepareSaveCardPayment(options: SaveCardPaymentOptions): PreparedPayment {
    const basePayment = this.preparePayment(options);
    
    // Kart saklama için ek alanlar
    basePayment.formData.store_card = '1';
    if (options.utoken) {
      basePayment.formData.utoken = options.utoken;
    }

    return basePayment;
  }

  /**
   * Kayıtlı kart ile ödeme için form verilerini hazırlar
   * 
   * @param options - Kayıtlı kart ödeme parametreleri
   * @returns Form verileri ve token
   */
  prepareStoredCardPayment(options: StoredCardPaymentOptions): PreparedPayment {
    const basePayment = this.preparePayment({
      ...options,
      cardType: undefined,
    });

    // Kayıtlı kart için ek alanlar
    basePayment.formData.utoken = options.utoken;
    basePayment.formData.ctoken = options.ctoken;
    
    if (options.requireCvv !== undefined) {
      basePayment.formData.require_cvv = boolToString(options.requireCvv);
    }

    return basePayment;
  }

  /**
   * Tekrarlı ödeme için form verilerini hazırlar
   * 
   * @param options - Tekrarlı ödeme parametreleri
   * @returns Form verileri ve token
   */
  prepareRecurringPayment(options: RecurringPaymentOptions): PreparedPayment {
    const basePayment = this.preparePayment(options);

    // Tekrarlı ödeme için ek alanlar
    basePayment.formData.recurring_payment = '1';
    basePayment.formData.utoken = options.utoken;
    basePayment.formData.ctoken = options.ctoken;

    return basePayment;
  }

  // ============================================================================
  // CALLBACK VERIFICATION
  // ============================================================================

  /**
   * PayTR ödeme bildirimini doğrular
   * 
   * @param callback - PayTR'dan gelen callback verisi
   * @returns Doğrulama başarılı mı?
   * 
   * @example
   * ```typescript
   * // Express/Next.js API route
   * app.post('/api/paytr/callback', (req, res) => {
   *   const isValid = paytr.verifyCallback(req.body);
   *   
   *   if (!isValid) {
   *     return res.status(400).send('Invalid hash');
   *   }
   *   
   *   if (req.body.status === 'success') {
   *     // Siparişi onayla
   *   }
   *   
   *   res.send('OK');
   * });
   * ```
   */
  verifyCallback(callback: PaymentCallback): boolean {
    const tokenData = [
      callback.merchant_oid,
      this.config.merchantSalt,
      callback.status,
      callback.total_amount,
    ].join('');

    const expectedHash = generateToken(this.config.merchantKey, tokenData);
    return expectedHash === callback.hash;
  }

  // ============================================================================
  // BIN QUERY
  // ============================================================================

  /**
   * Kart BIN numarasını sorgular
   * 
   * @param binNumber - Kartın ilk 6 veya 8 hanesi
   * @returns BIN sorgu sonucu
   * 
   * @example
   * ```typescript
   * const result = await paytr.queryBIN('979203');
   * if (result.status === 'success') {
   *   console.log('Banka:', result.issuer_name);
   *   console.log('Kart Tipi:', result.card_type);
   * }
   * ```
   */
  async queryBIN(binNumber: string): Promise<BINQueryResult> {
    const tokenData = binNumber + this.config.merchantId + this.config.merchantSalt;
    const token = generateToken(this.config.merchantKey, tokenData);

    return apiRequest<BINQueryResult>(ENDPOINTS.BIN_QUERY, {
      merchant_id: this.config.merchantId,
      bin_number: binNumber,
      paytr_token: token,
    });
  }

  // ============================================================================
  // REFUND
  // ============================================================================

  /**
   * Ödeme iadesi yapar
   * 
   * @param merchantOid - Sipariş numarası
   * @param returnAmount - İade tutarı
   * @param referenceNo - Referans numarası (isteğe bağlı)
   * @returns İade sonucu
   * 
   * @example
   * ```typescript
   * const result = await paytr.refund('ORDER-123', 50.00);
   * if (result.status === 'success') {
   *   console.log('İade başarılı');
   * }
   * ```
   */
  async refund(
    merchantOid: string,
    returnAmount: number,
    referenceNo?: string
  ): Promise<RefundResult> {
    const amountStr = returnAmount.toFixed(2);
    const tokenData = [
      this.config.merchantId,
      merchantOid,
      amountStr,
      this.config.merchantSalt,
    ].join('');
    const token = generateToken(this.config.merchantKey, tokenData);

    const formData: Record<string, string> = {
      merchant_id: this.config.merchantId,
      merchant_oid: merchantOid,
      return_amount: amountStr,
      paytr_token: token,
    };

    if (referenceNo) {
      formData.reference_no = referenceNo;
    }

    return apiRequest<RefundResult>(ENDPOINTS.REFUND, formData);
  }

  // ============================================================================
  // TRANSACTION LOG
  // ============================================================================

  /**
   * İşlem dökümünü getirir (max 3 gün aralık)
   * 
   * @param startDate - Başlangıç tarihi
   * @param endDate - Bitiş tarihi
   * @returns İşlem dökümü
   * 
   * @example
   * ```typescript
   * const start = new Date('2024-01-01');
   * const end = new Date('2024-01-03');
   * const result = await paytr.getTransactions(start, end);
   * ```
   */
  async getTransactions(startDate: Date, endDate: Date): Promise<TransactionLogResult> {
    const startStr = formatDate(startDate);
    const endStr = formatDate(endDate);

    const tokenData = [
      this.config.merchantId,
      startStr,
      endStr,
      this.config.merchantSalt,
    ].join('');
    const token = generateToken(this.config.merchantKey, tokenData);

    return apiRequest<TransactionLogResult>(ENDPOINTS.TRANSACTION_LOG, {
      merchant_id: this.config.merchantId,
      start_date: startStr,
      end_date: endStr,
      paytr_token: token,
    });
  }

  // ============================================================================
  // CARD STORAGE
  // ============================================================================

  /**
   * Kullanıcının kayıtlı kartlarını listeler
   * 
   * @param utoken - Kullanıcı token'ı
   * @returns Kart listesi
   * 
   * @example
   * ```typescript
   * const result = await paytr.listCards('user-token-xxx');
   * if (result.status === 'success' && result.cards) {
   *   result.cards.forEach(card => {
   *     console.log(`${card.bank_name} - ****${card.c_last_four}`);
   *   });
   * }
   * ```
   */
  async listCards(utoken: string): Promise<CardListResult> {
    const tokenData = utoken + this.config.merchantSalt;
    const token = generateToken(this.config.merchantKey, tokenData);

    return apiRequest<CardListResult>(ENDPOINTS.CARD_LIST, {
      merchant_id: this.config.merchantId,
      utoken: utoken,
      paytr_token: token,
    });
  }

  /**
   * Kayıtlı kartı siler
   * 
   * @param utoken - Kullanıcı token'ı
   * @param ctoken - Kart token'ı
   * @returns Silme sonucu
   * 
   * @example
   * ```typescript
   * const result = await paytr.deleteCard('user-token', 'card-token');
   * ```
   */
  async deleteCard(utoken: string, ctoken: string): Promise<DeleteCardResult> {
    const tokenData = ctoken + utoken + this.config.merchantSalt;
    const token = generateToken(this.config.merchantKey, tokenData);

    return apiRequest<DeleteCardResult>(ENDPOINTS.CARD_DELETE, {
      merchant_id: this.config.merchantId,
      ctoken: ctoken,
      utoken: utoken,
      paytr_token: token,
    });
  }

  // ============================================================================
  // ORDER STATUS
  // ============================================================================

  /**
   * Sipariş durumunu sorgular
   * 
   * @param merchantOid - Sipariş numarası
   * @returns Sipariş durumu
   * 
   * @example
   * ```typescript
   * const result = await paytr.getOrderStatus('ORDER-123');
   * console.log('Durum:', result.payment_status);
   * ```
   */
  async getOrderStatus(merchantOid: string): Promise<OrderStatusResult> {
    const tokenData = [
      this.config.merchantId,
      merchantOid,
      this.config.merchantSalt,
    ].join('');
    const token = generateToken(this.config.merchantKey, tokenData);

    return apiRequest<OrderStatusResult>(ENDPOINTS.ORDER_STATUS, {
      merchant_id: this.config.merchantId,
      merchant_oid: merchantOid,
      paytr_token: token,
    });
  }

  // ============================================================================
  // INSTALLMENT RATES
  // ============================================================================

  /**
   * Taksit oranlarını getirir
   * 
   * @returns Taksit oranları
   * 
   * @example
   * ```typescript
   * const result = await paytr.getInstallmentRates();
   * if (result.status === 'success') {
   *   console.log('Taksit oranları:', result.raw);
   * }
   * ```
   */
  async getInstallmentRates(): Promise<InstallmentRatesResult> {
    const requestId = generateRequestId();
    const tokenData = [
      this.config.merchantId,
      requestId,
      this.config.merchantSalt,
    ].join('');
    const token = generateToken(this.config.merchantKey, tokenData);

    const response = await apiRequest<Record<string, unknown>>(ENDPOINTS.INSTALLMENT_RATES, {
      merchant_id: this.config.merchantId,
      request_id: requestId,
      paytr_token: token,
    });

    // API ham veri döndürür, bunu dönüştür
    if ((response as { status?: string }).status === 'success') {
      return {
        status: 'success',
        raw: response,
      };
    }

    return {
      status: 'error',
      err_msg: (response as { err_msg?: string }).err_msg ?? 'Unknown error',
    };
  }
}

// Export types
export * from './types';
export { ENDPOINTS, DEFAULTS } from './constants';
