/**
 * PayTR Utility Functions
 */

import * as crypto from 'crypto';
import { HEADERS } from './constants';
import { BasketItem, PayTRError } from './types';

/**
 * HMAC SHA256 ile token oluşturur
 * @param merchantKey - Mağaza API anahtarı
 * @param data - Hash'lenecek veri
 * @returns Base64 encoded token
 */
export function generateToken(merchantKey: string, data: string): string {
  return crypto
    .createHmac('sha256', merchantKey)
    .update(data)
    .digest('base64');
}

/**
 * PayTR API'ye POST isteği gönderir
 * @param url - API endpoint URL'i
 * @param formData - Form verileri
 * @returns API yanıtı
 */
export async function apiRequest<T>(
  url: string,
  formData: Record<string, string>
): Promise<T> {
  const body = new URLSearchParams(formData);

  const response = await fetch(url, {
    method: 'POST',
    headers: HEADERS,
    body: body.toString(),
  });

  if (!response.ok) {
    throw new PayTRError(
      `HTTP error: ${response.status} ${response.statusText}`,
      'HTTP_ERROR',
      { status: response.status }
    );
  }

  const text = await response.text();
  
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new PayTRError(
      'Invalid JSON response from PayTR API',
      'PARSE_ERROR',
      { response: text }
    );
  }
}

/**
 * Tutarı PayTR formatına çevirir (kuruş olarak)
 * Örn: 100.99 -> "10099"
 * @param amount - Tutar (TL/USD/EUR)
 * @returns Kuruş cinsinden string
 */
export function formatAmount(amount: number): string {
  // PayTR, tutarı kuruş cinsinden bekler
  // 100.99 TL = 10099 kuruş
  return Math.round(amount * 100).toString();
}

/**
 * Tutarı ondalık formatına çevirir
 * Örn: 100.99 -> "100.99"
 * @param amount - Tutar
 * @returns String tutar
 */
export function formatDecimalAmount(amount: number): string {
  return amount.toFixed(2);
}

/**
 * Sepet içeriğini PayTR formatına çevirir
 * @param items - Sepet ürünleri
 * @returns JSON encoded basket string
 */
export function formatBasket(items: BasketItem[]): string {
  const basketArray = items.map((item) => [
    item.name,
    typeof item.price === 'number' ? item.price.toFixed(2) : item.price,
    item.quantity,
  ]);
  return JSON.stringify(basketArray);
}

/**
 * Benzersiz request ID oluşturur
 * @returns Benzersiz ID
 */
export function generateRequestId(): string {
  return `${Date.now()}${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Tarih formatlar (YYYY-MM-DD HH:mm:ss)
 * @param date - Tarih objesi
 * @returns Formatlanmış tarih string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Boolean değeri PayTR formatına çevirir
 * @param value - Boolean değer
 * @returns '1' veya '0'
 */
export function boolToString(value: boolean | undefined): string {
  return value ? '1' : '0';
}
