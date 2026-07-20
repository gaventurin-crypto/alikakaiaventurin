import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowLeft, Send, MapPin, Phone, User, Hash, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, Product } from '../types';
import { formatPersianPrice, formatPersianNumber } from './ProductCard';
import { PROVINCES } from '../data';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, variant: string, change: number) => void;
  onRemoveItem: (productId: string, variant: string) => void;
  onProceedToPayment: (customerData: {
    name: string;
    phone: string;
    province: string;
    city: string;
    postalCode: string;
    address: string;
  }) => void;
}

export default function CartSidebar({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToPayment,
}: CartSidebarProps) {
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Checkout Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');

  // Dynamically populated cities based on province selection
  const availableCities = PROVINCES.find((p) => p.name === selectedProvince)?.cities || [];

  // Reset form steps and errors when sidebar opens or closes
  useEffect(() => {
    if (isOpen) {
      setStep('cart');
      setErrorMsg('');
    }
  }, [isOpen]);

  const subtotal = cartItems.reduce((sum, item) => {
    const hasDiscount = item.product.discount && item.product.discount > 0;
    const finalPrice = hasDiscount
      ? item.product.price * (1 - (item.product.discount || 0) / 100)
      : item.product.price;
    return sum + finalPrice * item.quantity;
  }, 0);

  const shippingCost = subtotal >= 500000 || subtotal === 0 ? 0 : 35000;
  const total = subtotal + shippingCost;

  // Free shipping progress
  const freeShippingThreshold = 500000;
  const progressToFreeShipping = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const remainingForFreeShipping = Math.max(freeShippingThreshold - subtotal, 0);

  const handleQuantityChangeWithLimit = (productId: string, variant: string, change: number, currentQty: number, maxStock: number) => {
    setErrorMsg('');
    if (change > 0 && currentQty >= maxStock) {
      setErrorMsg(`حداکثر موجودی این کالا در انبار ${formatPersianNumber(maxStock)} عدد می‌باشد.`);
      return;
    }
    onUpdateQuantity(productId, variant, change);
  };

  const handleSubmitCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !phone || !selectedProvince || !selectedCity || !postalCode || !address) {
      setErrorMsg('لطفاً تمامی فیلدهای فرم آدرس و تحویل‌گیرنده را پر نمایید.');
      return;
    }
    if (phone.length < 11 || !/^09[0-9]{9}$/.test(phone)) {
      setErrorMsg('لطفاً شماره موبایل معتبر ۱۱ رقمی ایرانی (شروع با ۰۹) وارد نمایید.');
      return;
    }
    if (postalCode.length < 10) {
      setErrorMsg('کد پستی باید ۱۰ رقمی باشد.');
      return;
    }

    onProceedToPayment({
      name,
      phone,
      province: selectedProvince,
      city: selectedCity,
      postalCode,
      address,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark Backdrop overlay with sleek glass blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs"
          />

          {/* Cart Sidebar Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 240 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-slate-900 border-l border-slate-800 shadow-2xl text-slate-100"
            dir="rtl"
            id="cart-sidebar"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-5">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-gold-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {step === 'cart' ? 'سبد خرید شما' : 'اطلاعات تحویل‌گیرنده و آدرس'}
                </h3>
                <span className="rounded-full bg-gold-400/10 border border-gold-400/20 px-2.5 py-0.5 text-xs font-bold text-gold-400 font-en-nums">
                  {formatPersianNumber(cartItems.length)} کالا
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                id="btn-close-cart"
              >
                <X size={20} />
              </button>
            </div>

            {/* ERROR MSG BANNER */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-rose-500/10 border-b border-rose-500/20 px-5 py-3 text-xs text-rose-400 flex items-center gap-2 font-medium"
                >
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-5">
              {cartItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 py-10">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-400 mb-4 border border-gold-400/20 animate-pulse">
                    <ShoppingBag size={28} />
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm mb-1.5">سبد خرید شما خالی است</h4>
                  <p className="text-xs text-slate-400 leading-normal max-w-[240px]">
                    زیباترین زیورآلات و بدلیجات لوکس و مدرن آونتورین منتظر درخشش روی شما هستند!
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-6 rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 px-6 py-2.5 text-xs font-bold transition-all"
                  >
                    شروع خرید و گشت‌وگذار
                  </button>
                </div>
              ) : step === 'cart' ? (
                <div className="space-y-5">
                  {/* Free shipping progress indicator */}
                  <div className="bg-slate-950/40 rounded-2xl p-4 border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      {remainingForFreeShipping > 0 ? (
                        <>
                          <span className="text-slate-300">تا ارسال رایگان:</span>
                          <span className="text-gold-400 font-en-nums">{formatPersianPrice(remainingForFreeShipping)} دیگر</span>
                        </>
                      ) : (
                        <span className="text-emerald-400">تبریک! خرید شما مشمول ارسال رایگان شد 🎉</span>
                      )}
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-l from-gold-500 to-gold-300 transition-all duration-500"
                        style={{ width: `${progressToFreeShipping}%` }}
                      />
                    </div>
                  </div>

                  {/* Cart Items list */}
                  <div className="space-y-3.5">
                    {cartItems.map((item, idx) => {
                      const hasDiscount = item.product.discount && item.product.discount > 0;
                      const discountedPrice = hasDiscount
                        ? item.product.price * (1 - (item.product.discount || 0) / 100)
                        : item.product.price;
                      return (
                        <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 hover:border-slate-800 transition-colors">
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            className="h-20 w-20 rounded-xl object-cover border border-slate-800 shrink-0 bg-slate-900"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h4 className="truncate text-xs font-bold text-slate-100" title={item.product.title}>
                                {item.product.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                                  رنگ: {item.selectedVariant}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  قیمت واحد: <span className="font-en-nums text-slate-300">{formatPersianPrice(discountedPrice)}</span>
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/50">
                              {/* Quantity actions */}
                              <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-1">
                                <button
                                  onClick={() => handleQuantityChangeWithLimit(item.product.id, item.selectedVariant, 1, item.quantity, item.product.stock)}
                                  className="rounded p-1 text-slate-400 hover:text-gold-400 hover:bg-slate-800 transition-colors"
                                  id={`btn-plus-${item.product.id}-${item.selectedVariant}`}
                                >
                                  <Plus size={12} />
                                </button>
                                <span className="px-2.5 text-xs font-bold font-en-nums text-slate-200">
                                  {formatPersianNumber(item.quantity)}
                                </span>
                                <button
                                  onClick={() => handleQuantityChangeWithLimit(item.product.id, item.selectedVariant, -1, item.quantity, item.product.stock)}
                                  className="rounded p-1 text-slate-400 hover:text-gold-400 hover:bg-slate-800 transition-colors"
                                  id={`btn-minus-${item.product.id}-${item.selectedVariant}`}
                                >
                                  <Minus size={12} />
                                </button>
                              </div>

                              <div className="text-left">
                                <span className="block text-[9px] text-slate-500">قیمت کل:</span>
                                <span className="text-xs font-extrabold text-gold-400 font-en-nums">
                                  {formatPersianPrice(discountedPrice * item.quantity)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => onRemoveItem(item.product.id, item.selectedVariant)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-rose-500 transition-colors shrink-0 self-start"
                            id={`btn-remove-${item.product.id}-${item.selectedVariant}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* CHECKOUT STEP FORM */
                <form onSubmit={handleSubmitCheckout} className="space-y-4" id="checkout-form">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                      <User size={14} className="text-gold-400" />
                      نام و نام خانوادگی گیرنده *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => { setErrorMsg(''); setName(e.target.value); }}
                      placeholder="مثال: مریم محمدی"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-gold-500 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                      <Phone size={14} className="text-gold-400" />
                      شماره تلفن همراه (برای هماهنگی ارسال) *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={11}
                      value={phone}
                      onChange={(e) => { setErrorMsg(''); setPhone(e.target.value.replace(/[^0-9]/g, '')); }}
                      placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-gold-500 transition-all text-left placeholder:text-slate-600 font-mono"
                      dir="ltr"
                    />
                  </div>

                  {/* Province and City Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                        <MapPin size={14} className="text-gold-400" />
                        استان *
                      </label>
                      <select
                        required
                        value={selectedProvince}
                        onChange={(e) => {
                          setErrorMsg('');
                          setSelectedProvince(e.target.value);
                          setSelectedCity('');
                        }}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none focus:border-gold-500 transition-all"
                      >
                        <option value="">انتخاب کنید</option>
                        {PROVINCES.map((p) => (
                          <option key={p.name} value={p.name} className="bg-slate-900">{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                        <MapPin size={14} className="text-gold-400" />
                        شهر *
                      </label>
                      <select
                        required
                        disabled={!selectedProvince}
                        value={selectedCity}
                        onChange={(e) => { setErrorMsg(''); setSelectedCity(e.target.value); }}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none focus:border-gold-500 transition-all disabled:opacity-50"
                      >
                        <option value="">انتخاب کنید</option>
                        {availableCities.map((c) => (
                          <option key={c} value={c} className="bg-slate-900">{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                      <Hash size={14} className="text-gold-400" />
                      کد پستی (۱۰ رقمی) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={postalCode}
                      onChange={(e) => { setErrorMsg(''); setPostalCode(e.target.value.replace(/[^0-9]/g, '')); }}
                      placeholder="مثال: ۱۴۷۸۹۶۵۴۱۲"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-gold-500 transition-all text-left placeholder:text-slate-600 font-mono"
                      dir="ltr"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
                      <MapPin size={14} className="text-gold-400" />
                      نشانی دقیق پستی تحویل *
                    </label>
                    <textarea
                      required
                      value={address}
                      onChange={(e) => { setErrorMsg(''); setAddress(e.target.value); }}
                      placeholder="خیابان، کوچه، پلاک، طبقه، واحد"
                      rows={3}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none focus:border-gold-500 transition-all resize-none placeholder:text-slate-600"
                    />
                  </div>
                </form>
              )}
            </div>

            {/* DRAWER FOOTER */}
            {cartItems.length > 0 && (
              <div className="border-t border-slate-800 p-5 bg-slate-950/40">
                <div className="space-y-2.5 mb-4 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>جمع کل سبد خرید:</span>
                    <span className="font-semibold font-en-nums text-slate-200">{formatPersianPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>هزینه پست و دسته‌بندی:</span>
                    <span className="font-semibold font-en-nums text-slate-200">
                      {shippingCost === 0 ? 'رایگان' : formatPersianPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-100 font-bold text-sm border-t border-slate-800 pt-2.5">
                    <span>مبلغ نهایی قابل پرداخت:</span>
                    <span className="text-gold-400 text-base font-extrabold font-en-nums">{formatPersianPrice(total)}</span>
                  </div>
                </div>

                {step === 'cart' ? (
                  <button
                    onClick={() => setStep('checkout')}
                    className="w-full rounded-xl bg-gold-500 hover:bg-gold-400 text-slate-950 font-extrabold py-3.5 text-sm transition-all shadow-lg shadow-gold-500/10 flex items-center justify-center gap-2 cursor-pointer"
                    id="btn-proceed-checkout"
                  >
                    <span>ثبت اطلاعات و ادامه خرید</span>
                    <ArrowLeft size={16} />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep('cart')}
                      className="rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-3.5 text-sm font-medium transition-colors"
                      id="btn-back-to-cart"
                    >
                      بازگشت
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitCheckout}
                      className="flex-1 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-slate-950 font-extrabold py-3.5 text-sm transition-all shadow-lg shadow-gold-500/10 flex items-center justify-center gap-2 cursor-pointer"
                      id="btn-submit-to-shaparak"
                    >
                      <Send size={16} />
                      <span>پرداخت و ثبت سفارش</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
