<script setup lang="ts">
/**
 * Ödeme Sayfası Örneği - Nuxt
 * 
 * pages/checkout.vue
 */

// 3D Secure yönlendirme için
const redirectContainer = ref<HTMLDivElement | null>(null)
const showRedirectModal = ref(false)

// Sepet verileri (gerçek uygulamada store'dan gelir)
const cartItems = [
  { name: 'Premium Üyelik', price: 299.99, quantity: 1 },
]

const totalAmount = computed(() => 
  cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
)

// Ödeme başarılı
function onPaymentSuccess(data: { merchantOid: string }) {
  console.log('Ödeme başarılı:', data.merchantOid)
  // Başarı sayfasına yönlendir
  navigateTo(`/order/success?oid=${data.merchantOid}`)
}

// Ödeme hatası
function onPaymentError(error: { message: string; code?: string }) {
  console.error('Ödeme hatası:', error)
  // Toast notification göster
  useToast().add({
    title: 'Ödeme Başarısız',
    description: error.message,
    color: 'red',
  })
}

// 3D Secure yönlendirme
function onRedirect(html: string) {
  showRedirectModal.value = true
  
  // Modal açıldıktan sonra HTML'i yükle
  nextTick(() => {
    if (redirectContainer.value) {
      redirectContainer.value.innerHTML = html
      
      // Form varsa otomatik submit et
      const form = redirectContainer.value.querySelector('form')
      if (form) {
        form.submit()
      }
    }
  })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
    <div class="container mx-auto px-4">
      <h1 class="text-2xl font-bold mb-8 text-center">Ödeme</h1>
      
      <!-- Ödeme Formu -->
      <PaymentForm
        :amount="totalAmount"
        currency="TL"
        :basket-items="cartItems"
        merchant-ok-url="https://yoursite.com/order/success"
        merchant-fail-url="https://yoursite.com/order/failed"
        @success="onPaymentSuccess"
        @error="onPaymentError"
        @redirect="onRedirect"
      />
      
      <!-- 3D Secure Modal -->
      <UModal v-model="showRedirectModal" :ui="{ width: 'sm:max-w-2xl' }">
        <UCard>
          <template #header>
            <div class="flex items-center">
              <UIcon name="i-heroicons-shield-check" class="mr-2 text-primary" />
              <span>3D Secure Doğrulama</span>
            </div>
          </template>
          
          <div 
            ref="redirectContainer" 
            class="min-h-[400px] flex items-center justify-center"
          >
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-2xl" />
            <span class="ml-2">Yönlendiriliyor...</span>
          </div>
        </UCard>
      </UModal>
    </div>
  </div>
</template>
