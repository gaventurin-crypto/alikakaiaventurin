import { CartItem, Coupon } from '../types';

export const FREE_SHIPPING_THRESHOLD = 500000;

export function getCartSubtotal(cartItems: CartItem[]) {
  return cartItems.reduce((sum, item) => {
    const hasDiscount = item.product.discount && item.product.discount > 0;
    const finalPrice = hasDiscount
      ? item.product.price * (1 - (item.product.discount || 0) / 100)
      : item.product.price;
    return sum + finalPrice * item.quantity;
  }, 0);
}

export function getCouponDiscount(subtotal: number, coupon: Coupon | null | undefined) {
  if (!coupon) return 0;
  return coupon.type === 'percent'
    ? Math.floor((subtotal * coupon.value) / 100)
    : coupon.value;
}

export function getShippingCost(
  subtotal: number,
  shippingMethod: 'post' | 'express',
  shippingCostSetting: number
) {
  if (subtotal >= FREE_SHIPPING_THRESHOLD || subtotal === 0) {
    return 0;
  }
  return shippingMethod === 'express'
    ? Math.round(shippingCostSetting * 1.5)
    : shippingCostSetting;
}

export function getTaxAmount(subtotal: number, discountAmount: number, taxPercent: number) {
  return Math.round(Math.max(subtotal - discountAmount, 0) * (taxPercent / 100));
}

export function getCartTotal(
  subtotal: number,
  discountAmount: number,
  shippingCost: number,
  taxAmount: number
) {
  return Math.max(subtotal - discountAmount + shippingCost + taxAmount, 0);
}
