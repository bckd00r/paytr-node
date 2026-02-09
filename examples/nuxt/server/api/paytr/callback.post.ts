import { PayTR, getErrorDescription } from 'paytr.js'

/**
 * PayTR Callback Handler - Nuxt Server Örneği
 * 
 * POST /api/paytr/callback
 * 
 * PayTR ödeme sonucunu bildirir.
 * Bu URL'i PayTR panelinden tanımlamanız gerekir.
 */

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // Runtime config'den PayTR credentials al
  const config = useRuntimeConfig()
  
  const paytr = new PayTR({
    merchantId: config.paytr.merchantId,
    merchantKey: config.paytr.merchantKey,
    merchantSalt: config.paytr.merchantSalt,
  })
  
  // Hash doğrulaması
  const isValid = paytr.verifyCallback(body)
  
  if (!isValid) {
    console.error('PayTR Callback: Invalid hash')
    return 'INVALID_HASH'
  }
  
  const {
    merchant_oid,
    status,
    total_amount,
    failed_reason_code,
    failed_reason_msg,
    test_mode,
    payment_type,
    currency,
    utoken,
  } = body
  
  console.log(`PayTR Callback: ${merchant_oid} - ${status}`)
  
  if (status === 'success') {
    // ✅ Ödeme başarılı
    try {
      // Veritabanında siparişi güncelle
      // await db.orders.update({
      //   where: { merchantOid: merchant_oid },
      //   data: { 
      //     status: 'paid',
      //     paidAmount: parseInt(total_amount) / 100, // Kuruştan TL'ye
      //     paymentType: payment_type,
      //     currency,
      //     paidAt: new Date(),
      //   }
      // })
      
      // Kullanıcı kart saklamışsa utoken'ı kaydet
      if (utoken) {
        // await db.users.update({
        //   where: { ... },
        //   data: { paytrUtoken: utoken }
        // })
      }
      
      console.log(`✅ Order ${merchant_oid} marked as paid`)
    } catch (error) {
      console.error('Database error:', error)
    }
  } else {
    // ❌ Ödeme başarısız
    const errorDescription = getErrorDescription(failed_reason_code || '0', 'callback')
    
    console.log(`❌ Order ${merchant_oid} failed: ${failed_reason_msg || errorDescription}`)
    
    // Veritabanında siparişi güncelle
    // await db.orders.update({
    //   where: { merchantOid: merchant_oid },
    //   data: { 
    //     status: 'failed',
    //     failedReason: failed_reason_msg || errorDescription,
    //     failedReasonCode: failed_reason_code,
    //   }
    // })
  }
  
  // PayTR'a "OK" dönmezseniz bildirim tekrarlanır!
  return 'OK'
})
