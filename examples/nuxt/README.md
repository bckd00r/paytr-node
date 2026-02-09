# PayTR Nuxt Entegrasyon Örneği

Bu klasör, PayTR Node.js SDK'nin Nuxt 4 + Nuxt UI ile nasıl kullanılacağını gösterir.

## Kurulum

```bash
# paytr.js paketini yükle
npm install paytr.js

# Gerekli bağımlılıklar
npm install zod
```

## Dosya Yapısı

```
nuxt-project/
├── .env                          # PayTR credentials (kopyala: .env.example)
├── nuxt.config.ts                # Runtime config ekle (bakınız: nuxt.config.example.ts)
├── components/
│   └── PaymentForm.vue           # Ödeme formu component'i
├── pages/
│   └── checkout.vue              # Ödeme sayfası örneği
└── server/
    └── api/
        └── paytr/
            ├── payment.post.ts   # Ödeme işleme API
            └── callback.post.ts  # PayTR callback handler
```

## Yapılandırma

### 1. .env Dosyası

```env
PAYTR_MERCHANT_ID=123456
PAYTR_MERCHANT_KEY=your_merchant_key
PAYTR_MERCHANT_SALT=your_merchant_salt
PAYTR_TEST_MODE=true
```

### 2. nuxt.config.ts

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    paytr: {
      merchantId: process.env.PAYTR_MERCHANT_ID,
      merchantKey: process.env.PAYTR_MERCHANT_KEY,
      merchantSalt: process.env.PAYTR_MERCHANT_SALT,
      testMode: process.env.PAYTR_TEST_MODE,
    },
  },
})
```

## Kullanım

### Frontend

```vue
<PaymentForm
  :amount="299.99"
  currency="TL"
  :basket-items="[{ name: 'Ürün', price: 299.99, quantity: 1 }]"
  merchant-ok-url="https://site.com/success"
  merchant-fail-url="https://site.com/failed"
  @success="handleSuccess"
  @error="handleError"
  @redirect="handle3DSecure"
/>
```

### Callback URL

PayTR panelinden callback URL'inizi ayarlayın:
```
https://yoursite.com/api/paytr/callback
```

## ⚠️ Önemli Notlar

1. **PCI-DSS**: Kart bilgilerini server'da işlemek PCI-DSS uyumluluğu gerektirir
2. **Test Kartları**: Test modunda şu kartları kullanabilirsiniz:
   - Başarılı: `9792030394440796` CVV: `000`
   - Başarısız: Test başarısız kartı için PayTR dökümanına bakın
3. **3D Secure**: Çoğu işlem 3D Secure (redirect) gerektirir
