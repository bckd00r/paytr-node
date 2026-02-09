<script setup lang="ts">
/**
 * PayTR Ödeme Formu - Nuxt UI Örneği
 * 
 * Bu component, PayTR Direct API ile ödeme formunu gösterir.
 * Kart bilgileri toplanır ve server API'ye gönderilir.
 * 
 * ⚠️ DİKKAT: Bu yaklaşım PCI-DSS uyumluluğu gerektirir!
 * Çoğu proje için iframe/redirect yaklaşımı önerilir.
 */

import { z } from 'zod'
import type { FormSubmitEvent } from '#ui/types'

// Form validation schema
const cardSchema = z.object({
  ccOwner: z.string().min(3, 'Kart sahibi adı en az 3 karakter olmalı'),
  cardNumber: z.string()
    .min(13, 'Kart numarası en az 13 hane olmalı')
    .max(19, 'Kart numarası en fazla 19 hane olmalı')
    .regex(/^\d+$/, 'Sadece rakam giriniz'),
  expiryMonth: z.string()
    .length(2, 'Ay 2 hane olmalı')
    .regex(/^(0[1-9]|1[0-2])$/, 'Geçerli bir ay giriniz (01-12)'),
  expiryYear: z.string()
    .length(2, 'Yıl 2 hane olmalı')
    .regex(/^\d{2}$/, 'Geçerli bir yıl giriniz'),
  cvv: z.string()
    .min(3, 'CVV en az 3 hane olmalı')
    .max(4, 'CVV en fazla 4 hane olmalı')
    .regex(/^\d+$/, 'Sadece rakam giriniz'),
  email: z.string().email('Geçerli bir e-posta giriniz'),
  userName: z.string().min(2, 'Ad Soyad giriniz'),
  userPhone: z.string().min(10, 'Telefon numarası giriniz'),
  userAddress: z.string().min(5, 'Adres giriniz'),
  installmentCount: z.number().min(0).max(12).default(0),
})

type CardFormData = z.output<typeof cardSchema>

// Props
const props = defineProps<{
  amount: number
  currency?: 'TL' | 'USD' | 'EUR'
  basketItems: Array<{ name: string; price: number; quantity: number }>
  merchantOkUrl: string
  merchantFailUrl: string
}>()

// Emits
const emit = defineEmits<{
  success: [data: { merchantOid: string }]
  error: [error: { message: string; code?: string }]
  redirect: [html: string]
}>()

// State
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

const formState = reactive<Partial<CardFormData>>({
  ccOwner: '',
  cardNumber: '',
  expiryMonth: '',
  expiryYear: '',
  cvv: '',
  email: '',
  userName: '',
  userPhone: '',
  userAddress: '',
  installmentCount: 0,
})

// Taksit seçenekleri
const installmentOptions = [
  { label: 'Tek Çekim', value: 0 },
  { label: '2 Taksit', value: 2 },
  { label: '3 Taksit', value: 3 },
  { label: '6 Taksit', value: 6 },
  { label: '9 Taksit', value: 9 },
  { label: '12 Taksit', value: 12 },
]

// Kart numarasını formatla (1234 5678 9012 3456)
const formatCardNumber = (value: string) => {
  const numbers = value.replace(/\D/g, '')
  formState.cardNumber = numbers
}

// Kart numarasını görsel olarak formatla
const displayCardNumber = computed(() => {
  if (!formState.cardNumber) return ''
  return formState.cardNumber.match(/.{1,4}/g)?.join(' ') || ''
})

// Form gönderimi
async function onSubmit(event: FormSubmitEvent<CardFormData>) {
  isLoading.value = true
  errorMessage.value = null
  
  try {
    const response = await $fetch('/api/paytr/payment', {
      method: 'POST',
      body: {
        cardInfo: {
          ccOwner: event.data.ccOwner,
          cardNumber: event.data.cardNumber,
          expiryMonth: event.data.expiryMonth,
          expiryYear: event.data.expiryYear,
          cvv: event.data.cvv,
        },
        email: event.data.email,
        user: {
          name: event.data.userName,
          phone: event.data.userPhone,
          address: event.data.userAddress,
        },
        paymentAmount: props.amount,
        currency: props.currency || 'TL',
        basketItems: props.basketItems,
        merchantOkUrl: props.merchantOkUrl,
        merchantFailUrl: props.merchantFailUrl,
        installmentCount: event.data.installmentCount,
      }
    })
    
    if (response.status === 'redirect' && response.redirectHtml) {
      emit('redirect', response.redirectHtml)
    } else if (response.status === 'success') {
      emit('success', { merchantOid: response.merchantOid! })
    } else {
      errorMessage.value = response.errMsg || 'Ödeme başarısız'
      emit('error', { message: response.errMsg || 'Ödeme başarısız', code: response.errCode })
    }
  } catch (error: any) {
    const message = error.data?.message || error.message || 'Bir hata oluştu'
    errorMessage.value = message
    emit('error', { message })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UCard class="max-w-lg mx-auto">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Ödeme Bilgileri</h3>
        <UBadge color="primary" variant="soft">
          {{ amount.toFixed(2) }} {{ currency || 'TL' }}
        </UBadge>
      </div>
    </template>

    <UForm 
      :schema="cardSchema" 
      :state="formState" 
      class="space-y-4"
      @submit="onSubmit"
    >
      <!-- Hata Mesajı -->
      <UAlert 
        v-if="errorMessage" 
        color="red" 
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        :title="errorMessage"
        :close-button="{ icon: 'i-heroicons-x-mark', color: 'red', variant: 'link' }"
        @close="errorMessage = null"
      />

      <!-- Kart Bilgileri -->
      <div class="space-y-4">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Kart Bilgileri
        </h4>
        
        <UFormGroup label="Kart Üzerindeki İsim" name="ccOwner" required>
          <UInput 
            v-model="formState.ccOwner" 
            placeholder="KART SAHİBİ ADI"
            :disabled="isLoading"
            class="uppercase"
          />
        </UFormGroup>

        <UFormGroup label="Kart Numarası" name="cardNumber" required>
          <UInput 
            :model-value="displayCardNumber"
            placeholder="1234 5678 9012 3456"
            :disabled="isLoading"
            maxlength="19"
            @update:model-value="formatCardNumber"
          >
            <template #leading>
              <UIcon name="i-heroicons-credit-card" class="text-gray-400" />
            </template>
          </UInput>
        </UFormGroup>

        <div class="grid grid-cols-3 gap-4">
          <UFormGroup label="Ay" name="expiryMonth" required>
            <UInput 
              v-model="formState.expiryMonth" 
              placeholder="MM"
              maxlength="2"
              :disabled="isLoading"
            />
          </UFormGroup>

          <UFormGroup label="Yıl" name="expiryYear" required>
            <UInput 
              v-model="formState.expiryYear" 
              placeholder="YY"
              maxlength="2"
              :disabled="isLoading"
            />
          </UFormGroup>

          <UFormGroup label="CVV" name="cvv" required>
            <UInput 
              v-model="formState.cvv" 
              type="password"
              placeholder="***"
              maxlength="4"
              :disabled="isLoading"
            />
          </UFormGroup>
        </div>

        <UFormGroup label="Taksit" name="installmentCount">
          <USelect 
            v-model="formState.installmentCount"
            :options="installmentOptions"
            option-attribute="label"
            value-attribute="value"
            :disabled="isLoading"
          />
        </UFormGroup>
      </div>

      <UDivider />

      <!-- Müşteri Bilgileri -->
      <div class="space-y-4">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Müşteri Bilgileri
        </h4>

        <UFormGroup label="E-posta" name="email" required>
          <UInput 
            v-model="formState.email" 
            type="email"
            placeholder="ornek@email.com"
            :disabled="isLoading"
          >
            <template #leading>
              <UIcon name="i-heroicons-envelope" class="text-gray-400" />
            </template>
          </UInput>
        </UFormGroup>

        <UFormGroup label="Ad Soyad" name="userName" required>
          <UInput 
            v-model="formState.userName" 
            placeholder="Adınız Soyadınız"
            :disabled="isLoading"
          />
        </UFormGroup>

        <UFormGroup label="Telefon" name="userPhone" required>
          <UInput 
            v-model="formState.userPhone" 
            placeholder="05XX XXX XXXX"
            :disabled="isLoading"
          >
            <template #leading>
              <UIcon name="i-heroicons-phone" class="text-gray-400" />
            </template>
          </UInput>
        </UFormGroup>

        <UFormGroup label="Adres" name="userAddress" required>
          <UTextarea 
            v-model="formState.userAddress" 
            placeholder="Fatura adresi"
            :rows="2"
            :disabled="isLoading"
          />
        </UFormGroup>
      </div>

      <UButton 
        type="submit" 
        block 
        size="lg"
        :loading="isLoading"
        :disabled="isLoading"
      >
        <template #leading>
          <UIcon name="i-heroicons-lock-closed" />
        </template>
        Güvenli Ödeme Yap
      </UButton>
    </UForm>

    <template #footer>
      <p class="text-xs text-gray-500 text-center">
        <UIcon name="i-heroicons-shield-check" class="inline mr-1" />
        Ödemeniz PayTR güvencesi ile şifrelenerek işlenmektedir.
      </p>
    </template>
  </UCard>
</template>
