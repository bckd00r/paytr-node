import { PayTR, getErrorDescription } from 'paytr.js'
import { z } from 'zod'

/**
 * PayTR Ödeme API Route - Nuxt Server Örneği
 * 
 * POST /api/paytr/payment
 * 
 * Bu endpoint, frontend'den gelen ödeme isteğini alır,
 * PayTR Direct API ile işler ve sonucu döndürür.
 * 
 * ⚠️ DİKKAT: Bu yaklaşım PCI-DSS uyumluluğu gerektirir!
 */

// Request body validation schema
const paymentSchema = z.object({
  cardInfo: z.object({
    ccOwner: z.string().min(3),
    cardNumber: z.string().min(13).max(19),
    expiryMonth: z.string().length(2),
    expiryYear: z.string().length(2),
    cvv: z.string().min(3).max(4),
  }),
  email: z.string().email(),
  user: z.object({
    name: z.string().min(2),
    phone: z.string().min(10),
    address: z.string().min(5),
  }),
  paymentAmount: z.number().positive(),
  currency: z.enum(['TL', 'USD', 'EUR']).default('TL'),
  basketItems: z.array(z.object({
    name: z.string(),
    price: z.number(),
    quantity: z.number(),
  })),
  merchantOkUrl: z.string().url(),
  merchantFailUrl: z.string().url(),
  installmentCount: z.number().min(0).max(12).default(0),
})

export default defineEventHandler(async (event) => {
  // Request body parse et
  const body = await readBody(event)
  
  // Validation
  const parseResult = paymentSchema.safeParse(body)
  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      message: 'Geçersiz istek: ' + parseResult.error.issues[0].message,
    })
  }
  
  const data = parseResult.data
  
  // Runtime config'den PayTR credentials al
  const config = useRuntimeConfig()
  
  // PayTR instance oluştur
  const paytr = new PayTR({
    merchantId: config.paytr.merchantId,
    merchantKey: config.paytr.merchantKey,
    merchantSalt: config.paytr.merchantSalt,
    testMode: config.paytr.testMode === 'true',
    debugMode: config.paytr.debugMode === 'true',
    language: 'tr',
  })
  
  // Benzersiz sipariş numarası oluştur
  const merchantOid = `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  
  // Kullanıcı IP'sini al
  const userIp = getRequestIP(event, { xForwardedFor: true }) || '127.0.0.1'
  
  try {
    // Direct API ile ödeme yap
    const result = await paytr.processDirectPayment({
      merchantOid,
      email: data.email,
      paymentAmount: data.paymentAmount,
      currency: data.currency,
      basketItems: data.basketItems,
      user: data.user,
      userIp,
      merchantOkUrl: data.merchantOkUrl,
      merchantFailUrl: data.merchantFailUrl,
      installmentCount: data.installmentCount,
      cardInfo: data.cardInfo,
    })
    
    // Sonucu döndür
    if (result.status === 'redirect') {
      return {
        status: 'redirect',
        redirectHtml: result.redirectHtml,
        merchantOid,
      }
    }
    
    if (result.status === 'success') {
      // Veritabanına sipariş kaydı oluştur
      // await db.orders.create({ merchantOid, status: 'pending', ... })
      
      return {
        status: 'success',
        merchantOid,
        message: 'Ödeme başarıyla tamamlandı',
      }
    }
    
    // Hata durumu
    return {
      status: 'error',
      errMsg: result.errMsg || 'Ödeme başarısız',
      errCode: undefined, // PayTR error code if available
      merchantOid,
    }
  } catch (error: any) {
    console.error('PayTR Error:', error)
    
    throw createError({
      statusCode: 500,
      message: error.message || 'Ödeme işlemi sırasında bir hata oluştu',
    })
  }
})
