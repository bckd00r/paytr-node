# PayTR Node.js SDK

PayTR ödeme geçidi için modüler Node.js/TypeScript SDK.

## Kurulum

```bash
npm install paytr.js
# veya
yarn add paytr.js
# veya
pnpm add paytr.js
```

## ⚙️ Yapılandırma

```typescript
import { PayTR } from 'paytr.js';

const paytr = new PayTR({
  merchantId: 'MAGAZA_NO',
  merchantKey: 'API_KEY',
  merchantSalt: 'API_SALT',
  testMode: false, // Test modu (isteğe bağlı)
  language: 'tr',  // Dil: 'tr' veya 'en' (isteğe bağlı)
  debugMode: false // Debug modu (isteğe bağlı)
});
```

## 📖 Kullanım

### Direkt Ödeme (3D Secure)

```typescript
// Ödeme formu verilerini hazırla
const payment = paytr.preparePayment({
  merchantOid: `ORDER-${Date.now()}`,
  email: 'musteri@example.com',
  paymentAmount: 100.99,
  currency: 'TL',
  basketItems: [
    { name: 'Ürün 1', price: 50.00, quantity: 1 },
    { name: 'Ürün 2', price: 25.50, quantity: 2 }
  ],
  user: {
    name: 'Müşteri Adı',
    address: 'Müşteri Adresi',
    phone: '05551234567'
  },
  merchantOkUrl: 'https://site.com/odeme/basarili',
  merchantFailUrl: 'https://site.com/odeme/hata',
  userIp: '192.168.1.1', // İsteğe bağlı
  installmentCount: 0,    // Taksit sayısı (0 = peşin)
  non3d: false           // 3D'siz işlem
});

// payment.formAction -> Form action URL'i
// payment.formData   -> Hidden input verileri
// payment.token      -> PayTR token
```

### Direct API (Server-Side Ödeme)

⚠️ **DİKKAT:** Bu yöntem PCI-DSS uyumluluğu gerektirir!

```typescript
// Kart bilgileri ile server-side ödeme
const result = await paytr.processDirectPayment({
  merchantOid: `ORDER-${Date.now()}`,
  email: 'musteri@example.com',
  paymentAmount: 100.99,
  currency: 'TL',
  basketItems: [{ name: 'Ürün', price: 100.99, quantity: 1 }],
  user: { 
    name: 'Müşteri Adı', 
    address: 'Müşteri Adresi', 
    phone: '05551234567' 
  },
  merchantOkUrl: 'https://site.com/odeme/basarili',
  merchantFailUrl: 'https://site.com/odeme/hata',
  cardInfo: {
    ccOwner: 'KART SAHİBİ ADI',
    cardNumber: '9792030394440796',
    expiryMonth: '12',
    expiryYear: '25',
    cvv: '000'
  }
});

if (result.status === 'redirect') {
  // 3D Secure yönlendirmesi - HTML'i kullanıcıya göster
  return new Response(result.redirectHtml, { 
    headers: { 'Content-Type': 'text/html' } 
  });
} else if (result.status === 'success') {
  // Ödeme başarılı (non-3D)
  console.log('Ödeme tamamlandı!');
} else {
  // Hata
  console.error('Hata:', result.errMsg);
}
```


### Ödeme Callback Doğrulama

```typescript
// Express.js / Next.js API Route
app.post('/api/paytr/callback', (req, res) => {
  const isValid = paytr.verifyCallback(req.body);
  
  if (!isValid) {
    return res.status(400).send('Invalid hash');
  }
  
  const { merchant_oid, status, total_amount, utoken } = req.body;
  
  if (status === 'success') {
    // Siparişi onayla ve veritabanını güncelle
    // utoken varsa kullanıcının kart token'ını kaydet
  } else {
    // Siparişi iptal et
  }
  
  res.send('OK'); // PayTR'a bildirimi aldığımızı bildir
});
```

### BIN Sorgulama

```typescript
const result = await paytr.queryBIN('979203');

if (result.status === 'success') {
  console.log('Banka:', result.issuer_name);
  console.log('Kart Tipi:', result.card_type);
  console.log('Kart Ailesi:', result.card_family);
}
```

### İade İşlemi

```typescript
const result = await paytr.refund('ORDER-123', 50.00, 'REF-001');

if (result.status === 'success') {
  console.log('İade başarılı');
} else {
  console.error('Hata:', result.err_msg);
}
```

### İşlem Dökümü

```typescript
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-01-03'); // Max 3 gün aralık

const result = await paytr.getTransactions(startDate, endDate);

if (result.status === 'success' && result.transactions) {
  result.transactions.forEach(tx => {
    console.log(`${tx.merchant_oid}: ${tx.status} - ${tx.amount} ${tx.currency}`);
  });
}
```

### Kayıtlı Kartlar

```typescript
// Kart listesi
const cards = await paytr.listCards('user-token-xxx');

if (cards.status === 'success' && cards.cards) {
  cards.cards.forEach(card => {
    console.log(`${card.bank_name} - ****${card.c_last_four}`);
    console.log('CVV Gerekli:', card.require_cvv === '1');
  });
}

// Kart silme
const deleteResult = await paytr.deleteCard('user-token-xxx', 'card-token-xxx');
```

### Kayıtlı Kart ile Ödeme

```typescript
const payment = paytr.prepareStoredCardPayment({
  merchantOid: `ORDER-${Date.now()}`,
  email: 'musteri@example.com',
  paymentAmount: 100.99,
  currency: 'TL',
  basketItems: [{ name: 'Ürün', price: 100.99, quantity: 1 }],
  user: { name: 'Ad Soyad', address: 'Adres', phone: '05551234567' },
  merchantOkUrl: 'https://site.com/basarili',
  merchantFailUrl: 'https://site.com/hata',
  utoken: 'user-token-xxx',
  ctoken: 'card-token-xxx',
  requireCvv: true // Eğer kart CVV gerektiriyorsa
});
```

### Kart Saklayarak Ödeme

```typescript
const payment = paytr.prepareSaveCardPayment({
  merchantOid: `ORDER-${Date.now()}`,
  email: 'musteri@example.com',
  paymentAmount: 100.99,
  currency: 'TL',
  basketItems: [{ name: 'Ürün', price: 100.99, quantity: 1 }],
  user: { name: 'Ad Soyad', address: 'Adres', phone: '05551234567' },
  merchantOkUrl: 'https://site.com/basarili',
  merchantFailUrl: 'https://site.com/hata',
  storeCard: true,
  utoken: 'existing-user-token' // Mevcut kullanıcı varsa
});
```

### Tekrarlı Ödeme (Recurring)

```typescript
const payment = paytr.prepareRecurringPayment({
  merchantOid: `RECURRING-${Date.now()}`,
  email: 'musteri@example.com',
  paymentAmount: 49.99,
  currency: 'TL',
  basketItems: [{ name: 'Aylık Abonelik', price: 49.99, quantity: 1 }],
  user: { name: 'Ad Soyad', address: 'Adres', phone: '05551234567' },
  merchantOkUrl: 'https://site.com/basarili',
  merchantFailUrl: 'https://site.com/hata',
  utoken: 'user-token-xxx',
  ctoken: 'card-token-xxx'
});
```

### Sipariş Durumu Sorgulama

```typescript
const result = await paytr.getOrderStatus('ORDER-123');

if (result.status === 'success') {
  console.log('Ödeme Durumu:', result.payment_status);
  // 'waiting' | 'success' | 'failed'
}
```

### Taksit Oranları

```typescript
const result = await paytr.getInstallmentRates();

if (result.status === 'success') {
  console.log('Taksit Oranları:', result.raw);
}
```

### Platform Transfer (Marketplace)

#### Transfer İşlemi

```typescript
// Alt mağazaya ödeme transferi
const result = await paytr.platformTransfer({
  merchantOid: 'ORDER-123',
  transId: 'TRANS-456',
  submerchantAmount: 8000,  // 80.00 TL (kuruş cinsinden)
  totalAmount: 10000,       // 100.00 TL (kuruş cinsinden)
  transferName: 'Alt Mağaza Adı',
  transferIban: 'TR123456789012345678901234'
});

if (result.status === 'success') {
  console.log('Transfer başarılı');
} else {
  console.error('Hata:', result.err_msg);
}
```

#### Geri Dönen Ödemeler Listesi

```typescript
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-01-31');

const result = await paytr.getReturnedPayments(startDate, endDate);

if (result.status === 'success' && result.data) {
  result.data.forEach(payment => {
    console.log(`${payment.merchant_oid}: ${payment.amount} - ${payment.return_reason}`);
  });
}
```

#### Geri Dönen Ödemeyi Transfer Et

```typescript
const result = await paytr.sendReturnedPayment('TRANS-123', [
  {
    trans_id: 'SUB-1',
    submerchant_amount: 5000,
    transfer_name: 'Alt Mağaza 1',
    transfer_iban: 'TR123456789012345678901234'
  },
  {
    trans_id: 'SUB-2',
    submerchant_amount: 3000,
    transfer_name: 'Alt Mağaza 2',
    transfer_iban: 'TR987654321098765432109876'
  }
]);
```

#### Platform Transfer Callback Doğrulama

```typescript
// Express.js / Next.js API Route
app.post('/api/platform-callback', (req, res) => {
  const isValid = paytr.verifyPlatformTransferCallback(req.body);
  
  if (!isValid) {
    return res.status(400).send('Invalid hash');
  }
  
  // Transfer işlemini onayla
  res.send('OK');
});
```

### Ödeme Raporları

#### Ödeme Özeti

```typescript
const startDate = new Date('2024-01-01');
const endDate = new Date('2024-01-31');

const result = await paytr.getPaymentSummary(startDate, endDate);

if (result.status === 'success') {
  console.log('Toplam Ödeme:', result.total_count);
  console.log('Başarılı:', result.success_count);
  console.log('Başarısız:', result.failed_count);
  console.log('Toplam Tutar:', result.total_amount);
}
```

#### Günlük Ödeme Detayı

```typescript
const date = new Date('2024-01-15');

const result = await paytr.getPaymentDetail(date);

if (result.status === 'success' && result.data) {
  result.data.forEach(payment => {
    console.log(`${payment.merchant_oid}: ${payment.payment_amount} ${payment.currency}`);
    console.log(`Durum: ${payment.payment_status}`);
    console.log(`Taksit: ${payment.installment_count}`);
  });
}
```

## 🔧 Next.js / Nuxt Entegrasyonu

### Next.js API Route

```typescript
// app/api/payment/route.ts
import { PayTR } from 'paytr.js';

const paytr = new PayTR({
  merchantId: process.env.PAYTR_MERCHANT_ID!,
  merchantKey: process.env.PAYTR_MERCHANT_KEY!,
  merchantSalt: process.env.PAYTR_MERCHANT_SALT!
});

export async function POST(request: Request) {
  const body = await request.json();
  
  const payment = paytr.preparePayment({
    merchantOid: `ORDER-${Date.now()}`,
    email: body.email,
    paymentAmount: body.amount,
    currency: 'TL',
    basketItems: body.items,
    user: body.user,
    merchantOkUrl: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
    merchantFailUrl: `${process.env.NEXT_PUBLIC_URL}/payment/failed`,
    userIp: request.headers.get('x-forwarded-for') || ''
  });

  return Response.json(payment);
}
```

### Nuxt Server Route

```typescript
// server/api/payment.post.ts
import { PayTR } from 'paytr.js';

const paytr = new PayTR({
  merchantId: process.env.PAYTR_MERCHANT_ID!,
  merchantKey: process.env.PAYTR_MERCHANT_KEY!,
  merchantSalt: process.env.PAYTR_MERCHANT_SALT!
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  const payment = paytr.preparePayment({
    merchantOid: `ORDER-${Date.now()}`,
    email: body.email,
    paymentAmount: body.amount,
    currency: 'TL',
    basketItems: body.items,
    user: body.user,
    merchantOkUrl: `${process.env.NUXT_PUBLIC_URL}/odeme/basarili`,
    merchantFailUrl: `${process.env.NUXT_PUBLIC_URL}/odeme/hata`,
    userIp: getHeader(event, 'x-forwarded-for') || ''
  });

  return payment;
});
```

## 📋 API Referansı

| Metod | Açıklama |
|-------|----------|
| `preparePayment(options)` | Direkt ödeme formu hazırlar |
| `prepareSaveCardPayment(options)` | Kart saklayarak ödeme formu hazırlar |
| `prepareStoredCardPayment(options)` | Kayıtlı kart ile ödeme formu hazırlar |
| `prepareRecurringPayment(options)` | Tekrarlı ödeme formu hazırlar |
| `processDirectPayment(options)` | Server-side direkt ödeme işlemi yapar |
| `verifyCallback(callback)` | Ödeme bildirimini doğrular |
| `queryBIN(binNumber)` | BIN sorgulama yapar |
| `refund(merchantOid, amount, referenceNo?)` | İade işlemi yapar |
| `getTransactions(startDate, endDate)` | İşlem dökümü getirir |
| `listCards(utoken)` | Kayıtlı kartları listeler |
| `deleteCard(utoken, ctoken)` | Kayıtlı kartı siler |
| `getOrderStatus(merchantOid)` | Sipariş durumu sorgular |
| `getInstallmentRates()` | Taksit oranlarını getirir |
| `platformTransfer(params)` | Platform transfer işlemi yapar (Marketplace) |
| `getReturnedPayments(startDate, endDate)` | Geri dönen ödemeleri listeler |
| `sendReturnedPayment(transId, transfers)` | Geri dönen ödemeyi transfer eder |
| `verifyPlatformTransferCallback(callback)` | Platform transfer callback'ini doğrular |
| `getPaymentSummary(startDate, endDate)` | Ödeme özeti raporunu getirir |
| `getPaymentDetail(date)` | Belirli bir günün ödeme detaylarını getirir |

## 📝 Test Kartı

```
Kart Numarası: 9792030394440796
Son Kullanma: 12/24
CVV: 000
```

## 📄 Lisans

MIT
