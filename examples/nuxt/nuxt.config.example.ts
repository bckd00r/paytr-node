/**
 * Nuxt Config Örneği - PayTR Entegrasyonu
 * 
 * Bu dosyayı kendi nuxt.config.ts dosyanıza entegre edin.
 */

export default defineNuxtConfig({
  // ... diğer ayarlarınız

  // Runtime config - .env dosyasından okur
  runtimeConfig: {
    // Private keys (sadece server-side)
    paytr: {
      merchantId: process.env.PAYTR_MERCHANT_ID || '',
      merchantKey: process.env.PAYTR_MERCHANT_KEY || '',
      merchantSalt: process.env.PAYTR_MERCHANT_SALT || '',
      testMode: process.env.PAYTR_TEST_MODE || 'false',
      debugMode: process.env.PAYTR_DEBUG_MODE || 'false',
    },
    
    // Public keys (client-side erişilebilir)
    public: {
      paytrTestMode: process.env.PAYTR_TEST_MODE || 'false',
    }
  },
})
